'use client'

import { useLayoutEffect, useRef, useState } from 'react'

interface DayData {
  date: string
  total: number
  virtual: number
  inPerson: number
  emergency: number
  crisis: number
}

/**
 * Daily completion rate over time — "what share of patients who
 * started the flow reached a recommendation?" Computed from the
 * dailyTrend array we already have: completions = virtual + inPerson,
 * total = all non-abandoned + abandoned rows on that day.
 *
 * Pure SVG like VolumeLine — renders a light green target band at
 * 70%+ so staff can see at a glance whether the day-by-day rate is
 * clearing the pilot's target completion-rate floor.
 */
export function CompletionTrendChart({
  data,
  height = 220,
  target = 0.7,
}: {
  data: DayData[]
  height?: number
  target?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(800)
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(() => {
      if (ref.current) setW(ref.current.clientWidth)
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-[var(--ink-3)]">
        No completion data in this range.
      </div>
    )
  }

  // Compute per-day completion rate: completed / (completed + abandoned).
  // Skip days with zero sessions so the line doesn't spike to 0 on dead
  // days and distort the visible axis.
  const series = data.map((d) => {
    const completed = d.virtual + d.inPerson
    const total = d.total
    return {
      date: d.date,
      rate: total > 0 ? completed / total : null,
    }
  })

  const P = { t: 14, r: 14, b: 30, l: 40 }
  const innerW = Math.max(1, w - P.l - P.r)
  const innerH = height - P.t - P.b

  const y = (v: number) => P.t + innerH - v * innerH
  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW
  const x = (i: number) => P.l + i * xStep

  const targetY = y(target)

  // Build the line path, skipping null days with a split path.
  const segments: string[] = []
  let current = ''
  series.forEach((s, i) => {
    if (s.rate == null) {
      if (current) {
        segments.push(current)
        current = ''
      }
      return
    }
    const cmd = current === '' ? 'M' : 'L'
    current += `${cmd} ${x(i)} ${y(s.rate)} `
  })
  if (current) segments.push(current)

  function formatDate(d: string) {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const labelEvery = Math.max(1, Math.ceil(data.length / 7))

  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={height} className="overflow-visible">
        {/* Target band — 70% and up is the healthy zone */}
        <rect
          x={P.l}
          y={P.t}
          width={innerW}
          height={targetY - P.t}
          fill="var(--accent-sage)"
          opacity={0.08}
        />
        <line
          x1={P.l}
          x2={P.l + innerW}
          y1={targetY}
          y2={targetY}
          stroke="var(--accent-sage)"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <text
          x={P.l + innerW - 4}
          y={targetY - 4}
          textAnchor="end"
          fontSize="10"
          fill="var(--accent-sage-ink)"
          className="num"
        >
          target {Math.round(target * 100)}%
        </text>

        {/* Y-axis grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1={P.l}
              x2={P.l + innerW}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--stroke)"
              strokeDasharray={v === 0 || v === 1 ? 'none' : '2 3'}
              opacity={0.5}
            />
            <text
              x={P.l - 8}
              y={y(v) + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--ink-3)"
              className="num"
            >
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}

        {/* Line segments */}
        {segments.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth={2.25}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text
              key={`x-${i}`}
              x={x(i)}
              y={P.t + innerH + 18}
              textAnchor="middle"
              fontSize="10"
              fill="var(--ink-3)"
            >
              {formatDate(d.date)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  )
}
