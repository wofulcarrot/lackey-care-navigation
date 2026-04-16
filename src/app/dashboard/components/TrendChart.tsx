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
          <Bar dataKey="virtual" name="Virtual" stackId="day" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="inPerson" name="In-person" stackId="day" fill="#3b82f6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="emergency" name="Emergency (911)" stackId="day" fill="#ef4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="crisis" name="Crisis (988)" stackId="day" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
