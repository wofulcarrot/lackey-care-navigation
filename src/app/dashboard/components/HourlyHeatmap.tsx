'use client'

import { useState } from 'react'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * 7 × 24 heatmap showing when patients actually seek care, plus a
 * side insights panel that surfaces the two most useful derived
 * metrics for the CEO:
 *  - After-hours share of total sessions (directly validates the
 *    "24/7 digital front door" value prop for an 8a–5p clinic)
 *  - Top 5 busiest times with an indicator for whether Lackey was
 *    open at that time
 *
 * Lackey Clinic hours: Mon–Thu 8a–5p, Fri 8a–1p, closed Sat/Sun.
 */
export function HourlyHeatmap({ data }: { data: number[][] }) {
  const [hover, setHover] = useState<{ d: number; h: number; v: number } | null>(null)
  const flat = data.flat()
  const max = Math.max(1, ...flat)
  const total = flat.reduce((s, n) => s + n, 0)

  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Coral heatmap cell — lighter for fewer sessions, darker for more.
  // Uses oklch for perceptually-even darkening steps.
  function color(v: number): string {
    if (v === 0) return 'oklch(0.96 0.008 72)'
    const t = v / max
    const l = 0.98 - t * 0.35
    const c = 0.015 + t * 0.16
    return `oklch(${l} ${c} 38)`
  }

  const fmtHour = (h: number) =>
    h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`

  // Peak hours list — top 5 by volume across the week.
  const peaks: { d: number; h: number; v: number }[] = []
  data.forEach((row, d) => row.forEach((v, h) => peaks.push({ d, h, v })))
  peaks.sort((a, b) => b.v - a.v)
  const topPeaks = peaks.slice(0, 5)

  // Lackey Clinic open hours.
  const isOpen = (d: number, h: number) => {
    if (d === 0 || d === 6) return false
    if (d === 5) return h >= 8 && h < 13
    return h >= 8 && h < 17
  }

  let openSessions = 0
  data.forEach((row, d) =>
    row.forEach((v, h) => {
      if (isOpen(d, h)) openSessions += v
    }),
  )
  const afterHoursPct =
    total > 0 ? Math.round(((total - openSessions) / total) * 100) : 0

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Heatmap grid */}
      <div className="relative flex-1 max-w-[680px] min-w-0">
        {/* Hour column headers */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8" />
          <div
            className="flex-1 grid"
            style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}
          >
            {hours.map((h) => (
              <div
                key={h}
                className={`text-[9.5px] text-[var(--ink-3)] text-center ${
                  h % 3 !== 0 ? 'opacity-0' : ''
                }`}
              >
                {fmtHour(h)}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {data.map((row, d) => (
          <div key={d} className="flex items-center gap-2 mb-[2px]">
            <div className="w-8 text-[10.5px] text-[var(--ink-2)] font-medium text-right">
              {DAY_LABELS[d]}
            </div>
            <div
              className="flex-1 grid gap-[2px]"
              style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}
            >
              {row.map((v, h) => (
                <div
                  key={h}
                  className="h-4 rounded-[2px] cursor-pointer transition-transform hover:scale-110"
                  style={{
                    background: color(v),
                    outline:
                      hover && hover.d === d && hover.h === h
                        ? '2px solid var(--ink)'
                        : 'none',
                  }}
                  onMouseEnter={() => setHover({ d, h, v })}
                  onMouseLeave={() => setHover(null)}
                  aria-label={`${DAY_LABELS[d]} ${fmtHour(h)}: ${v} sessions`}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Legend + hover readout */}
        <div className="flex items-center gap-2 mt-3 text-[11px] text-[var(--ink-3)]">
          <span>Fewer</span>
          <div className="flex gap-[2px]">
            {[0.1, 0.25, 0.5, 0.75, 1].map((t, i) => (
              <div
                key={i}
                className="w-3.5 h-2.5 rounded-sm"
                style={{ background: color(max * t) }}
              />
            ))}
          </div>
          <span>More</span>
          {hover && (
            <span className="ml-auto font-medium text-[var(--ink)] num">
              {DAY_LABELS[hover.d]} {fmtHour(hover.h)} ·{' '}
              <span className="text-[var(--accent-primary)]">{hover.v}</span> sessions
            </span>
          )}
        </div>
      </div>

      {/* Insights panel */}
      <div className="w-full lg:w-[240px] shrink-0 flex flex-col gap-4 lg:pl-6 lg:border-l border-[var(--stroke)]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-1.5">
            Arriving when clinic is closed
          </div>
          <div className="flex items-baseline gap-1.5">
            <div className="font-display text-[32px] font-semibold text-[var(--ink)] num leading-none">
              {afterHoursPct}%
            </div>
            <div className="text-[12px] text-[var(--ink-2)]">of sessions</div>
          </div>
          {/* Split bar: open vs closed */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden flex">
            <div
              className="h-full bg-[var(--accent-sage)]"
              style={{ width: `${100 - afterHoursPct}%` }}
            />
            <div
              className="h-full bg-[var(--accent-primary)]"
              style={{ width: `${afterHoursPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--ink-3)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[var(--accent-sage)]" />
              Open {100 - afterHoursPct}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[var(--accent-primary)]" />
              After-hours {afterHoursPct}%
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-3)] mt-2 leading-snug">
            Lackey is open Mon–Thu 8a–5p, Fri 8a–1p. After-hours patients are routed to virtual care or other resources.
          </p>
        </div>

        {/* Top peak hours */}
        {topPeaks.some((p) => p.v > 0) && (
          <div className="pt-4 border-t border-[var(--stroke)]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-2">
              Busiest times
            </div>
            <ol className="flex flex-col gap-1.5">
              {topPeaks
                .filter((p) => p.v > 0)
                .map((p, i) => (
                  <li
                    key={`${p.d}-${p.h}`}
                    className="flex items-center gap-2.5"
                  >
                    <span className="w-4 h-4 rounded bg-[var(--surface-2)] text-[10px] font-semibold text-[var(--ink-2)] flex items-center justify-center shrink-0 num">
                      {i + 1}
                    </span>
                    <span className="text-[12.5px] text-[var(--ink)] font-medium flex-1">
                      {DAY_LABELS[p.d]} {fmtHour(p.h)}
                    </span>
                    <span className="text-[12px] text-[var(--accent-primary)] num font-semibold">
                      {p.v}
                    </span>
                    {!isOpen(p.d, p.h) && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--ink-3)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
                        closed
                      </span>
                    )}
                  </li>
                ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
