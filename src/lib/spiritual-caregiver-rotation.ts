/**
 * Chaplain callback rotation — picks the least-recently-contacted
 * active caregiver, preferring someone whose languages list includes
 * the patient's locale. Updates lastContactedAt on the chosen row so
 * the next request goes to someone else.
 *
 * RACE NOTE: two simultaneous requests both read-then-update the same
 * row, so a concurrent burst may pick the same caregiver twice. At
 * the current scale (small volunteer team, low traffic) this is
 * acceptable — revisit with a DB-level atomic claim (e.g. UPDATE …
 * RETURNING) if Pedro scales the team past a handful of active
 * caregivers.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type { SupportedLocale } from '@/lib/spiritual-care-types'

export interface AssignedCaregiver {
  id: string | number
  name: string
  phone: string
  email?: string
}

export async function assignNextCaregiver(
  locale: SupportedLocale,
): Promise<AssignedCaregiver | null> {
  const payload = await getPayload({ config })

  // Oldest lastContactedAt first; null/undefined sorts as "never contacted"
  // which is what we want at the top of the list.
  const res = await payload.find({
    collection: 'spiritual-caregivers',
    where: { isActive: { equals: true } },
    sort: 'lastContactedAt',
    limit: 10,
    overrideAccess: true,
  })
  const rows = res.docs as Array<{
    id: string | number
    name: string
    phone: string
    email?: string
    languages?: string[]
  }>
  if (rows.length === 0) return null

  const langMatch = rows.find((r) => (r.languages ?? []).includes(locale))
  const chosen = langMatch ?? rows[0]

  // Stamp lastContactedAt so the next request rotates. Best-effort —
  // if the update fails we still return the assignment; the worst
  // case is the same caregiver gets the next call too.
  try {
    await payload.update({
      collection: 'spiritual-caregivers',
      id: chosen.id,
      data: { lastContactedAt: new Date().toISOString() },
      overrideAccess: true,
    })
  } catch (err) {
    console.warn('[spiritual-care] failed to stamp lastContactedAt:', (err as Error).message)
  }

  return { id: chosen.id, name: chosen.name, phone: chosen.phone, email: chosen.email }
}
