type Tone = 'neutral' | 'success' | 'warning' | 'danger'

/**
 * Dashboard stat tile — a label kicker, big tabular number, optional
 * sublabel. Tone tints the value color so at-a-glance scanning picks
 * out healthy / warning / danger tiers.
 *
 * Design notes:
 *  - The whole tile sits on --surface-0 regardless of tone; only the
 *    value text gets colored. A tinted background would make a row of
 *    5 tiles visually noisy.
 *  - Numbers use the .num utility (tabular-nums) so columns align.
 *  - Label is uppercase + tracked — reads as a small-caps caption
 *    against the large numeric value.
 */
export function MetricTile({
  label,
  value,
  sublabel,
  tone = 'neutral',
}: {
  label: string
  value: string | number
  sublabel?: string
  tone?: Tone
}) {
  const toneText: Record<Tone, string> = {
    neutral: 'text-[var(--ink)]',
    success: 'text-[var(--accent-sage-ink)]',
    warning: 'text-[var(--urgent-yellow-ink)]',
    danger:  'text-[var(--urgent-red)]',
  }
  return (
    <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </div>
      <div className={`mt-1.5 font-display text-3xl font-semibold num ${toneText[tone]}`}>
        {value}
      </div>
      {sublabel && (
        <div className="mt-0.5 text-xs text-[var(--ink-3)]">{sublabel}</div>
      )}
    </div>
  )
}
