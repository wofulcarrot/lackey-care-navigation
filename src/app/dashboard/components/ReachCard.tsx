/**
 * Reach card — two-column split of language + device breakdown.
 * Bars use the coral/lavender/sage palette instead of raw Tailwind blues
 * so the dashboard stays on-brand with the front door.
 */
export function ReachCard({
  languages,
  devices,
}: {
  languages: { locale: string; label: string; count: number; percent: number }[]
  devices: { device: string; label: string; count: number; percent: number }[]
}) {
  const totalLang = languages.reduce((s, l) => s + l.count, 0)
  const totalDev = devices.reduce((s, d) => s + d.count, 0)

  return (
    <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
        Reach
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1.5 text-sm font-semibold text-[var(--ink)]">Language</div>
          {totalLang === 0 ? (
            <div className="text-sm text-[var(--ink-3)]">&mdash;</div>
          ) : (
            languages.map((l) => (
              <div key={l.locale} className="mb-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[var(--ink)]">{l.label}</span>
                  <span className="num text-[var(--ink-2)]">{l.percent}%</span>
                </div>
                <div className="h-1.5 w-full rounded bg-[var(--surface-2)]">
                  <div
                    className={`h-full rounded ${
                      l.locale === 'en'
                        ? 'bg-[var(--accent-primary)]'
                        : 'bg-[var(--urgent-lavender)]'
                    }`}
                    style={{ width: `${l.percent}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
        <div>
          <div className="mb-1.5 text-sm font-semibold text-[var(--ink)]">Device</div>
          {totalDev === 0 ? (
            <div className="text-sm text-[var(--ink-3)]">&mdash;</div>
          ) : (
            devices.map((d) => (
              <div key={d.device} className="mb-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[var(--ink)]">{d.label}</span>
                  <span className="num text-[var(--ink-2)]">{d.percent}%</span>
                </div>
                <div className="h-1.5 w-full rounded bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded bg-[var(--ink-2)]"
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
