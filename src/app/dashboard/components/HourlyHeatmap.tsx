'use client'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * 7 × 24 heatmap — intensity by session count per day-of-week/hour-of-day.
 * Helps the CEO see when uninsured adults actually seek care
 * (typically evenings/weekends — the value prop of 24/7 digital entry).
 *
 * Cell color is a coral hue at varying alpha so the heatmap stays on-brand
 * with the front door. Log curve keeps sparse data visible on a dashboard
 * that might have one outlier hour dominating the linear scale.
 */
export function HourlyHeatmap({ data }: { data: number[][] }) {
  const flat = data.flat()
  const max = Math.max(1, ...flat)
  const total = flat.reduce((s, n) => s + n, 0)

  const hourLabels = Array.from({ length: 24 }, (_, i) => i)

  // Coral hue (approx matches --accent-primary, hardcoded here because
  // inline styles can't read CSS vars for rgba composition).
  const CORAL = '224, 122, 95'
  const EMPTY = 'rgba(150, 140, 130, 0.08)'

  function cellColor(value: number): string {
    if (value === 0) return EMPTY
    const t = Math.log(value + 1) / Math.log(max + 1)
    const alpha = 0.18 + t * 0.75
    return `rgba(${CORAL}, ${alpha.toFixed(2)})`
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Hour header */}
        <div className="flex">
          <div className="w-10" />
          {hourLabels.map((h) => (
            <div key={h} className="flex-1 text-center text-[10px] text-[var(--ink-3)] num">
              {h % 3 === 0 ? `${h}` : ''}
            </div>
          ))}
        </div>
        {/* Rows */}
        {DAY_LABELS.map((label, day) => (
          <div key={label} className="flex items-center">
            <div className="w-10 pr-1 text-right text-xs font-medium text-[var(--ink-2)]">
              {label}
            </div>
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
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-3)]">
          <span className="num">{total.toLocaleString()} total sessions</span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="flex gap-0.5">
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <div
                  key={t}
                  className="h-3 w-4 rounded-sm"
                  style={{
                    backgroundColor:
                      t === 0 ? EMPTY : `rgba(${CORAL}, ${(0.18 + t * 0.75).toFixed(2)})`,
                  }}
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
