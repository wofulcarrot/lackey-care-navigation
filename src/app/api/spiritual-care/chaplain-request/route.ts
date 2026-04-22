/**
 * POST /api/spiritual-care/chaplain-request
 *
 * Phone + optional name/message. Stores the row, picks a caregiver
 * from the rotation, stamps that caregiver's lastContactedAt so the
 * next request goes to someone else, and fires the notification
 * email (graceful no-op if provider not configured).
 *
 * Phone is normalized to digits-only for storage but echoed with
 * whatever formatting the patient typed in the notification email so
 * the caregiver sees it the way the patient wrote it.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { notifySpiritualCareTeam } from '@/lib/spiritual-care-email'
import { assignNextCaregiver } from '@/lib/spiritual-caregiver-rotation'
import { normalizeLocale } from '@/lib/spiritual-care-types'

export const maxDuration = 20

const NAME_MAX = 120
const PHONE_MAX = 40
const MESSAGE_MAX = 2000

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { allowed } = rateLimit(`spiritual-chaplain:${ip}`)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, NAME_MAX) : undefined
    const phoneRaw = typeof body.phone === 'string' ? body.phone.trim().slice(0, PHONE_MAX) : ''
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, MESSAGE_MAX) : undefined
    const locale = normalizeLocale(body.locale)

    const digits = phoneRaw.replace(/\D/g, '')
    if (digits.length < 10) {
      return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Assign first so we can persist the caregiver link with the request.
    // Defensive: if the rotation is empty (Pedro hasn't seeded yet),
    // assignNextCaregiver returns null and we just skip the link.
    const assigned = await assignNextCaregiver(locale).catch(() => null)

    // Postgres-backed Payload always returns numeric IDs, but the rotation
    // helper types them as string | number for DB-adapter portability.
    // Narrow here so the generated collection type accepts it.
    const contactedBy = typeof assigned?.id === 'number' ? assigned.id : undefined
    const created = await payload.create({
      collection: 'spiritual-care-requests',
      data: {
        requestType: 'chaplain',
        name,
        phone: phoneRaw, // keep the patient's formatting
        message,
        locale,
        contactedBy,
      },
      overrideAccess: true,
    })

    try {
      await notifySpiritualCareTeam({
        type: 'chaplain',
        name,
        phone: phoneRaw,
        message,
        locale,
        requestId: String(created.id),
        // Pass the caregiver's email so the notifier skips its own
        // rotation lookup — saves one DB round-trip per submit.
        recipientOverride: assigned?.email,
      })
    } catch (err) {
      console.error('[spiritual-care] email notify failed:', (err as Error).message)
    }

    return NextResponse.json({ ok: true, id: created.id })
  } catch (err) {
    console.error('[spiritual-care/chaplain-request] unexpected:', (err as Error).message)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
