'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  CHART_COLORS,
  CHART_TICK_STYLE,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
} from './chart-theme'

export function PartnerReferralChart({
  data,
}: {
  data: { name: string; count: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--ink-3)]">
        No partner referrals yet.
      </div>
    )
  }
  const top = data.slice(0, 8)
  const height = Math.max(200, 36 * top.length + 40)
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 5, right: 24, left: 20, bottom: 5 }}
        >
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
            width={170}
            tick={CHART_TICK_STYLE}
            stroke={CHART_GRID_STROKE}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(224, 122, 95, 0.08)' }}
            formatter={(v) => [`${v} referrals`, 'Count']}
          />
          <Bar dataKey="count" fill={CHART_COLORS.coral} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
