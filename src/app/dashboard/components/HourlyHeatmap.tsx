'use client'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * 7 × 24 heatmap — intensity by session count per day-of-week/hour-of-day.
 * Helps the CEO see when uninsured adults actually seek care
 * (typically evenings/weekends — the value prop of 24/7 digital entry).
 */
export function HourlyHeatmap({ data }: { data: number[][] }) {
  const flat = data.flat()
  const max = Math.max(1, ...flat)
  const total = flat.reduce((s, n) => s + n, 0)

  const hourLabels = Array.from({ length: 24 }, (_, i) => i)

  function cellColor(value: number): string {
    if (value === 0) return '#f3f4f6'
    // scale 0-1 over available intensity (log curve to show sparse data)
    const t = Math.log(value + 1) / Math.log(max + 1)
    const alpha = 0.15 + t * 0.85
    return `rgba(37, 99, 235, ${alpha.toFixed(2)})` // blue-600
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Hour header */}
        <div className="flex">
          <div className="w-10" />
          {hourLabels.map((h) => (
            <div key={h} className="flex-1 text-center text-[10px] text-gray-500">
              {h % 3 === 0 ? `${h}` : ''}
            </div>
          ))}
        </div>
        {/* Rows */}
        {DAY_LABELS.map((label, day) => (
          <div key={label} className="flex items-center">
            <div className="w-10 pr-1 text-right text-xs font-medium text-gray-600">{label}</div>
            {hourLabels.map((hour) => {
              const v = data[day]?.[hour] ?? 0
              return (
                <div
                  key={hour}
                  className="relative flex-1 h-6 mx-px rounded-sm"
                  style={{ backgroundColor: cellColor(v) }}
                  title={`${label} ${hour}:00 — ${v} session${v === 1 ? '' : 's'}`}
                  aria-label={`${label} ${hour}:00, ${v} sessions`}
                />
              )
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{total.toLocaleString()} total sessions</span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="flex gap-0.5">
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <div
                  key={t}
                  className="h-3 w-4 rounded-sm"
                  style={{ backgroundColor: t === 0 ? '#f3f4f6' : `rgba(37, 99, 235, ${(0.15 + t * 0.85).toFixed(2)})` }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
