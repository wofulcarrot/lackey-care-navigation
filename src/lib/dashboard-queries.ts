import { getPayload } from 'payload'
import config from '../payload.config'
import type { CareResource, CareType, UrgencyLevel } from '../payload-types'

/** Annual virtual visit target from pilot plan (2,400/year) */
export const ANNUAL_VIRTUAL_TARGET = 2400

export interface DashboardDateRange {
  start: Date
  end: Date
}

/**
 * KPI tile metric. `delta` is the percent (or percentage-point) change
 * versus the immediately preceding period of equal length. The `tone`
 * flag lets the UI invert the "up is good" convention for bad-news
 * counters like crisis escalations, where a DROP is good.
 */
export interface DashboardKpi {
  id: 'sessions' | 'completion' | 'crisis' | 'virtual' | 'spanish'
  label: string
  value: number
  /** Absolute change in value (or pp for %-valued KPIs). Sign indicates direction. */
  delta: number
  /** Display unit: '' for counts, '%' for percentages, 'm' for minutes. */
  unit: '' | '%'
  /** 'urgent' inverts up=good so red-flag counters read correctly. */
  tone?: 'urgent'
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
  urgencyBreakdown: { name: string; count: number; color: string; percent: number }[]
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
  /** KPI tiles with deltas vs the previous period of equal length. */
  kpis: DashboardKpi[]
  /** EN vs ES comparison stats for the Analytics page. */
  langCompare: LangCompareStats
}

/** Analytics drill-down: side-by-side EN vs ES metrics. */
export interface LangCompareStats {
  en: LangSide
  es: LangSide
}
export interface LangSide {
  total: number
  completionRate: number // 0..1
  crisisRate: number     // 0..1
  virtualCtr: number     // 0..1
  mix: {
    life: number // percent of sessions (0..100)
    emg: number
    urg: number
    semi: number
    rout: number
    elec: number
  }
  care: { id: string; label: string; pct: number }[]
}

/**
 * Urgency-tier color palette for the donut + funnel. Matches the
 * --urgent-life/emg/urg/semi/rout/elec CSS tokens as sRGB hex.
 * Name-matching is case-insensitive and supports EN + ES labels.
 */
const URGENCY_ORDER: Array<{ keys: string[]; color: string; fallbackLabel: string }> = [
  { keys: ['life-threatening', 'life threatening', 'amenaza'], color: '#D64545', fallbackLabel: 'Life-Threatening' },
  { keys: ['emergent', 'emergente'],                            color: '#E89049', fallbackLabel: 'Emergent' },
  { keys: ['urgent', 'urgente'],                                color: '#E6A547', fallbackLabel: 'Urgent' },
  { keys: ['semi-urgent', 'semi urgente', 'semi-urgente'],      color: '#E3B84A', fallbackLabel: 'Semi-Urgent' },
  { keys: ['routine', 'rutina'],                                color: '#6FAA82', fallbackLabel: 'Routine' },
  { keys: ['elective', 'electiva', 'behavioral health', 'salud mental'], color: '#8DA8D8', fallbackLabel: 'Elective' },
]

function urgencyColorFor(name: string): string {
  const norm = name.toLowerCase()
  for (const tier of URGENCY_ORDER) {
    if (tier.keys.some((k) => norm === k || norm.startsWith(k))) return tier.color
  }
  return '#9A8976' // ink-3 fallback
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
    isCrisis?: boolean | null
    locale?: 'en' | 'es' | null
    device?: 'mobile' | 'tablet' | 'desktop' | null
  }>

  const totalSessions = docs.length

  // BH crisis helper — checks the isCrisis boolean first, falls back to care
  // type name matching for legacy sessions that predate the boolean field.
  const isBhCrisis = (d: (typeof docs)[0]) => {
    if (d.isCrisis === true) return true
    const ct = d.careTypeSelected
    if (!ct || typeof ct !== 'object' || !('name' in ct)) return false
    return ct.name === 'Behavioral Health' || ct.name === 'Salud mental'
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

  // --- Fetch previous period (same duration, ending at range.start) so the
  //     KPI tiles can show "vs last week"-style deltas. This is a second
  //     DB query but returns only the few counts we need, not the full
  //     session objects, so it's cheap.
  const periodMs = range.end.getTime() - range.start.getTime()
  const prevStart = new Date(range.start.getTime() - periodMs)
  const prevEnd = new Date(range.start.getTime())

  // Same filter shape as the main query, but we only need the booleans/
  // locale to recompute the same KPIs — depth: 0 skips relationship
  // hydration for a much smaller payload.
  const prevRes = await payload.find({
    collection: 'triage-sessions',
    where: {
      and: [
        { createdAt: { greater_than_equal: prevStart.toISOString() } },
        { createdAt: { less_than_equal: prevEnd.toISOString() } },
        { sessionId: { not_like: 'sample-%' } },
      ],
    },
    depth: 0,
    limit: 50000,
    pagination: false,
    overrideAccess: true,
  })

  const prevDocs = prevRes.docs as Array<{
    virtualCareOffered?: boolean | null
    emergencyScreenTriggered?: boolean | null
    completedFlow?: boolean | null
    isCrisis?: boolean | null
    locale?: 'en' | 'es' | null
  }>
  let prevTotal = prevDocs.length
  let prevCompleted = 0
  let prevCrisis = 0
  let prevVirtual = 0
  let prevSpanish = 0
  for (const d of prevDocs) {
    if (d.completedFlow && !d.emergencyScreenTriggered) prevCompleted++
    if (d.isCrisis === true) prevCrisis++
    if (d.completedFlow && d.virtualCareOffered && !d.emergencyScreenTriggered) prevVirtual++
    if (d.locale === 'es') prevSpanish++
  }
  const prevCompletedRate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0
  const prevSpanishPct = prevTotal > 0 ? Math.round((prevSpanish / prevTotal) * 100) : 0

  // Helper: percent change for a count (rounded to 1 decimal).
  // Returns 0 when prev was 0 to avoid division-by-zero and hide noisy
  // infinity spikes for first-run demos.
  function pctDelta(curr: number, prev: number): number {
    if (prev === 0) return 0
    return Math.round(((curr - prev) / prev) * 1000) / 10
  }

  // --- Derive final aggregates from the accumulators ---

  const abandonedCount = Math.max(0, totalSessions - completedCount - allEmergencyCount)
  const completedRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0
  const spanishPct = totalSessions > 0 ? Math.round((langCounts.es / totalSessions) * 100) : 0

  // KPI tiles — values + deltas vs the immediately preceding period.
  // For rate/percent KPIs (completion, Spanish share) delta is a
  // percentage-point difference; for count KPIs it's a percent change.
  const kpis: DashboardKpi[] = [
    { id: 'sessions',   label: 'Total sessions',      value: totalSessions,  delta: pctDelta(totalSessions, prevTotal),       unit: ''  },
    { id: 'completion', label: 'Completion rate',     value: completedRate,  delta: completedRate - prevCompletedRate,        unit: '%' },
    { id: 'crisis',     label: 'Crisis escalations',  value: crisisCount,    delta: pctDelta(crisisCount, prevCrisis),         unit: '', tone: 'urgent' },
    { id: 'virtual',    label: 'Virtual care starts', value: virtualCount,   delta: pctDelta(virtualCount, prevVirtual),       unit: ''  },
    { id: 'spanish',    label: 'Spanish sessions',    value: spanishPct,     delta: spanishPct - prevSpanishPct,               unit: '%' },
  ]

  // ── Language compare (EN vs ES) for Analytics drill-down. Second
  //    pass over docs so we can bucket every metric by locale without
  //    carrying a locale shadow for every accumulator above.
  function buildLangSide(locale: 'en' | 'es'): LangSide {
    let total = 0
    let completed = 0
    let crisis = 0
    let virtual = 0
    const urgencyTierCounts = { life: 0, emg: 0, urg: 0, semi: 0, rout: 0, elec: 0 }
    const careCounts = new Map<string, number>()
    for (const d of docs) {
      if (d.locale !== locale) continue
      total++
      if (d.completedFlow && !d.emergencyScreenTriggered) completed++
      if (d.isCrisis === true) crisis++
      if (d.completedFlow && d.virtualCareOffered && !d.emergencyScreenTriggered) virtual++
      const u = d.urgencyResult
      if (u && typeof u === 'object' && 'name' in u) {
        const norm = String(u.name).toLowerCase()
        if (norm.startsWith('life')) urgencyTierCounts.life++
        else if (norm.startsWith('emergent') || norm.startsWith('emergente')) urgencyTierCounts.emg++
        else if (norm.startsWith('urgent') || norm.startsWith('urgente')) urgencyTierCounts.urg++
        else if (norm.startsWith('semi')) urgencyTierCounts.semi++
        else if (norm.startsWith('routine') || norm.startsWith('rutina')) urgencyTierCounts.rout++
        else if (norm.startsWith('elective') || norm.startsWith('electiva')) urgencyTierCounts.elec++
      }
      const ct = d.careTypeSelected
      if (ct && typeof ct === 'object' && 'name' in ct) {
        careCounts.set(ct.name, (careCounts.get(ct.name) ?? 0) + 1)
      }
    }
    // Convert tier counts → percent-of-total.
    const mix = total > 0
      ? Object.fromEntries(
          Object.entries(urgencyTierCounts).map(([k, v]) => [k, Math.round((v / total) * 1000) / 10]),
        ) as LangSide['mix']
      : urgencyTierCounts
    // Top 4 care types by share.
    const care = [...careCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        label: name,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
    return {
      total,
      completionRate: total > 0 ? completed / total : 0,
      crisisRate: total > 0 ? crisis / total : 0,
      virtualCtr: total > 0 ? virtual / total : 0,
      mix,
      care,
    }
  }
  const langCompare: LangCompareStats = {
    en: buildLangSide('en'),
    es: buildLangSide('es'),
  }

  // Colors here mirror CHART_COLORS in
  // src/app/dashboard/components/chart-theme.ts. Kept in sync manually
  // since this is a server module that can't import a 'use client' file.
  const routingMix = [
    { name: 'Virtual care', count: virtualCount, color: '#6A9373' },       // sage
    { name: 'In-person', count: inPersonCount, color: '#5A8ED8' },         // urgent-blue
    { name: 'Emergency (911)', count: emergencyCount, color: '#D64545' },  // urgent-red
    { name: 'Crisis (988)', count: crisisCount, color: '#AE9CC4' },        // lavender
  ].filter((r) => r.count > 0)

  const careTypeBreakdown = [...careTypeCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Urgency tiers — attach a color from the fixed 6-tier palette and a
  // share-of-total percent so the donut chart can render without extra
  // math in the view. Sort by scoreThreshold order (most severe first)
  // rather than alphabetically so the legend reads top-to-bottom by risk.
  const urgencyTotal = [...urgencyCounts.values()].reduce((s, n) => s + n, 0)
  const urgencyBreakdown = [...urgencyCounts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      color: urgencyColorFor(name),
      percent: urgencyTotal > 0 ? Math.round((count / urgencyTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => {
      const aIdx = URGENCY_ORDER.findIndex((t) =>
        t.keys.some((k) => a.name.toLowerCase().startsWith(k)),
      )
      const bIdx = URGENCY_ORDER.findIndex((t) =>
        t.keys.some((k) => b.name.toLowerCase().startsWith(k)),
      )
      // Unknown names sort after known ones.
      if (aIdx === -1 && bIdx === -1) return b.count - a.count
      if (aIdx === -1) return 1
      if (bIdx === -1) return -1
      return aIdx - bIdx
    })

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

    // Funnel colors — coral/sage family graduated from the top of the
    // funnel (darkest coral) to the engagement steps (sage green).
    const funnelSteps = [
      { event: 'emergency_screen_view', label: 'Emergency screen', color: '#6B3224' },
      { event: 'emergency_none', label: 'Passed emergency', color: '#9A4A35' },
      { event: 'care_type_selected', label: 'Care type selected', color: '#C16049' },
      { event: 'triage_question', label: 'Questions answered', color: '#E07A5F' },
      { event: 'triage_completed', label: 'Triage completed', color: '#E89A86' },
      { event: 'results_view', label: 'Results viewed', color: '#F2BFB0' },
      { event: 'resource_call', label: 'Phone tapped', color: '#6A9373' },
      { event: 'resource_directions', label: 'Directions tapped', color: '#5A8ED8' },
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
    kpis,
    langCompare,
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
