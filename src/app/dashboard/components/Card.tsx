import type { ReactNode } from 'react'

/**
 * Dashboard card shell — every widget (chart, table, stat group) lives
 * in one of these. Keeps surface color, border, padding, and shadow
 * consistent across the dashboard.
 *
 * Props:
 *  - title/subtitle: header slot (optional). When either is present, the
 *    header gets a bottom border that separates it from the body.
 *  - right: optional trailing element in the header (e.g. a "View all →"
 *    link). Fills the right side without wrapping.
 *  - padded: set false when the body is a table that wants edge-to-edge
 *    rows. Defaults true.
 */
export function Card({
  title,
  subtitle,
  right,
  children,
  className = '',
  padded = true,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={`bg-[var(--surface-0)] border border-[var(--stroke)] rounded-2xl shadow-[var(--shadow-card)] ${className}`}
    >
      {(title || right) && (
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-[var(--stroke)]">
          <div className="min-w-0 flex-1">
            {title && (
              <div className="font-display text-[15px] font-semibold text-[var(--ink)] leading-snug">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[12.5px] text-[var(--ink-3)] mt-1 leading-snug">
                {subtitle}
              </div>
            )}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </div>
  )
}

/**
 * Small semantic pill — used for delta chips on KPI tiles and for
 * "Open 24/7" / cost tags elsewhere on the dashboard.
 */
export function Chip({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'up' | 'down' | 'warn' | 'brand'
  children: ReactNode
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-[var(--surface-2)] text-[var(--ink-2)]',
    up:      'bg-[var(--accent-sage-soft)] text-[var(--accent-sage-ink)]',
    down:    'bg-[var(--urgent-red-soft)] text-[var(--urgent-red)]',
    warn:    'bg-[var(--urgent-yellow-soft)] text-[var(--urgent-yellow-ink)]',
    brand:   'bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold num ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
