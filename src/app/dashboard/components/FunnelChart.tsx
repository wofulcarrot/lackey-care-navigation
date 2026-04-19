'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CHART_COLORS,
  CHART_TICK_STYLE,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
} from './chart-theme'

interface FunnelStep {
  name: string
  count: number
  color: string
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as FunnelStep
  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <div style={{ fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
        {d.name}
      </div>
      <div style={{ fontVariantNumeric: 'tabular-nums' }}>
        {d.count.toLocaleString()} sessions
      </div>
    </div>
  )
}

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--ink-3)]">
        No funnel data yet. Events will appear as patients use the app.
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_GRID_STROKE} />
          <XAxis
            type="number"
            tick={CHART_TICK_STYLE}
            allowDecimals={false}
            stroke={CHART_GRID_STROKE}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ ...CHART_TICK_STYLE, fontSize: 12 }}
            width={110}
            stroke={CHART_GRID_STROKE}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(224, 122, 95, 0.08)' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              // Each step carries its own coral→sage palette color from
              // dashboard-queries.ts. Falls back to coral if missing.
              <Cell key={entry.name} fill={entry.color || CHART_COLORS.coral} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
