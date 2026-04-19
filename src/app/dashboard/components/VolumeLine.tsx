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
 * Sessions-over-time visualization. A pure-SVG area + line chart for
 * total session volume, with small orange bars along the baseline
 * showing crisis escalations on the same day. Two channels on one chart
 * keeps the safety signal (rare but important) visually tied to the
 * volume signal (frequent) without a second chart.
 *
 * Why no chart library? Recharts gives us tooltips for free but doesn't
 * handle the dual-scale overlay nicely — the crisis bars are scaled to
 * 35% of the chart height on their own max, so they stay visible even
 * on days with 400+ sessions but 2 crises.
 */
export function VolumeLine({ data, height = 220 }: { data: DayData[]; height?: number }) {
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

  const [hover, setHover] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-[var(--ink-3)]">
        No session data in this range.
      </div>
    )
  }

  const P = { t: 14, r: 14, b: 30, l: 40 }
  const innerW = Math.max(1, w - P.l - P.r)
  const innerH = height - P.t - P.b

  const max = Math.max(...data.map((d) => d.total), 1) * 1.15
  const crisisMax = Math.max(...data.map((d) => d.crisis), 1) * 1.25
  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW
  const y = (v: number) => P.t + innerH - (v / max) * innerH
  const yCrisis = (v: number) => P.t + innerH - (v / crisisMax) * (innerH * 0.35)
  const x = (i: number) => P.l + i * xStep

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.total)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1)} ${P.t + innerH} L ${x(0)} ${P.t + innerH} Z`

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f))
  const hovered = hover !== null ? data[hover] : null

  function formatDate(d: string) {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  // Label density: one tick every ~5 days keeps the axis readable on a
  // 14-day range, one every ~14 days on 90+ day ranges.
  const labelEvery = Math.max(1, Math.ceil(data.length / 7))

  return (
    <div ref={ref} className="relative">
      <svg width={w} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={P.l}
              x2={P.l + innerW}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--stroke)"
              strokeDasharray="2 3"
              opacity={t === 0 ? 0.6 : 0.35}
            />
            <text
              x={P.l - 8}
              y={y(t) + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--ink-3)"
              className="num"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Crisis bars along baseline */}
        {data.map((d, i) => {
          if (d.crisis === 0) return null
          const h = P.t + innerH - yCrisis(d.crisis)
          return (
            <rect
              key={`c-${i}`}
              x={x(i) - 4}
              y={yCrisis(d.crisis)}
              width={8}
              height={h}
              rx={2}
              fill="var(--urgent-emg)"
              opacity={0.85}
            />
          )
        })}

        {/* Area + line */}
        <path d={areaPath} fill="url(#volGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent-sage)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* X-axis date labels */}
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

        {/* Hover points + hit areas */}
        {data.map((d, i) => (
          <g key={`h-${i}`}>
            {hover === i && (
              <>
                <circle cx={x(i)} cy={y(d.total)} r={4} fill="var(--accent-sage)" />
                <line
                  x1={x(i)}
                  x2={x(i)}
                  y1={P.t}
                  y2={P.t + innerH}
                  stroke="var(--accent-sage)"
                  strokeDasharray="2 3"
                  opacity={0.4}
                />
              </>
            )}
            {/* Invisible hit target for hover */}
            <rect
              x={x(i) - xStep / 2}
              y={P.t}
              width={Math.max(1, xStep)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute pointer-events-none rounded-xl border border-[var(--stroke)] bg-[var(--surface-0)] p-3 text-[12px] shadow-[var(--shadow-pop)]"
          style={{
            left: Math.min(Math.max(x(hover!) + 12, 8), w - 180),
            top: 8,
          }}
        >
          <div className="font-semibold font-display text-[13px] text-[var(--ink)] mb-1">
            {formatDate(hovered.date)}
          </div>
          <div className="flex items-center gap-1.5 num text-[var(--ink-2)]">
            <span className="w-2 h-2 rounded-sm bg-[var(--accent-sage)]" />
            Sessions: <span className="font-semibold text-[var(--ink)]">{hovered.total}</span>
          </div>
          {hovered.crisis > 0 && (
            <div className="flex items-center gap-1.5 num text-[var(--ink-2)]">
              <span className="w-2 h-2 rounded-sm bg-[var(--urgent-emg)]" />
              Crisis:{' '}
              <span className="font-semibold text-[var(--urgent-emg)]">{hovered.crisis}</span>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 text-[11px] text-[var(--ink-3)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded bg-[var(--accent-sage)]" />
          Sessions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-[var(--urgent-emg)]" />
          Crisis escalations
        </span>
      </div>
    </div>
  )
}
