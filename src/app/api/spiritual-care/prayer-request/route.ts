/**
 * POST /api/spiritual-care/prayer-request
 *
 * Accepts { name?, email, message, locale? } from the prayer-request
 * form. Persists a row to the SpiritualCareRequests collection and
 * (if an email provider is configured) notifies the spiritual care
 * team. Email delivery is intentionally a graceful no-op when SMTP
 * / Resend isn't configured — the request is still captured in the
 * CMS and staff can process it manually from the Payload admin.
 *
 * Rate-limited to 5 submissions/IP/minute. Payload write uses
 * overrideAccess because the collection locks public reads.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { notifySpiritualCareTeam } from '@/lib/spiritual-care-email'
import { normalizeLocale } from '@/lib/spiritual-care-types'

export const maxDuration = 20

const MESSAGE_MAX = 4000
const NAME_MAX = 120
const EMAIL_MAX = 254
const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    // Tighter rate limit than /evaluate — forms should never fire 60/min.
    const ip = getClientIp(request)
    const { allowed } = rateLimit(`spiritual-prayer:${ip}`)
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
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, EMAIL_MAX) : ''
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, MESSAGE_MAX) : ''
    const locale = normalizeLocale(body.locale)

    if (!email || !VALID_EMAIL.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ error: 'A prayer message is required.' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const created = await payload.create({
      collection: 'spiritual-care-requests',
      data: {
        requestType: 'prayer',
        name,
        email,
        message,
        locale,
      },
      overrideAccess: true,
    })

    // Fire-and-forget email notification. Awaited so Vercel doesn't
    // freeze the runtime before the mail is sent, but wrapped in
    // try/catch so a failing provider doesn't break form submission.
    try {
      await notifySpiritualCareTeam({
        type: 'prayer',
        name,
        email,
        message,
        locale,
        requestId: String(created.id),
      })
    } catch (err) {
      console.error('[spiritual-care] email notify failed:', (err as Error).message)
    }

    return NextResponse.json({ ok: true, id: created.id })
  } catch (err) {
    console.error('[spiritual-care/prayer-request] unexpected:', (err as Error).message)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
