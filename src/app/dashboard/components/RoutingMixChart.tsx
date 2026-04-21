'use client'

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_TOOLTIP_STYLE } from './chart-theme'

export function RoutingMixChart({
  data,
}: {
  data: { name: string; count: number; color: string }[]
}) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--ink-3)]">
        No completed sessions in this range yet.
      </div>
    )
  }
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            stroke="none"
            label={(entry) => {
              const count = typeof entry.value === 'number' ? entry.value : 0
              return `${Math.round((count / total) * 100)}%`
            }}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(v, n) => [`${v} sessions`, String(n)]}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
