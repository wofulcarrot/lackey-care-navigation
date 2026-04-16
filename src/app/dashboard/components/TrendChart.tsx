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

export function TrendChart({
  data,
}: {
  data: { date: string; total: number; virtual: number; inPerson: number; emergency: number; crisis: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        No session data in this range.
      </div>
    )
  }
  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            labelFormatter={(l) => formatDate(l as string)}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
          />
          <Legend verticalAlign="top" height={36} />
          {/* Total as a faint background bar so you see the daily volume */}
          <Bar dataKey="total" name="Total" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={20} />
          {/* Breakdown bars stacked on top of each other */}
          <Bar dataKey="virtual" name="Virtual" stackId="breakdown" fill="#10b981" radius={[0, 0, 0, 0]} barSize={14} />
          <Bar dataKey="inPerson" name="In-person" stackId="breakdown" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={14} />
          <Bar dataKey="emergency" name="Emergency (911)" stackId="breakdown" fill="#ef4444" radius={[0, 0, 0, 0]} barSize={14} />
          <Bar dataKey="crisis" name="Crisis (988)" stackId="breakdown" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
