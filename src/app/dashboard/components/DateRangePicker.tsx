'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const PRESETS: { value: string; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All time' },
]

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
  const preset = params.get('preset') ?? (params.get('start') && params.get('end') ? 'custom' : '30d')

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

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm print:hidden">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Date range presets">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => applyPreset(p.value)}
              aria-pressed={preset === p.value}
              disabled={isPending}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                preset === p.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-60`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const f = e.currentTarget as HTMLFormElement
            const s = (f.elements.namedItem('start') as HTMLInputElement).value
            const en = (f.elements.namedItem('end') as HTMLInputElement).value
            applyCustom(s, en)
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="text-sm">
            <span className="mb-0.5 block text-xs text-gray-600">Start</span>
            <input
              type="date"
              name="start"
              defaultValue={startStr}
              max={endStr}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              aria-label="Custom start date"
            />
          </label>
          <label className="text-sm">
            <span className="mb-0.5 block text-xs text-gray-600">End</span>
            <input
              type="date"
              name="end"
              defaultValue={endStr}
              min={startStr}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              aria-label="Custom end date"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
          >
            Apply
          </button>
        </form>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Showing: {currentStart.toLocaleDateString()} &ndash; {currentEnd.toLocaleDateString()}
        {isPending && <span className="ml-2 italic">Loading…</span>}
      </div>
    </div>
  )
}
