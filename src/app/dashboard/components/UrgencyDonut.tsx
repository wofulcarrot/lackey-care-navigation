'use client'

interface Slice {
  name: string
  count: number
  color: string
  percent: number
}

/**
 * Urgency-tier donut — a 6-tier segmented ring with the total in the
 * center and a text legend on the right. Rendered as raw SVG rather
 * than recharts so we can hit the exact design (rotated -90deg,
 * stroke-dasharray slices, tabular numeric legend) without fighting
 * recharts' layout.
 *
 * Slices are expected to be pre-sorted in severity order (most severe
 * first) by `getDashboardData` so the legend reads top-to-bottom by
 * risk.
 */
export function UrgencyDonut({
  slices,
  size = 180,
  stroke = 24,
  centerLabel = 'in range',
}: {
  slices: Slice[]
  size?: number
  stroke?: number
  centerLabel?: string
}) {
  const total = slices.reduce((s, x) => s + x.count, 0)

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--ink-3)]">
        No urgency data yet.
      </div>
    )
  }

  const r = (size - stroke) / 2
  const c = size / 2
  const circ = 2 * Math.PI * r

  let off = 0

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          {slices.map((s) => {
            const share = s.count / total
            const len = share * circ
            const gap = circ - len
            const el = (
              <circle
                key={s.name}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${gap}`}
                strokeDashoffset={-off}
              />
            )
            off += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-display text-[26px] font-semibold text-[var(--ink)] num leading-none">
            {total.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider mt-1">
            {centerLabel}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {slices.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            <span className="text-[13px] text-[var(--ink)] flex-1 truncate">{s.name}</span>
            <span className="text-[13px] text-[var(--ink-2)] num font-medium w-12 text-right">
              {s.count.toLocaleString()}
            </span>
            <span className="text-[11px] text-[var(--ink-3)] num w-12 text-right">
              {s.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
