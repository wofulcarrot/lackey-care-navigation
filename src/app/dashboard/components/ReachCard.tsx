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
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Reach</div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 text-sm font-medium text-gray-700">Language</div>
          {totalLang === 0 ? (
            <div className="text-sm text-gray-400">&mdash;</div>
          ) : (
            languages.map((l) => (
              <div key={l.locale} className="mb-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{l.label}</span>
                  <span className="tabular-nums text-gray-600">{l.percent}%</span>
                </div>
                <div className="h-1.5 w-full rounded bg-gray-100">
                  <div
                    className={l.locale === 'en' ? 'h-full rounded bg-blue-500' : 'h-full rounded bg-purple-500'}
                    style={{ width: `${l.percent}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-gray-700">Device</div>
          {totalDev === 0 ? (
            <div className="text-sm text-gray-400">&mdash;</div>
          ) : (
            devices.map((d) => (
              <div key={d.device} className="mb-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{d.label}</span>
                  <span className="tabular-nums text-gray-600">{d.percent}%</span>
                </div>
                <div className="h-1.5 w-full rounded bg-gray-100">
                  <div className="h-full rounded bg-gray-500" style={{ width: `${d.percent}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
