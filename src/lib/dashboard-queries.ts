import { getPayload } from 'payload'
import config from '../payload.config'
import type { CareResource, CareType, UrgencyLevel } from '../payload-types'

/** Annual virtual visit target from pilot plan (2,400/year) */
export const ANNUAL_VIRTUAL_TARGET = 2400

export interface DashboardDateRange {
  start: Date
  end: Date
}

export interface DashboardData {
  dateRange: DashboardDateRange
  days: number
  totalSessions: number
  completedCount: number
  completedRate: number
  virtualCount: number
  emergencyCount: number
  /** BH crisis events — patient disclosed self-harm and saw the 988 screen */
  crisisCount: number
  inPersonCount: number
  abandonedCount: number
  routingMix: { name: string; count: number; color: string }[]
  careTypeBreakdown: { name: string; count: number }[]
  urgencyBreakdown: { name: string; count: number }[]
  languageBreakdown: { locale: string; label: string; count: number; percent: number }[]
  deviceBreakdown: { device: string; label: string; count: number; percent: number }[]
  dailyTrend: { date: string; total: number; virtual: number; inPerson: number; emergency: number; crisis: number }[]
  hourlyHeatmap: number[][] // 7 rows (Sun..Sat) × 24 cols (0..23)
  topPartners: { id: string | number; name: string; count: number; type?: string; latitude?: number; longitude?: number }[]
  virtualPacing: {
    count: number
    annualRate: number
    target: number
    percentOfTarget: number
  }
  /** Comprehensive funnel: count of each event type in the date range */
  funnel: { name: string; count: number; color: string }[]
  /** Resource engagement: calls, directions, website clicks per provider */
  resourceEngagement: { name: string; calls: number; directions: number; website: number; total: number }[]
}



/**
 * Fetch and aggregate all dashboard data in a single pass.
 * Expects TriageSessions with populated relationships (depth: 1).
 */
export async function getDashboardData(range: DashboardDateRange): Promise<DashboardData> {
  const payload = await getPayload({ config })

  const msPerDay = 1000 * 60 * 60 * 24
  const days = Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / msPerDay))

  // Fetch all sessions in range with populated relationships.
  //
  // Cap at 50,000 rows as a hard ceiling to protect the dashboard from
  // degenerating into a full-table scan if triage-sessions gets flooded
  // (analytics spam, a bot loop, or years of accumulated history).
  // The `not_like: 'sample-%'` filter excludes seed data written by
  // src/seed/sample-sessions.ts (which uses `sessionId: \`sample-...\``)
  // so dashboards reflect real traffic.
  const sessionsRes = await payload.find({
    collection: 'triage-sessions',
    where: {
      and: [
        { createdAt: { greater_than_equal: range.start.toISOString() } },
        { createdAt: { less_than_equal: range.end.toISOString() } },
        { sessionId: { not_like: 'sample-%' } },
      ],
    },
    depth: 1,
    limit: 50000,
    pagination: false,
    overrideAccess: true,
  })

  const docs = sessionsRes.docs as Array<{
    id: string | number
    createdAt: string
    careTypeSelected?: CareType | string | number | null
    urgencyResult?: UrgencyLevel | string | number | null
    resourcesShown?: Array<CareResource | string | number> | null
    virtualCareOffered?: boolean | null
    emergencyScreenTriggered?: boolean | null
    completedFlow?: boolean | null
    locale?: 'en' | 'es' | null
    device?: 'mobile' | 'tablet' | 'desktop' | null
  }>

  const totalSessions = docs.length

  // BH crisis helper — checks the isCrisis boolean first (new), falls back
  // to care type name matching for legacy sessions that lack the flag.
  const isBhCrisis = (d: typeof docs[0] & { isCrisis?: boolean }) => {
    if (d.isCrisis === true) return true
    const ct = d.careTypeSelected
    if (!ct || typeof ct !== 'object' || !('name' in ct)) return false
    const name = (ct as { name?: string }).name ?? ''
    return name === 'Behavioral Health' || name === 'Salud mental'
  }

  // --- Initialize all accumulators before the single pass ---

  let completedCount = 0
  let virtualCount = 0
  let crisisCount = 0
  let emergencyCount = 0
  let inPersonCount = 0
  let allEmergencyCount = 0

  const careTypeCounts = new Map<string, number>()
  const urgencyCounts = new Map<string, number>()
  const langCounts = { en: 0, es: 0 }
  const devCounts = { mobile: 0, tablet: 0, desktop: 0 }

  // Daily trend — pre-fill every day in range so chart has no gaps.
  // This iterates over dates, not docs, so it stays as a separate loop.
  const dailyMap = new Map<string, { total: number; virtual: number; inPerson: number; emergency: number; crisis: number }>()
  const iter = new Date(range.start)
  iter.setHours(0, 0, 0, 0)
  const endDay = new Date(range.end)
  endDay.setHours(0, 0, 0, 0)
  while (iter <= endDay) {
    const key = iter.toISOString().slice(0, 10)
    dailyMap.set(key, { total: 0, virtual: 0, inPerson: 0, emergency: 0, crisis: 0 })
    iter.setDate(iter.getDate() + 1)
  }

  // Hourly heatmap (7 days × 24 hours)
  const hourlyHeatmap: number[][] = Array.from({ length: 7 }, () => Array<number>(24).fill(0))

  // Top partners map
  const partnerCounts = new Map<
    string | number,
    { id: string | number; name: string; count: number; type?: string; latitude?: number; longitude?: number }
  >()

  // --- Single pass over all documents ---

  for (const d of docs) {
    // Routing counters
    // Only count sessions that completed the flow AND were not emergency
    // escalations — emergency sessions are counted separately in
    // allEmergencyCount so the abandoned formula doesn't double-count.
    if (d.completedFlow && !d.emergencyScreenTriggered) completedCount++

    if (d.emergencyScreenTriggered) {
      allEmergencyCount++
      if (isBhCrisis(d)) crisisCount++
      else emergencyCount++
    }

    // virtualCount: completedFlow && virtualCareOffered && !emergencyScreenTriggered
    if (d.completedFlow && d.virtualCareOffered && !d.emergencyScreenTriggered) virtualCount++

    // inPersonCount: completedFlow && !virtualCareOffered && !emergencyScreenTriggered
    if (d.completedFlow && !d.virtualCareOffered && !d.emergencyScreenTriggered) inPersonCount++

    // Care type breakdown
    const ct = d.careTypeSelected
    if (ct && typeof ct === 'object' && 'name' in ct) {
      careTypeCounts.set(ct.name, (careTypeCounts.get(ct.name) ?? 0) + 1)
    }

    // Urgency breakdown
    const u = d.urgencyResult
    if (u && typeof u === 'object' && 'name' in u) {
      urgencyCounts.set(u.name, (urgencyCounts.get(u.name) ?? 0) + 1)
    }

    // Language breakdown
    if (d.locale === 'en') langCounts.en++
    else if (d.locale === 'es') langCounts.es++

    // Device breakdown
    if (d.device === 'mobile') devCounts.mobile++
    else if (d.device === 'tablet') devCounts.tablet++
    else if (d.device === 'desktop') devCounts.desktop++

    // Daily trend buckets
    const when = new Date(d.createdAt)
    const dayKey = when.toISOString().slice(0, 10)
    const bucket = dailyMap.get(dayKey)
    if (bucket) {
      bucket.total++
      if (d.emergencyScreenTriggered) {
        if (isBhCrisis(d)) bucket.crisis++
        else bucket.emergency++
      } else if (d.completedFlow && d.virtualCareOffered) bucket.virtual++
      else if (d.completedFlow) bucket.inPerson++
    }

    // Hourly heatmap
    hourlyHeatmap[when.getDay()][when.getHours()]++

    // Top partners — flatten resourcesShown
    const resources = d.resourcesShown ?? []
    for (const r of resources) {
      if (r && typeof r === 'object' && 'id' in r) {
        const existing = partnerCounts.get(r.id)
        if (existing) {
          existing.count++
        } else {
          partnerCounts.set(r.id, {
            id: r.id,
            name: r.name,
            count: 1,
            type: r.type,
            latitude: r.address?.latitude ?? undefined,
            longitude: r.address?.longitude ?? undefined,
          })
        }
      }
    }
  }

  // --- Derive final aggregates from the accumulators ---

  const abandonedCount = Math.max(0, totalSessions - completedCount - allEmergencyCount)
  const completedRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0

  const routingMix = [
    { name: 'Virtual care', count: virtualCount, color: '#10b981' },
    { name: 'In-person', count: inPersonCount, color: '#3b82f6' },
    { name: 'Emergency (911)', count: emergencyCount, color: '#ef4444' },
    { name: 'Crisis (988)', count: crisisCount, color: '#8b5cf6' },
  ].filter((r) => r.count > 0)

  const careTypeBreakdown = [...careTypeCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const urgencyBreakdown = [...urgencyCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const languageBreakdown = [
    { locale: 'en', label: 'English', count: langCounts.en, percent: totalSessions ? Math.round((langCounts.en / totalSessions) * 100) : 0 },
    { locale: 'es', label: 'Spanish', count: langCounts.es, percent: totalSessions ? Math.round((langCounts.es / totalSessions) * 100) : 0 },
  ]

  const deviceBreakdown = [
    { device: 'mobile', label: 'Mobile', count: devCounts.mobile, percent: totalSessions ? Math.round((devCounts.mobile / totalSessions) * 100) : 0 },
    { device: 'desktop', label: 'Desktop', count: devCounts.desktop, percent: totalSessions ? Math.round((devCounts.desktop / totalSessions) * 100) : 0 },
    { device: 'tablet', label: 'Tablet', count: devCounts.tablet, percent: totalSessions ? Math.round((devCounts.tablet / totalSessions) * 100) : 0 },
  ]

  const dailyTrend = [...dailyMap.entries()].map(([date, v]) => ({ date, ...v }))

  const topPartners = [...partnerCounts.values()].sort((a, b) => b.count - a.count)

  // Virtual care pacing — annualize the rate from the current window
  const annualRate = days > 0 ? Math.round((virtualCount / days) * 365) : 0
  const percentOfTarget = Math.min(100, Math.round((annualRate / ANNUAL_VIRTUAL_TARGET) * 100))

  // Comprehensive funnel — query TriageEvents for step counts
  let funnel: { name: string; count: number; color: string }[] = []
  let resourceEngagement: { name: string; calls: number; directions: number; website: number; total: number }[] = []

  try {
    const eventsRes = await (payload.find as any)({
      collection: 'triage-events',
      where: {
        createdAt: {
          greater_than_equal: range.start.toISOString(),
          less_than_equal: range.end.toISOString(),
        },
      },
      limit: 50000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    const eventDocs = eventsRes.docs as Array<{ event: string; metadata?: any }>
    const eventCounts = new Map<string, number>()
    const resourceCalls = new Map<string, { calls: number; directions: number; website: number }>()

    for (const e of eventDocs) {
      eventCounts.set(e.event, (eventCounts.get(e.event) ?? 0) + 1)

      // Resource engagement tracking
      const resName = e.metadata?.resourceName as string | undefined
      if (resName && (e.event === 'resource_call' || e.event === 'resource_directions' || e.event === 'resource_website')) {
        if (!resourceCalls.has(resName)) resourceCalls.set(resName, { calls: 0, directions: 0, website: 0 })
        const entry = resourceCalls.get(resName)!
        if (e.event === 'resource_call') entry.calls++
        if (e.event === 'resource_directions') entry.directions++
        if (e.event === 'resource_website') entry.website++
      }
    }

    const funnelSteps = [
      { event: 'emergency_screen_view', label: 'Emergency screen', color: '#1B4F72' },
      { event: 'emergency_none', label: 'Passed emergency', color: '#2471A3' },
      { event: 'care_type_selected', label: 'Care type selected', color: '#2E86C1' },
      { event: 'triage_question', label: 'Questions answered', color: '#3498DB' },
      { event: 'triage_completed', label: 'Triage completed', color: '#5DADE2' },
      { event: 'results_view', label: 'Results viewed', color: '#85C1E9' },
      { event: 'resource_call', label: 'Phone tapped', color: '#10b981' },
      { event: 'resource_directions', label: 'Directions tapped', color: '#3b82f6' },
    ]
    funnel = funnelSteps.map((s) => ({
      name: s.label,
      count: eventCounts.get(s.event) ?? 0,
      color: s.color,
    }))

    resourceEngagement = [...resourceCalls.entries()]
      .map(([name, counts]) => ({ name, ...counts, total: counts.calls + counts.directions + counts.website }))
      .sort((a, b) => b.total - a.total)
  } catch {
    // TriageEvents collection may not exist yet (fresh DB) — graceful fallback
  }

  return {
    dateRange: range,
    days,
    totalSessions,
    completedCount,
    completedRate,
    virtualCount,
    emergencyCount,
    crisisCount,
    inPersonCount,
    abandonedCount,
    routingMix,
    careTypeBreakdown,
    urgencyBreakdown,
    languageBreakdown,
    deviceBreakdown,
    dailyTrend,
    hourlyHeatmap,
    topPartners,
    virtualPacing: {
      count: virtualCount,
      annualRate,
      target: ANNUAL_VIRTUAL_TARGET,
      percentOfTarget,
    },
    funnel,
    resourceEngagement,
  }
}

/** Parse ?start and ?end search params with preset fallback. */
export function parseDateRange(searchParams: Record<string, string | string[] | undefined>): DashboardDateRange {
  const now = new Date()
  const getStr = (k: string) => {
    const v = searchParams[k]
    return typeof v === 'string' ? v : undefined
  }

  const startStr = getStr('start')
  const endStr = getStr('end')
  const preset = getStr('preset') ?? '30d'

  // Explicit custom range
  if (startStr && endStr) {
    const start = new Date(startStr + 'T00:00:00')
    const end = new Date(endStr + 'T23:59:59.999')
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      return { start, end }
    }
  }

  // Preset ranges
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  switch (preset) {
    case '7d':
      start.setDate(start.getDate() - 6)
      break
    case 'ytd':
      start.setMonth(0, 1)
      break
    case 'all':
      start.setFullYear(2020, 0, 1)
      break
    case '30d':
    default:
      start.setDate(start.getDate() - 29)
      break
  }

  return { start, end }
}
