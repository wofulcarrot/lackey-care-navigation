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
import { CHART_COLORS, CHART_TICK_STYLE, CHART_GRID_STROKE } from './chart-theme'

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
    <div
      style={{
        background: '#FEFDFB',
        border: `1px solid ${CHART_COLORS.stroke}`,
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: 13,
        boxShadow: '0 10px 24px rgba(60,30,15,0.12)',
        color: CHART_COLORS.ink,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-display)' }}>
        {formatDate(label)}
      </div>
      <div
        style={{
          fontWeight: 600,
          marginBottom: 4,
          borderBottom: `1px solid ${CHART_COLORS.stroke}`,
          paddingBottom: 4,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        Total: {total}
      </div>
      {payload.map((entry: any) => (
        <div
          key={entry.dataKey}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: entry.fill,
              flexShrink: 0,
            }}
          />
          <span style={{ color: CHART_COLORS.ink2 }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ data }: { data: DayData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--ink-3)]">
        No session data in this range.
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
          <XAxis dataKey="date" tickFormatter={formatDate} tick={CHART_TICK_STYLE} stroke={CHART_GRID_STROKE} />
          <YAxis tick={CHART_TICK_STYLE} allowDecimals={false} stroke={CHART_GRID_STROKE} />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="virtual" name="Virtual" stackId="day" fill={CHART_COLORS.sage} radius={[0, 0, 0, 0]} />
          <Bar dataKey="inPerson" name="In-person" stackId="day" fill={CHART_COLORS.urgentBlue} radius={[0, 0, 0, 0]} />
          <Bar dataKey="emergency" name="Emergency (911)" stackId="day" fill={CHART_COLORS.urgentRed} radius={[0, 0, 0, 0]} />
          <Bar dataKey="crisis" name="Crisis (988)" stackId="day" fill={CHART_COLORS.lavender} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
