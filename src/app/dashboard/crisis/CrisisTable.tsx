'use client'

import { useState } from 'react'
import { CrisisDrawer, type CrisisDrawerRow } from '../components/CrisisDrawer'

/**
 * Client wrapper for the Crisis log table. Server-renders rows via
 * props (no client-side fetch), but owns the "which row is expanded"
 * state + the drawer itself. This keeps the crisis page a fast
 * server-rendered list of Payload data with just the drawer + selection
 * moved to the client boundary.
 */
export function CrisisTable({ rows }: { rows: CrisisDrawerRow[] }) {
  const [selected, setSelected] = useState<CrisisDrawerRow | null>(null)

  if (rows.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-[14px] text-[var(--ink-3)]">
        No crisis escalations in the last 14 days.
      </div>
    )
  }

  return (
    <>
      <div className="max-h-[65vh] overflow-auto">
        <table className="w-full text-[13px]">
          <thead className="text-[var(--ink-3)] text-[11px] uppercase tracking-wider sticky top-0 bg-[var(--surface-0)] z-10">
            <tr className="border-b border-[var(--stroke)]">
              <th className="text-left px-5 py-2.5 font-semibold">When</th>
              <th className="text-left px-4 py-2.5 font-semibold">Type</th>
              <th className="text-left px-4 py-2.5 font-semibold">Trigger</th>
              <th className="text-left px-4 py-2.5 font-semibold">Care path</th>
              <th className="text-left px-4 py-2.5 font-semibold">Language</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isSelected = selected?.id === r.id
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`border-b border-[var(--stroke)] last:border-0 cursor-pointer transition ${
                    isSelected
                      ? 'bg-[var(--accent-primary-soft)]'
                      : 'hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <td className="px-5 py-2.5 num text-[var(--ink-2)]">
                    {formatRelative(new Date(r.timestamp))}
                  </td>
                  <td className="px-4 py-2.5">
                    <CrisisBadge type={r.type} />
                  </td>
                  <td className="px-4 py-2.5 text-[var(--ink)] font-medium">
                    {r.trigger}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--ink-2)] capitalize">
                    {r.careType}
                  </td>
                  <td className="px-4 py-2.5">
                    <LangBadge lang={r.lang} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <CrisisDrawer session={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

function CrisisBadge({ type }: { type: '911' | '988' }) {
  const styles =
    type === '911'
      ? 'bg-[var(--urgent-life)] text-white'
      : 'bg-[oklch(0.50_0.14_295)] text-white'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold num ${styles}`}>
      {type}
    </span>
  )
}

function LangBadge({ lang }: { lang: 'en' | 'es' | null }) {
  if (!lang) return <span className="text-[var(--ink-3)]">—</span>
  return (
    <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-[var(--surface-2)] text-[var(--ink-2)]">
      {lang}
    </span>
  )
}

function formatRelative(d: Date): string {
  const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.round(h / 24)
  return `${days}d ago`
}
