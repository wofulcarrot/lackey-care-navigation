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

interface FunnelStep {
  name: string
  count: number
  color: string
}

const COLORS = [
  '#1B4F72', '#2471A3', '#2E86C1', '#3498DB',
  '#5DADE2', '#85C1E9', '#AED6F1', '#D6EAF8',
]

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as FunnelStep
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
      padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
      <div>{d.count.toLocaleString()} sessions</div>
    </div>
  )
}

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        No funnel data yet. Events will appear as patients use the app.
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
