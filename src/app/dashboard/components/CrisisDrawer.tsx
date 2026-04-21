'use client'

import { useEffect, useState } from 'react'

export interface CrisisDrawerRow {
  id: string | number
  timestamp: string // ISO date string
  type: '911' | '988'
  trigger: string
  careType: string
  lang: 'en' | 'es' | null
}

/**
 * Session-detail side drawer for the Crisis log. Matches the Claude
 * design: right-anchored 480px panel, backdrop blur behind it,
 * keyboard Escape + outside-click close. The body shows a key-value
 * summary plus a timeline of the path that led to the escalation.
 *
 * Intentionally read-only: we don't have a "mark reviewed" workflow
 * yet — per chat, the review column was removed earlier because we
 * can't follow up today. The drawer gives clinical leads a quick
 * context view without needing an action.
 */
export function CrisisDrawer({
  session,
  onClose,
}: {
  session: CrisisDrawerRow
  onClose: () => void
}) {
  // Lock body scroll behind the drawer so the backdrop doesn't flicker.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Close on Escape for keyboard parity with the X button.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const ts = new Date(session.timestamp)
  const whenAbs = ts.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  const whenRel = formatRelative(ts)

  const isBh = session.type === '988'

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Crisis session detail"
    >
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="w-full sm:w-[480px] bg-[var(--surface-0)] border-l border-[var(--stroke)] shadow-[var(--shadow-pop)] overflow-auto flex flex-col">
        <div className="px-5 py-4 border-b border-[var(--stroke)] flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CrisisBadge type={session.type} />
              <span className="text-[12px] text-[var(--ink-3)] font-mono">
                {String(session.id).slice(0, 14)}
              </span>
            </div>
            <div className="font-display text-[17px] font-semibold text-[var(--ink)]">
              {session.trigger}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--ink-2)]"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <KV label="When"       value={`${whenAbs} · ${whenRel}`} />
          <KV label="Care path"  value={session.careType} />
          <KV
            label="Language"
            value={session.lang === 'es' ? 'Spanish' : session.lang === 'en' ? 'English' : '—'}
          />

          <div className="pt-3 border-t border-[var(--stroke)]">
            <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-2">
              Path
            </div>
            <ol className="flex flex-col gap-1.5 text-[13px]">
              <PathStep>Opened landing</PathStep>
              <PathStep>Emergency screener</PathStep>
              <PathStep highlight>
                <span className="font-semibold text-[var(--urgent-emg)]">
                  {session.type} trigger fired
                </span>
              </PathStep>
              <PathStep muted>
                Shown {isBh ? '988 Lifeline' : '911 takeover'} screen
              </PathStep>
            </ol>
          </div>

          <div className="pt-3 border-t border-[var(--stroke)]">
            <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-2">
              Privacy
            </div>
            <p className="text-[12px] text-[var(--ink-2)] leading-snug">
              The specific symptom or answer the patient disclosed is{' '}
              <strong className="text-[var(--ink)]">not logged</strong>. This
              detail view shows only the pathway (911 vs 988) and the care
              type the patient was on when the escalation fired.
            </p>
          </div>
        </div>
      </div>
    </div>
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

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] w-24 shrink-0 mt-0.5">
        {label}
      </div>
      <div className="text-[13.5px] text-[var(--ink)] flex-1 capitalize">{value}</div>
    </div>
  )
}

function PathStep({
  children,
  highlight,
  muted,
}: {
  children: React.ReactNode
  highlight?: boolean
  muted?: boolean
}) {
  const dotColor = highlight ? 'bg-[var(--urgent-emg)]' : 'bg-[var(--ink-3)]'
  return (
    <li className={`flex items-center gap-2 ${muted ? 'text-[var(--ink-3)]' : 'text-[var(--ink)]'}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
        aria-hidden="true"
      />
      {children}
    </li>
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

/**
 * Client-side wrapper that owns the "which row is selected" state.
 * The server component renders the table rows + this wrapper; rows
 * pass their data into `setSession` on click. Kept separate from the
 * drawer itself so the drawer stays a pure presentation component.
 */
export function useCrisisDrawerState() {
  const [session, setSession] = useState<CrisisDrawerRow | null>(null)
  return { session, setSession, close: () => setSession(null) }
}
