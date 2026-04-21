/**
 * Completion funnel — shows drop-off between each step of the patient
 * triage flow. Each row has:
 *  - step label on the left
 *  - a horizontal bar filled to the step's share of the top-of-funnel
 *  - the count + % inside the bar (white text if >50% fill, ink if less)
 *  - the drop-off vs. the prior step in a right-side column
 *
 * The step-over-prior delta is colored red when the drop exceeds 5%
 * so stakeholders can spot weak links in the flow at a glance.
 */
export function CompletionFunnel({
  steps,
}: {
  steps: { name: string; count: number; color: string }[]
}) {
  if (steps.length === 0 || steps.every((s) => s.count === 0)) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--ink-3)]">
        No funnel data yet. Events will appear as patients use the app.
      </div>
    )
  }
  const top = steps[0]?.count || 1

  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((s, i) => {
        const pct = Math.round((s.count / top) * 1000) / 10
        const delta =
          i === 0 ? null : ((s.count - steps[i - 1].count) / Math.max(1, steps[i - 1].count)) * 100
        const textLight = pct > 50
        return (
          <div key={s.name} className="flex items-center gap-3">
            <div className="text-[12.5px] text-[var(--ink)] w-40 shrink-0 font-medium truncate">
              {s.name}
            </div>
            <div className="flex-1 h-[26px] rounded-md bg-[var(--surface-2)] overflow-hidden relative">
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-[var(--accent-primary)]"
                style={{ width: `${pct}%` }}
              />
              <div
                className="absolute inset-0 flex items-center px-2.5 text-[12px] font-medium num"
                style={{ color: textLight ? 'white' : 'var(--ink)' }}
              >
                {s.count.toLocaleString()}
                <span className="opacity-70 ml-1">· {pct}%</span>
              </div>
            </div>
            <div className="w-16 text-right text-[12px] num">
              {delta != null ? (
                <span
                  className={
                    delta < -5
                      ? 'text-[var(--urgent-emg)] font-semibold'
                      : 'text-[var(--ink-3)]'
                  }
                >
                  {delta.toFixed(1)}%
                </span>
              ) : (
                <span className="text-[var(--ink-3)]">—</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
