/**
 * Virtual care pacing card — shows count in period, annualized rate,
 * and a progress bar against the pilot target. The bar turns sage green
 * when on pace (>= 80%) and amber when below.
 */
export function PacingCard({
  count,
  annualRate,
  target,
  percentOfTarget,
}: {
  count: number
  annualRate: number
  target: number
  percentOfTarget: number
}) {
  const pct = Math.min(100, percentOfTarget)
  const onTrack = percentOfTarget >= 80
  const barColor = onTrack
    ? 'bg-[var(--accent-sage)]'
    : 'bg-[var(--urgent-yellow)]'
  const labelColor = onTrack
    ? 'text-[var(--accent-sage-ink)]'
    : 'text-[var(--urgent-yellow-ink)]'

  return (
    <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
            Virtual care pacing
          </div>
          <div className="mt-1.5 font-display text-2xl font-semibold num text-[var(--ink)]">
            {count.toLocaleString()} virtual {count === 1 ? 'visit' : 'visits'}
            <span className="text-sm font-medium text-[var(--ink-3)]"> in period</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--ink-3)]">Annualized rate</div>
          <div className="text-lg font-semibold num text-[var(--ink)]">
            {annualRate.toLocaleString()}/yr
          </div>
          <div className="text-xs text-[var(--ink-3)]">
            Target: {target.toLocaleString()}/yr
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-[var(--surface-2)]"
          role="progressbar"
          aria-valuenow={percentOfTarget}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Virtual visit pacing: ${percentOfTarget}% of annual target`}
        >
          <div
            className={`h-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-[var(--ink-2)]">
          <span className={`font-semibold num ${labelColor}`}>
            {percentOfTarget}% of pilot target
          </span>
          <span>{onTrack ? 'On pace' : 'Below target pace'}</span>
        </div>
      </div>
    </div>
  )
}
