// @ts-nocheck — seed script runs via tsx, not tsc
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Generate realistic-looking triage session data for the CEO dashboard preview.
 * Distributes sessions across the last 60 days with day-of-week and hour-of-day
 * patterns that mirror actual safety-net clinic usage (evening + weekend heavy).
 */

const DAYS_BACK = 60
const SESSIONS_PER_DAY_WEEKDAY = 14
const SESSIONS_PER_DAY_WEEKEND = 22

// Hourly weight profile: evenings/late nights get highest weight, mornings lowest
const HOURLY_WEIGHTS = [
  0.5, 0.3, 0.2, 0.2, 0.3, 0.5, // 0-5 (late night - low)
  1.0, 1.5, 2.0, 1.8, 1.5, 1.3, // 6-11 (morning ramp)
  1.5, 1.8, 1.7, 1.5, 1.5, 1.7, // 12-17 (afternoon)
  2.5, 3.0, 3.2, 2.8, 2.0, 1.2, // 18-23 (evening peak)
]

function pickWeighted<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const it of items) {
    r -= it.weight
    if (r <= 0) return it.value
  }
  return items[items.length - 1].value
}

function pickHour(): number {
  const items = HOURLY_WEIGHTS.map((w, i) => ({ value: i, weight: w }))
  return pickWeighted(items)
}

async function main() {
  // SAFETY: this script writes ~hundreds of fake triage rows and is intended
  // ONLY for demo / dashboard-preview environments. Refuse to run if
  // NODE_ENV=production so an operator cannot accidentally pollute the live
  // analytics database by running `npm run seed:sample` against prod.
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[sample-sessions] Refusing to run: NODE_ENV=production. ' +
        'This script generates fake analytics data and must not run against a production database.',
    )
    process.exit(1)
  }

  const payload = await getPayload({ config })

  const careTypesRes = await payload.find({ collection: 'care-types', limit: 100 })
  const urgencyRes = await payload.find({ collection: 'urgency-levels', limit: 100 })
  const resourcesRes = await payload.find({ collection: 'care-resources', limit: 100 })

  const careTypes = careTypesRes.docs
  const urgencyLevels = urgencyRes.docs
  const resources = resourcesRes.docs

  if (careTypes.length === 0 || urgencyLevels.length === 0 || resources.length === 0) {
    console.error('No seed data found. Run `npm run seed` first.')
    process.exit(1)
  }

  const byResourceType: Record<string, typeof resources> = {}
  for (const r of resources) {
    byResourceType[r.type] = byResourceType[r.type] ?? []
    byResourceType[r.type].push(r)
  }

  const now = new Date()
  let created = 0

  console.log(`Generating ~${((SESSIONS_PER_DAY_WEEKDAY * 5 + SESSIONS_PER_DAY_WEEKEND * 2) / 7 * DAYS_BACK)} sample sessions...`)

  for (let daysAgo = 0; daysAgo < DAYS_BACK; daysAgo++) {
    const day = new Date(now)
    day.setDate(day.getDate() - daysAgo)
    const dow = day.getDay()
    const isWeekend = dow === 0 || dow === 6
    const count = isWeekend ? SESSIONS_PER_DAY_WEEKEND : SESSIONS_PER_DAY_WEEKDAY

    // Add some day-to-day variance
    const actualCount = Math.max(3, Math.round(count + (Math.random() - 0.5) * 8))

    for (let i = 0; i < actualCount; i++) {
      const when = new Date(day)
      when.setHours(pickHour(), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0)
      if (when > now) continue

      // Care type weight: medical dominates, then BH and dental
      const careType = pickWeighted(
        careTypes.map((ct) => {
          const name = (ct.name || '').toLowerCase()
          let weight = 1
          if (name.includes('medical')) weight = 4
          else if (name.includes('behavioral')) weight = 2.5
          else if (name.includes('dental')) weight = 2
          else if (name.includes('medication')) weight = 1.5
          else if (name.includes('vision')) weight = 0.7
          else if (name.includes('chronic')) weight = 1.2
          else if (name.includes('not sure')) weight = 1.5
          return { value: ct, weight }
        }),
      )

      // Urgency distribution: mostly routine/semi-urgent
      const urgency = pickWeighted(
        urgencyLevels.map((u) => {
          const name = (u.name || '').toLowerCase()
          let weight = 1
          if (name.includes('routine') || name.includes('low')) weight = 4
          else if (name.includes('same') || name.includes('semi')) weight = 3
          else if (name.includes('urgent') && !name.includes('non')) weight = 1.5
          else if (name.includes('emergency') || name.includes('immediate')) weight = 0.4
          return { value: u, weight }
        }),
      )

      // ~85% complete, ~10% abandon, ~5% hit emergency screen
      const r = Math.random()
      const emergencyTriggered = r < 0.05
      const completed = !emergencyTriggered && r < 0.9

      // Virtual care offered ~40% of completed non-emergency sessions
      const virtualOffered = completed && !emergencyTriggered && Math.random() < 0.4

      // Locale: 78% EN, 22% ES
      const locale = Math.random() < 0.78 ? 'en' : 'es'

      // Device: 64% mobile, 30% desktop, 6% tablet
      const devR = Math.random()
      const device = devR < 0.64 ? 'mobile' : devR < 0.94 ? 'desktop' : 'tablet'

      // Resources shown: pick 1-3 from appropriate types based on routing
      let pickedResources: typeof resources = []
      if (emergencyTriggered) {
        pickedResources = (byResourceType.er ?? []).slice(0, 2)
      } else if (completed) {
        if (virtualOffered) {
          pickedResources = byResourceType.virtual ?? []
        }
        // Also add 1-2 in-person options as backups
        const pool = [
          ...(byResourceType.primary_care ?? []),
          ...(byResourceType.urgent_care ?? []),
          ...(byResourceType.behavioral_health ?? []),
          ...(byResourceType.dental ?? []),
          ...(byResourceType.health_department ?? []),
        ]
        const shuffled = [...pool].sort(() => Math.random() - 0.5)
        pickedResources = [...pickedResources, ...shuffled.slice(0, 1 + Math.floor(Math.random() * 2))]
      }

      await payload.create({
        collection: 'triage-sessions',
        data: {
          sessionId: `sample-${when.getTime()}-${i}`,
          careTypeSelected: careType.id,
          urgencyResult: urgency.id,
          resourcesShown: pickedResources.map((r) => r.id),
          virtualCareOffered: virtualOffered,
          emergencyScreenTriggered: emergencyTriggered,
          completedFlow: completed,
          locale,
          device,
          questionSetVersion: 1,
          createdAt: when.toISOString(),
          updatedAt: when.toISOString(),
        },
      })
      created++
    }
  }

  console.log(`Created ${created} sample sessions across ${DAYS_BACK} days.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Sample session generation failed:', err)
  process.exit(1)
})
