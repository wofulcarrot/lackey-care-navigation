'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  CHART_COLORS,
  CHART_TICK_STYLE,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
} from './chart-theme'

export function CareTypeChart({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--ink-3)]">
        No care type data yet.
      </div>
    )
  }
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
          <XAxis
            dataKey="name"
            tick={CHART_TICK_STYLE}
            angle={-15}
            textAnchor="end"
            height={50}
            stroke={CHART_GRID_STROKE}
          />
          <YAxis tick={CHART_TICK_STYLE} allowDecimals={false} stroke={CHART_GRID_STROKE} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(224, 122, 95, 0.08)' }} />
          <Bar dataKey="count" fill={CHART_COLORS.coral} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
