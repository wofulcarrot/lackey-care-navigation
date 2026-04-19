'use client'

import { useCallback, useState } from 'react'

interface PartnerPoint {
  id: string | number
  name: string
  count: number
  type?: string
  latitude?: number
  longitude?: number
}

interface ExportData {
  dateRange: { start: Date | string; end: Date | string }
  days: number
  totalSessions: number
  completedCount: number
  completedRate: number
  virtualCount: number
  emergencyCount: number
  crisisCount: number
  inPersonCount: number
  abandonedCount: number
  routingMix: { name: string; count: number }[]
  careTypeBreakdown: { name: string; count: number }[]
  urgencyBreakdown: { name: string; count: number }[]
  languageBreakdown: { locale: string; label: string; count: number; percent: number }[]
  deviceBreakdown: { device: string; label: string; count: number; percent: number }[]
  dailyTrend: { date: string; total: number; virtual: number; inPerson: number; emergency: number; crisis: number }[]
  hourlyHeatmap: number[][]
  topPartners: PartnerPoint[]
  virtualPacing: { count: number; annualRate: number; target: number; percentOfTarget: number }
}

/** Escape a CSV cell — handles commas, quotes, newlines, and formula injection. */
function csvEscape(value: unknown): string {
  let s = value == null ? '' : String(value)
  // Strip leading formula-trigger characters (CSV injection defense)
  s = s.replace(/^[=+\-@\t\r]+/, '')
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    s = `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().slice(0, 10)
}

export function ExportButton({ data }: { data: ExportData }) {
  const [busy, setBusy] = useState(false)

  const handleExport = useCallback(() => {
    setBusy(true)
    try {
      const sections: string[][] = []

      // Header / metadata
      sections.push([
        ['Lackey Digital Front Door — Executive Dashboard Export'].map(csvEscape).join(','),
      ])
      sections.push([
        ['Generated', new Date().toISOString()].map(csvEscape).join(','),
      ])
      sections.push([
        ['Date range', `${formatDate(data.dateRange.start)} to ${formatDate(data.dateRange.end)}`].map(csvEscape).join(','),
      ])
      sections.push([
        ['Days covered', String(data.days)].map(csvEscape).join(','),
      ])
      sections.push([''])

      // Section 1: Headline metrics
      sections.push([csvEscape('=== HEADLINE METRICS ===')])
      sections.push([
        ['Metric', 'Value'].map(csvEscape).join(','),
      ])
      const headline: [string, string | number][] = [
        ['Total sessions', data.totalSessions],
        ['Completed triage', data.completedCount],
        ['Completion rate (%)', data.completedRate],
        ['Virtual care', data.virtualCount],
        ['In-person routes', data.inPersonCount],
        ['Emergency redirects (911)', data.emergencyCount],
        ['Crisis events (988)', data.crisisCount],
        ['Abandoned', data.abandonedCount],
        ['Virtual pacing — annualized rate', data.virtualPacing.annualRate],
        ['Virtual pacing — target', data.virtualPacing.target],
        ['Virtual pacing — % of target', data.virtualPacing.percentOfTarget],
      ]
      for (const [k, v] of headline) {
        sections.push([[k, v].map(csvEscape).join(',')])
      }
      sections.push([''])

      // Section 2: Care routing mix
      sections.push([csvEscape('=== CARE ROUTING MIX ===')])
      sections.push([['Route', 'Count'].map(csvEscape).join(',')])
      for (const r of data.routingMix) {
        sections.push([[r.name, r.count].map(csvEscape).join(',')])
      }
      sections.push([''])

      // Section 3: Care type breakdown
      sections.push([csvEscape('=== CARE TYPE BREAKDOWN ===')])
      sections.push([['Care type', 'Sessions'].map(csvEscape).join(',')])
      for (const c of data.careTypeBreakdown) {
        sections.push([[c.name, c.count].map(csvEscape).join(',')])
      }
      sections.push([''])

      // Section 4: Urgency breakdown
      sections.push([csvEscape('=== URGENCY LEVEL BREAKDOWN ===')])
      sections.push([['Urgency', 'Sessions'].map(csvEscape).join(',')])
      for (const u of data.urgencyBreakdown) {
        sections.push([[u.name, u.count].map(csvEscape).join(',')])
      }
      sections.push([''])

      // Section 5: Language + device
      sections.push([csvEscape('=== LANGUAGE BREAKDOWN ===')])
      sections.push([['Language', 'Sessions', '%'].map(csvEscape).join(',')])
      for (const l of data.languageBreakdown) {
        sections.push([[l.label, l.count, l.percent].map(csvEscape).join(',')])
      }
      sections.push([''])

      sections.push([csvEscape('=== DEVICE BREAKDOWN ===')])
      sections.push([['Device', 'Sessions', '%'].map(csvEscape).join(',')])
      for (const d of data.deviceBreakdown) {
        sections.push([[d.label, d.count, d.percent].map(csvEscape).join(',')])
      }
      sections.push([''])

      // Section 6: Daily trend
      sections.push([csvEscape('=== DAILY TREND ===')])
      sections.push([
        ['Date', 'Total', 'Virtual', 'In-person', 'Emergency (911)', 'Crisis (988)'].map(csvEscape).join(','),
      ])
      for (const d of data.dailyTrend) {
        sections.push([
          [d.date, d.total, d.virtual, d.inPerson, d.emergency, d.crisis].map(csvEscape).join(','),
        ])
      }
      sections.push([''])

      // Section 7: Hourly heatmap
      sections.push([csvEscape('=== HOURLY HEATMAP (Day × Hour) ===')])
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const hourHeader = ['Day', ...Array.from({ length: 24 }, (_, i) => String(i))]
      sections.push([hourHeader.map(csvEscape).join(',')])
      data.hourlyHeatmap.forEach((row, i) => {
        sections.push([[days[i], ...row].map(csvEscape).join(',')])
      })
      sections.push([''])

      // Section 8: Top partners (referrals)
      sections.push([csvEscape('=== TOP PARTNER REFERRALS ===')])
      sections.push([
        ['Partner', 'Type', 'Referrals', 'Latitude', 'Longitude'].map(csvEscape).join(','),
      ])
      for (const p of data.topPartners) {
        sections.push([
          [p.name, p.type ?? '', p.count, p.latitude ?? '', p.longitude ?? ''].map(csvEscape).join(','),
        ])
      }

      const csv = sections.map((row) => row.join('\n')).join('\n')
      // Prepend UTF-8 BOM so Excel opens non-ASCII correctly
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lackey-dashboard-${formatDate(data.dateRange.start)}-to-${formatDate(data.dateRange.end)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }, [data])

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--surface-0)] px-3 py-2 text-sm font-semibold text-[var(--ink-2)] shadow-[var(--shadow-card)] hover:bg-[var(--surface-1)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition disabled:opacity-60 print:hidden"
      aria-label="Export dashboard data as CSV"
    >
      <span aria-hidden="true">⬇</span>
      {busy ? 'Preparing...' : 'Export CSV'}
    </button>
  )
}
