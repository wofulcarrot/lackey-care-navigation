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
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Virtual care pacing
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {count.toLocaleString()} virtual {count === 1 ? 'visit' : 'visits'}
            <span className="text-sm font-medium text-gray-500"> in period</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Annualized rate</div>
          <div className="text-lg font-semibold tabular-nums">
            {annualRate.toLocaleString()}/yr
          </div>
          <div className="text-xs text-gray-500">
            Target: {target.toLocaleString()}/yr
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-valuenow={percentOfTarget}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Virtual visit pacing: ${percentOfTarget}% of annual target`}
        >
          <div
            className={`h-full transition-all ${onTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-600">
          <span className={`font-semibold ${onTrack ? 'text-emerald-700' : 'text-amber-700'}`}>
            {percentOfTarget}% of pilot target
          </span>
          <span>{onTrack ? 'On pace' : 'Below target pace'}</span>
        </div>
      </div>
    </div>
  )
}
