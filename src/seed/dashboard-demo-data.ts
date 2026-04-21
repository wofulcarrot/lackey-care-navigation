/**
 * Populate Neon with realistic demo TriageSessions + TriageEvents so
 * the executive dashboard renders as a populated product rather than a
 * mostly-empty skeleton during stakeholder demos.
 *
 * Every row is tagged with sessionId prefix `demo-` so the companion
 * cleanup script (clean-dashboard-demo-data.ts) can remove all of it
 * in one sweep when the real pilot starts.
 *
 * Run with:
 *   set -a && source .env.production.local && set +a
 *   npx tsx src/seed/dashboard-demo-data.ts [count]
 *
 * Defaults to 500 sessions across the last 30 days.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

// Count can be overridden via first CLI arg; cap to a sane upper bound
// so we don't accidentally dump a million rows into the pilot DB.
const targetCount = Math.min(
  5000,
  Math.max(50, parseInt(process.argv[2] ?? '500', 10) || 500),
)
const DAYS_BACK = 30
const MS_PER_DAY = 24 * 60 * 60 * 1000

// Deterministic RNG so repeated runs produce identical data (easier to
// clean up and easier to reason about during demos).
function mulberry32(a: number): () => number {
  let state = a >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(0xcafe42)
const rand = (min: number, max: number) => min + (max - min) * rng()
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]
const weightedPick = <T,>(items: Array<{ value: T; weight: number }>): T => {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = rng() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item.value
  }
  return items[items.length - 1].value
}

async function main() {
  const payload = await getPayload({ config })

  // ── Pull the real reference collections so generated sessions point
  //    at actual PKs. If someone edits urgency-levels or care-types in
  //    the CMS the demo data stays valid.
  console.log('Loading reference collections…')
  const [careTypesRes, urgencyRes, resourcesRes] = await Promise.all([
    payload.find({ collection: 'care-types', limit: 50, overrideAccess: true }),
    payload.find({ collection: 'urgency-levels', limit: 50, overrideAccess: true }),
    payload.find({ collection: 'care-resources', limit: 100, overrideAccess: true }),
  ])

  const careTypesByName: Record<string, number> = {}
  for (const ct of careTypesRes.docs as any[]) {
    careTypesByName[ct.name] = Number(ct.id)
  }
  const urgencyByName: Record<string, number> = {}
  for (const u of urgencyRes.docs as any[]) {
    urgencyByName[u.name] = Number(u.id)
  }
  const resourceIds: number[] = (resourcesRes.docs as any[])
    .map((r) => Number(r.id))
    .filter((n) => Number.isFinite(n))

  console.log(`  ${careTypesRes.totalDocs} care types, ${urgencyRes.totalDocs} urgency levels, ${resourcesRes.totalDocs} resources\n`)

  if (!careTypesByName['Medical'] || !urgencyByName['Routine']) {
    console.error('Expected care types + urgency levels missing. Run the main seed first.')
    process.exit(1)
  }

  // ── Distributions. Hand-tuned to match what a free clinic's digital
  //    front door would actually see (Medical dominates, evening+weekday
  //    peaks, ~2-3% crisis rate, 22% Spanish).
  const careTypeWeights: Array<{ value: string; weight: number }> = [
    { value: 'Medical',           weight: 45 },
    { value: 'Dental',            weight: 15 },
    { value: 'Behavioral Health', weight: 12 },
    { value: 'Medication',        weight: 10 },
    { value: 'Chronic Care',      weight: 8  },
    { value: 'Vision',            weight: 7  },
    { value: 'Not Sure',          weight: 3  },
  ]
  const urgencyWeights: Array<{ value: string; weight: number }> = [
    { value: 'Life-Threatening',  weight: 1 },
    { value: 'Emergent',          weight: 4 },
    { value: 'Urgent',            weight: 14 },
    { value: 'Semi-Urgent',       weight: 22 },
    { value: 'Routine',           weight: 40 },
    { value: 'Elective',          weight: 19 },
  ]
  // Day-of-week multipliers: weekdays higher than weekends.
  const dowFactor = [0.6, 1.05, 1.15, 1.1, 1.15, 1.1, 0.65] // Sun..Sat
  // Hour-of-day factor: evenings + lunch spike, late-night low.
  function hourFactor(h: number): number {
    if (h >= 7 && h <= 10) return 0.9 + (10 - Math.abs(8 - h)) * 0.08
    if (h >= 11 && h <= 13) return 1.0 + rng() * 0.15
    if (h >= 17 && h <= 21) return 1.3 + (21 - Math.abs(19 - h)) * 0.05
    if (h >= 22 || h <= 5) return 0.2 + rng() * 0.2
    return 0.7 + rng() * 0.2
  }

  // ── Generate session timestamps spread across the last DAYS_BACK
  //    days, weighted by dow + hour so the heatmap looks realistic
  //    rather than uniform static.
  const now = Date.now()
  const timestamps: Date[] = []
  const totalWeight: number[] = []
  let cumulative = 0
  const buckets: Array<{ t: Date; w: number }> = []
  for (let d = DAYS_BACK - 1; d >= 0; d--) {
    const day = new Date(now - d * MS_PER_DAY)
    const dowW = dowFactor[day.getDay()]
    for (let h = 0; h < 24; h++) {
      const hr = new Date(day)
      hr.setHours(h, 0, 0, 0)
      const w = dowW * hourFactor(h)
      cumulative += w
      buckets.push({ t: hr, w: cumulative })
    }
  }
  for (let i = 0; i < targetCount; i++) {
    const r = rng() * cumulative
    const bucket = buckets.find((b) => b.w >= r) ?? buckets[buckets.length - 1]
    const jittered = new Date(bucket.t.getTime() + Math.floor(rand(0, 60)) * 60_000)
    timestamps.push(jittered)
  }
  timestamps.sort((a, b) => a.getTime() - b.getTime())

  // ── Build session payloads.
  console.log(`Generating ${targetCount} sessions…`)
  const sessions: any[] = []
  const sessionEventsByIdx: Array<{ ts: Date; events: any[] }> = []

  for (let i = 0; i < targetCount; i++) {
    const ts = timestamps[i]
    const careTypeName = weightedPick(careTypeWeights)
    const careTypeId = careTypesByName[careTypeName] ?? null

    // Emergency screen: ~4% of sessions trigger the pre-triage red flag.
    const emergencyScreenTriggered = rng() < 0.04
    // Of emergencies, BH crisis (988) vs physical (911). BH care type biases toward 988.
    const isCrisis =
      emergencyScreenTriggered && careTypeName === 'Behavioral Health' && rng() < 0.9 ||
      (emergencyScreenTriggered && careTypeName !== 'Behavioral Health' && rng() < 0.08)

    // Urgency — emergencies skew to top tiers, normal sessions spread lower.
    let urgencyName: string
    if (emergencyScreenTriggered) {
      urgencyName = rng() < 0.5 ? 'Life-Threatening' : 'Emergent'
    } else {
      urgencyName = weightedPick(urgencyWeights.filter((u) => u.value !== 'Life-Threatening' && u.value !== 'Emergent'))
    }
    const urgencyId = urgencyByName[urgencyName] ?? null

    // Flow outcome.
    const completedFlow = !emergencyScreenTriggered && rng() < 0.82
    const virtualCareOffered = completedFlow && ['Routine', 'Elective', 'Semi-Urgent'].includes(urgencyName)
      ? rng() < 0.65
      : false

    // Locale + device distributions.
    const locale = rng() < 0.22 ? 'es' : 'en'
    const device =
      rng() < 0.72 ? 'mobile' : rng() < 0.70 ? 'desktop' : 'tablet'

    // Resources shown — pick 2–4 random resource IDs for completed sessions.
    let resourcesShown: number[] = []
    if (completedFlow && resourceIds.length > 0) {
      const n = 2 + Math.floor(rng() * 3)
      const shuffled = [...resourceIds].sort(() => rng() - 0.5).slice(0, n)
      resourcesShown = shuffled
    }

    const sessionId = `demo-${i.toString().padStart(5, '0')}-${Math.floor(rng() * 1e6).toString(36)}`

    sessions.push({
      sessionId,
      careTypeSelected: careTypeId,
      urgencyResult: emergencyScreenTriggered ? null : urgencyId,
      resourcesShown: resourcesShown.length > 0 ? resourcesShown : undefined,
      virtualCareOffered,
      emergencyScreenTriggered,
      completedFlow,
      isCrisis: !!isCrisis,
      locale,
      device,
      questionSetVersion: 1,
      createdAt: ts.toISOString(),
      updatedAt: ts.toISOString(),
    })

    // Build the matching funnel events. Every session fires
    // emergency_screen_view; only non-emergency completes the deeper
    // steps; only completed + offered resources gets click events.
    const events: Array<{ event: string; metadata?: any; ts: Date }> = []
    const evTs = (offsetSec: number) =>
      new Date(ts.getTime() + offsetSec * 1000)

    events.push({ event: 'landing_view', ts: evTs(0) })
    events.push({ event: 'get_care_click', ts: evTs(3) })
    events.push({ event: 'emergency_screen_view', ts: evTs(8) })

    if (emergencyScreenTriggered) {
      events.push({ event: 'emergency_symptom', ts: evTs(14) })
      if (isCrisis) events.push({ event: 'crisis_screen_view', ts: evTs(18) })
      if (rng() < 0.6) events.push({ event: isCrisis ? 'crisis_988_tap' : 'emergency_symptom', ts: evTs(24) })
    } else {
      events.push({ event: 'emergency_none', ts: evTs(18) })
      events.push({ event: 'care_type_selected', metadata: { careType: careTypeName }, ts: evTs(28) })
      const qCount = 2 + Math.floor(rng() * 4)
      for (let q = 0; q < qCount; q++) {
        events.push({ event: 'triage_question', ts: evTs(35 + q * 10) })
      }
      if (completedFlow) {
        events.push({ event: 'triage_completed', ts: evTs(35 + qCount * 10 + 5) })
        events.push({ event: 'results_view', ts: evTs(35 + qCount * 10 + 10) })
        // 35% tap phone, 25% tap directions, 8% tap website
        const pickedResName = resourceIds.length > 0
          ? (resourcesRes.docs.find((r) => Number((r as any).id) === resourcesShown[0]) as any)?.name
          : undefined
        if (rng() < 0.35 && pickedResName) {
          events.push({ event: 'resource_call', metadata: { resourceName: pickedResName }, ts: evTs(35 + qCount * 10 + 25) })
        }
        if (rng() < 0.25 && pickedResName) {
          events.push({ event: 'resource_directions', metadata: { resourceName: pickedResName }, ts: evTs(35 + qCount * 10 + 40) })
        }
        if (rng() < 0.08 && pickedResName) {
          events.push({ event: 'resource_website', metadata: { resourceName: pickedResName }, ts: evTs(35 + qCount * 10 + 55) })
        }
      }
    }

    sessionEventsByIdx.push({
      ts,
      events: events.map((e) => ({
        sessionId,
        event: e.event,
        metadata: e.metadata,
        locale,
        device,
        createdAt: e.ts.toISOString(),
        updatedAt: e.ts.toISOString(),
      })),
    })
  }

  // ── Write sessions in batches so we don't hammer Neon.
  console.log(`Writing ${sessions.length} sessions…`)
  let written = 0
  for (const s of sessions) {
    try {
      await payload.create({ collection: 'triage-sessions', data: s, overrideAccess: true })
      written++
      if (written % 50 === 0) process.stdout.write(`  ${written}/${sessions.length}\r`)
    } catch (err) {
      console.error(`\n  session write failed:`, (err as Error).message)
    }
  }
  console.log(`  ${written} sessions written`)

  // ── Write events. Flatten and write in batches.
  const allEvents = sessionEventsByIdx.flatMap((x) => x.events)
  console.log(`Writing ${allEvents.length} events…`)
  let evWritten = 0
  let evFailed = 0
  for (const ev of allEvents) {
    try {
      await (payload.create as any)({ collection: 'triage-events', data: ev, overrideAccess: true })
      evWritten++
      if (evWritten % 200 === 0) process.stdout.write(`  ${evWritten}/${allEvents.length}\r`)
    } catch (err) {
      evFailed++
    }
  }
  console.log(`  ${evWritten} events written (${evFailed} failed)`)

  console.log('\nDone.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
