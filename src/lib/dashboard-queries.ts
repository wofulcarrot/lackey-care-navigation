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
  inPersonCount: number
  abandonedCount: number
  routingMix: { name: string; count: number; color: string }[]
  careTypeBreakdown: { name: string; count: number }[]
  urgencyBreakdown: { name: string; count: number }[]
  languageBreakdown: { locale: string; label: string; count: number; percent: number }[]
  deviceBreakdown: { device: string; label: string; count: number; percent: number }[]
  dailyTrend: { date: string; total: number; virtual: number; inPerson: number; emergency: number }[]
  hourlyHeatmap: number[][] // 7 rows (Sun..Sat) × 24 cols (0..23)
  topPartners: { id: string | number; name: string; count: number; type?: string; latitude?: number; longitude?: number }[]
  virtualPacing: {
    count: number
    annualRate: number
    target: number
    percentOfTarget: number
  }
}

function sameDay(d: Date, y: number, m: number, day: number) {
  return d.getFullYear() === y && d.getMonth() === m && d.getDate() === day
}

/**
 * Fetch and aggregate all dashboard data in a single pass.
 * Expects TriageSessions with populated relationships (depth: 1).
 */
export async function getDashboardData(range: DashboardDateRange): Promise<DashboardData> {
  const payload = await getPayload({ config })

  const msPerDay = 1000 * 60 * 60 * 24
  const days = Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / msPerDay))

  // Fetch all sessions in range with populated relationships
  const sessionsRes = await payload.find({
    collection: 'triage-sessions',
    where: {
      createdAt: {
        greater_than_equal: range.start.toISOString(),
        less_than_equal: range.end.toISOString(),
      },
    },
    depth: 1,
    limit: 0, // all matching docs
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
  const completedCount = docs.filter((d) => d.completedFlow).length
  const virtualCount = docs.filter((d) => d.completedFlow && d.virtualCareOffered && !d.emergencyScreenTriggered).length
  const emergencyCount = docs.filter((d) => d.emergencyScreenTriggered).length
  const inPersonCount = docs.filter(
    (d) => d.completedFlow && !d.virtualCareOffered && !d.emergencyScreenTriggered,
  ).length
  const abandonedCount = totalSessions - completedCount - emergencyCount
  const completedRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0

  const routingMix = [
    { name: 'Virtual care', count: virtualCount, color: '#10b981' },
    { name: 'In-person', count: inPersonCount, color: '#3b82f6' },
    { name: 'Emergency', count: emergencyCount, color: '#ef4444' },
  ].filter((r) => r.count > 0)

  // Care type breakdown
  const careTypeCounts = new Map<string, number>()
  for (const d of docs) {
    const ct = d.careTypeSelected
    if (ct && typeof ct === 'object' && 'name' in ct) {
      careTypeCounts.set(ct.name, (careTypeCounts.get(ct.name) ?? 0) + 1)
    }
  }
  const careTypeBreakdown = [...careTypeCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Urgency breakdown
  const urgencyCounts = new Map<string, number>()
  for (const d of docs) {
    const u = d.urgencyResult
    if (u && typeof u === 'object' && 'name' in u) {
      urgencyCounts.set(u.name, (urgencyCounts.get(u.name) ?? 0) + 1)
    }
  }
  const urgencyBreakdown = [...urgencyCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Language breakdown
  const langCounts = { en: 0, es: 0 }
  for (const d of docs) {
    if (d.locale === 'en') langCounts.en++
    else if (d.locale === 'es') langCounts.es++
  }
  const languageBreakdown = [
    { locale: 'en', label: 'English', count: langCounts.en, percent: totalSessions ? Math.round((langCounts.en / totalSessions) * 100) : 0 },
    { locale: 'es', label: 'Spanish', count: langCounts.es, percent: totalSessions ? Math.round((langCounts.es / totalSessions) * 100) : 0 },
  ]

  // Device breakdown
  const devCounts = { mobile: 0, tablet: 0, desktop: 0 }
  for (const d of docs) {
    if (d.device === 'mobile') devCounts.mobile++
    else if (d.device === 'tablet') devCounts.tablet++
    else if (d.device === 'desktop') devCounts.desktop++
  }
  const deviceBreakdown = [
    { device: 'mobile', label: 'Mobile', count: devCounts.mobile, percent: totalSessions ? Math.round((devCounts.mobile / totalSessions) * 100) : 0 },
    { device: 'desktop', label: 'Desktop', count: devCounts.desktop, percent: totalSessions ? Math.round((devCounts.desktop / totalSessions) * 100) : 0 },
    { device: 'tablet', label: 'Tablet', count: devCounts.tablet, percent: totalSessions ? Math.round((devCounts.tablet / totalSessions) * 100) : 0 },
  ]

  // Daily trend — fill every day in range so chart has no gaps
  const dailyMap = new Map<string, { total: number; virtual: number; inPerson: number; emergency: number }>()
  const iter = new Date(range.start)
  iter.setHours(0, 0, 0, 0)
  const endDay = new Date(range.end)
  endDay.setHours(0, 0, 0, 0)
  while (iter <= endDay) {
    const key = iter.toISOString().slice(0, 10)
    dailyMap.set(key, { total: 0, virtual: 0, inPerson: 0, emergency: 0 })
    iter.setDate(iter.getDate() + 1)
  }
  for (const d of docs) {
    const key = new Date(d.createdAt).toISOString().slice(0, 10)
    const bucket = dailyMap.get(key)
    if (!bucket) continue
    bucket.total++
    if (d.emergencyScreenTriggered) bucket.emergency++
    else if (d.completedFlow && d.virtualCareOffered) bucket.virtual++
    else if (d.completedFlow) bucket.inPerson++
  }
  const dailyTrend = [...dailyMap.entries()].map(([date, v]) => ({ date, ...v }))

  // Hourly heatmap (7 days × 24 hours)
  const hourlyHeatmap: number[][] = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
  for (const d of docs) {
    const when = new Date(d.createdAt)
    hourlyHeatmap[when.getDay()][when.getHours()]++
  }

  // Top partners — flatten resourcesShown across all sessions
  const partnerCounts = new Map<
    string | number,
    { id: string | number; name: string; count: number; type?: string; latitude?: number; longitude?: number }
  >()
  for (const d of docs) {
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
  const topPartners = [...partnerCounts.values()].sort((a, b) => b.count - a.count)

  // Virtual care pacing — annualize the rate from the current window
  const annualRate = days > 0 ? Math.round((virtualCount / days) * 365) : 0
  const percentOfTarget = Math.min(100, Math.round((annualRate / ANNUAL_VIRTUAL_TARGET) * 100))

  return {
    dateRange: range,
    days,
    totalSessions,
    completedCount,
    completedRate,
    virtualCount,
    emergencyCount,
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
