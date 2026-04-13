'use client'

import { useEffect, useState, useCallback } from 'react'

interface Stats {
  totalSessions: number
  completedRate: number
  virtualCareOffered: number
  emergencyTriggered: number
}

interface Session {
  id: string
  sessionId: string
  createdAt: string
  careTypeSelected?: { name: string }
  urgencyResult?: { name: string }
  completedFlow: boolean
  virtualCareOffered: boolean
  emergencyScreenTriggered: boolean
  locale: string
  device: string
}

/** Escape a cell value for safe CSV output (handles commas, quotes, formula injection) */
function csvEscape(value: string): string {
  // Strip leading formula-trigger characters to prevent CSV injection
  let safe = value.replace(/^[=+\-@\t\r]+/, '')
  // If value contains comma, quote, or newline, wrap in double quotes
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    safe = `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        // Build query params for paginated session list
        const params = new URLSearchParams()
        if (dateRange.start) params.set('where[createdAt][greater_than]', dateRange.start)
        if (dateRange.end) params.set('where[createdAt][less_than]', dateRange.end)
        params.set('depth', '1')
        params.set('limit', '25')
        params.set('page', String(page))
        params.set('sort', '-createdAt')

        // Fetch paginated sessions
        const sessionsRes = await fetch(
          `/api/triage-sessions?${params.toString()}`,
          { signal: controller.signal },
        )
        if (!sessionsRes.ok) throw new Error(`API error: ${sessionsRes.status}`)
        const sessionsData = await sessionsRes.json()

        setSessions(sessionsData.docs ?? [])
        setTotalPages(sessionsData.totalPages ?? 1)

        // Fetch all matching docs for stats (limit=0 returns all, select only needed fields)
        const statsParams = new URLSearchParams()
        if (dateRange.start) statsParams.set('where[createdAt][greater_than]', dateRange.start)
        if (dateRange.end) statsParams.set('where[createdAt][less_than]', dateRange.end)
        statsParams.set('limit', '0')
        statsParams.set('select[completedFlow]', 'true')
        statsParams.set('select[virtualCareOffered]', 'true')
        statsParams.set('select[emergencyScreenTriggered]', 'true')

        const statsRes = await fetch(
          `/api/triage-sessions?${statsParams.toString()}`,
          { signal: controller.signal },
        )
        if (!statsRes.ok) throw new Error(`Stats API error: ${statsRes.status}`)
        const statsData = await statsRes.json()

        const allDocs: Session[] = statsData.docs ?? []
        const total: number = statsData.totalDocs ?? 0
        const completed = allDocs.filter((d) => d.completedFlow).length
        const vcOffered = allDocs.filter((d) => d.virtualCareOffered).length
        const emergencies = allDocs.filter((d) => d.emergencyScreenTriggered).length

        setStats({
          totalSessions: total,
          completedRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          virtualCareOffered: vcOffered,
          emergencyTriggered: emergencies,
        })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError((err as Error).message ?? 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [dateRange, page, retryKey])

  const exportCSV = useCallback(() => {
    const headers = ['Date', 'Care Type', 'Urgency', 'Completed', 'Virtual Care Offered', 'Emergency', 'Locale', 'Device']
    const rows = sessions.map((s) => [
      csvEscape(new Date(s.createdAt).toLocaleDateString()),
      csvEscape(s.careTypeSelected?.name ?? ''),
      csvEscape(s.urgencyResult?.name ?? ''),
      s.completedFlow ? 'Yes' : 'No',
      s.virtualCareOffered ? 'Yes' : 'No',
      s.emergencyScreenTriggered ? 'Yes' : 'No',
      csvEscape(s.locale ?? ''),
      csvEscape(s.device ?? ''),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `triage-sessions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [sessions])

  if (loading && !stats) return <div style={{ padding: 20 }}>Loading analytics...</div>

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h2 style={{ marginBottom: 12, fontSize: 24 }}>Triage Analytics</h2>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16, color: '#991b1b' }}>
          <strong>Error loading analytics:</strong> {error}
        </div>
        <button
          onClick={() => setRetryKey((k) => k + 1)}
          style={{ marginTop: 12, padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20, fontSize: 24 }}>Triage Analytics</h2>

      {/* Date filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <label>
          <span style={{ fontSize: 13, display: 'block', marginBottom: 2 }}>Start date</span>
          <input
            type="date"
            aria-label="Filter start date"
            value={dateRange.start}
            onChange={(e) => { setPage(1); setDateRange((d) => ({ ...d, start: e.target.value })) }}
          />
        </label>
        <span style={{ alignSelf: 'flex-end', paddingBottom: 4 }}>to</span>
        <label>
          <span style={{ fontSize: 13, display: 'block', marginBottom: 2 }}>End date</span>
          <input
            type="date"
            aria-label="Filter end date"
            value={dateRange.end}
            onChange={(e) => { setPage(1); setDateRange((d) => ({ ...d, end: e.target.value })) }}
          />
        </label>
        <button
          onClick={exportCSV}
          style={{ marginLeft: 'auto', alignSelf: 'flex-end', padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      {stats && (
        <div
          role="group"
          aria-label="Analytics summary"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}
        >
          <div aria-label={`Total sessions: ${stats.totalSessions}`} style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.totalSessions}</div>
            <div>Total Sessions</div>
          </div>
          <div aria-label={`Completed rate: ${stats.completedRate}%`} style={{ background: '#eff6ff', padding: 16, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.completedRate}%</div>
            <div>Completed</div>
          </div>
          <div aria-label={`Virtual care offered: ${stats.virtualCareOffered}`} style={{ background: '#fefce8', padding: 16, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.virtualCareOffered}</div>
            <div>Virtual Care Offered</div>
          </div>
          <div aria-label={`Emergency triggers: ${stats.emergencyTriggered}`} style={{ background: '#fef2f2', padding: 16, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.emergencyTriggered}</div>
            <div>Emergency Triggers</div>
          </div>
        </div>
      )}

      {/* Sessions table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <caption style={{ textAlign: 'left', fontWeight: 'bold', marginBottom: 8 }}>
          Triage session history
        </caption>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Date</th>
            <th style={{ padding: 8 }}>Care Type</th>
            <th style={{ padding: 8 }}>Urgency</th>
            <th style={{ padding: 8 }}>Completed</th>
            <th style={{ padding: 8 }}>Virtual Care</th>
            <th style={{ padding: 8 }}>Emergency</th>
            <th style={{ padding: 8 }}>Locale</th>
            <th style={{ padding: 8 }}>Device</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
                No sessions found for the selected date range.
              </td>
            </tr>
          ) : (
            sessions.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8 }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: 8 }}>{s.careTypeSelected?.name ?? '\u2014'}</td>
                <td style={{ padding: 8 }}>{s.urgencyResult?.name ?? '\u2014'}</td>
                <td style={{ padding: 8 }}>{s.completedFlow ? '\u2713' : '\u2717'}</td>
                <td style={{ padding: 8 }}>{s.virtualCareOffered ? '\u2713' : '\u2014'}</td>
                <td style={{ padding: 8 }}>
                  {s.emergencyScreenTriggered
                    ? <span role="img" aria-label="Emergency triggered">{'\ud83d\udea8'}</span>
                    : '\u2014'}
                </td>
                <td style={{ padding: 8 }}>{s.locale?.toUpperCase() ?? '\u2014'}</td>
                <td style={{ padding: 8 }}>{s.device ?? '\u2014'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <nav aria-label="Sessions pagination" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          aria-label="Previous page"
          style={{ padding: '4px 12px' }}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          aria-label="Next page"
          style={{ padding: '4px 12px' }}
        >
          Next
        </button>
      </nav>
    </div>
  )
}
