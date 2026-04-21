'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

const PRESETS: { value: string; label: string }[] = [
  { value: '7d',  label: '7 days' },
  { value: '14d', label: '14 days' },
  { value: '30d', label: '30 days' },
  { value: 'ytd', label: 'YTD' },
]

/**
 * Compact date-range control — segmented pill group with the 4 most
 * common presets, plus a "Custom…" button that opens a popover with
 * start/end date inputs. Replaces the old full-card layout that took
 * half the viewport width on desktop.
 *
 * The Custom popover mirrors the Claude design: two date inputs side
 * by side, a day-count readout at the bottom, and a Done button that
 * just closes the popover (the route update fires on input change).
 */
export function DateRangePicker({
  currentStart,
  currentEnd,
}: {
  currentStart: Date
  currentEnd: Date
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const preset =
    params.get('preset') ??
    (params.get('start') && params.get('end') ? 'custom' : '30d')

  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // Close the popover on outside click — standard UX for this pattern.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function applyPreset(value: string) {
    const next = new URLSearchParams()
    next.set('preset', value)
    startTransition(() => router.push(`/dashboard?${next.toString()}`))
  }

  function applyCustom(startVal: string, endVal: string) {
    if (!startVal || !endVal) return
    const next = new URLSearchParams()
    next.set('start', startVal)
    next.set('end', endVal)
    startTransition(() => router.push(`/dashboard?${next.toString()}`))
  }

  const startStr = currentStart.toISOString().slice(0, 10)
  const endStr = currentEnd.toISOString().slice(0, 10)

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const customLabel =
    preset === 'custom' ? `${fmt(currentStart)} – ${fmt(currentEnd)}` : 'Custom…'

  return (
    <div ref={wrapRef} className="relative flex items-center gap-2 print:hidden">
      {/* Segmented preset control */}
      <div
        role="group"
        aria-label="Date range presets"
        className="flex p-0.5 rounded-lg bg-[var(--surface-1)] border border-[var(--stroke)] gap-0.5 shadow-[var(--shadow-card)]"
      >
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => applyPreset(p.value)}
            aria-pressed={preset === p.value}
            disabled={isPending}
            className={`px-3 h-8 rounded-md text-[12.5px] font-semibold transition ${
              preset === p.value
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'
            } disabled:opacity-60`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom popover trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-2 h-8 px-3 rounded-lg border text-[12.5px] font-semibold transition shadow-[var(--shadow-card)] ${
          preset === 'custom'
            ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
            : 'bg-[var(--surface-1)] text-[var(--ink)] border-[var(--stroke)] hover:bg-[var(--surface-2)]'
        }`}
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {customLabel}
      </button>

      {/* Custom range popover */}
      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-[340px] bg-[var(--surface-0)] border border-[var(--stroke)] rounded-xl shadow-[var(--shadow-pop)] p-4">
          <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-3">
            Custom range
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[var(--ink-2)]">Start</span>
              <input
                type="date"
                defaultValue={startStr}
                max={endStr}
                onChange={(e) => applyCustom(e.target.value, endStr)}
                className="h-9 px-2.5 rounded-lg border border-[var(--stroke)] bg-[var(--surface-1)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent-primary)]"
                aria-label="Custom start date"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[var(--ink-2)]">End</span>
              <input
                type="date"
                defaultValue={endStr}
                min={startStr}
                onChange={(e) => applyCustom(startStr, e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-[var(--stroke)] bg-[var(--surface-1)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent-primary)]"
                aria-label="Custom end date"
              />
            </label>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[var(--stroke)]">
            <div className="text-[11.5px] text-[var(--ink-3)] num">
              {Math.round(
                (currentEnd.getTime() - currentStart.getTime()) / 86_400_000,
              ) + 1}{' '}
              days
              {isPending && <span className="ml-2 italic">loading…</span>}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 px-3 rounded-md bg-[var(--accent-primary)] text-white text-[12.5px] font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
