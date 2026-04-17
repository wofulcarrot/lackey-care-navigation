'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface DayData {
  date: string
  total: number
  virtual: number
  inPerson: number
  emergency: number
  crisis: number
}

function formatDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const day: DayData = payload[0]?.payload
  if (!day) return null
  const total = (day.virtual ?? 0) + (day.inPerson ?? 0) + (day.emergency ?? 0) + (day.crisis ?? 0)

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{formatDate(label)}</div>
      <div style={{ fontWeight: 600, marginBottom: 4, borderBottom: '1px solid #f3f4f6', paddingBottom: 4 }}>
        Total: {total}
      </div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: entry.fill, flexShrink: 0 }} />
          <span style={{ color: '#6b7280' }}>{entry.name}:</span>
          <span style={{ fontWeight: 600 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ data }: { data: DayData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        No session data in this range.
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="virtual" name="Virtual" stackId="day" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="inPerson" name="In-person" stackId="day" fill="#3b82f6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="emergency" name="Emergency (911)" stackId="day" fill="#ef4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="crisis" name="Crisis (988)" stackId="day" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
