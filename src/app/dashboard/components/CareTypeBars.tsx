/**
 * Horizontal coral-green progress bars ranking care-type counts.
 * Replaces the previous Recharts BarChart — this variant is lighter
 * (no chart lib), matches the design's label-on-left / bar / count-on-
 * right layout, and renders icons inline from a small dictionary.
 *
 * The widest bar pins to 100% of track width so visual proportion
 * reads at a glance even when absolute counts are small.
 */

const ICONS: Record<string, string> = {
  Medical: '🩺',
  Dental: '🦷',
  Vision: '👁️',
  'Eyes / Vision': '👁️',
  'Behavioral Health': '🧠',
  'Mental Health': '🧠',
  Medication: '💊',
  Medicine: '💊',
  'Chronic Care': '📋',
  'Long-term Care': '📋',
  'Not Sure': '❓',
}

function iconFor(name: string): string {
  return ICONS[name] ?? '•'
}

export function CareTypeBars({ items }: { items: { name: string; count: number }[] }) {
  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--ink-3)]">
        No care type data yet.
      </div>
    )
  }
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it) => (
        <div key={it.name} className="flex items-center gap-3">
          <span
            className="text-base shrink-0 w-5 text-center"
            aria-hidden="true"
          >
            {iconFor(it.name)}
          </span>
          <span className="text-[13px] text-[var(--ink)] w-32 shrink-0 truncate">
            {it.name}
          </span>
          <div className="flex-1 h-[22px] rounded-md bg-[var(--surface-2)] overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 rounded-md bg-[var(--accent-sage)]"
              style={{ width: `${(it.count / max) * 100}%` }}
            />
          </div>
          <span className="text-[13px] text-[var(--ink-2)] num font-medium w-14 text-right">
            {it.count.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}
