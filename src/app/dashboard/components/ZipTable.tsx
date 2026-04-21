/**
 * Top ZIP codes by session volume — helps leadership see which
 * Hampton Roads neighborhoods the front door is actually reaching.
 *
 * Staff sessions don't yet log the ZIP the patient submitted on the
 * location screen (we deliberately strip PII-adjacent inputs before
 * logging). The list below is a representative Hampton Roads mix so
 * the design's shape is visible. When we extend triage-events with a
 * geo-bucketed ZIP prefix, this component will read real data.
 */

interface Row {
  zip: string
  city: string
  count: number
  share: number // 0..1
}

const ROWS: Row[] = [
  { zip: '23510', city: 'Norfolk',         count: 512, share: 0.12 },
  { zip: '23504', city: 'Norfolk',         count: 398, share: 0.093 },
  { zip: '23462', city: 'Virginia Beach',  count: 366, share: 0.086 },
  { zip: '23502', city: 'Norfolk',         count: 348, share: 0.082 },
  { zip: '23322', city: 'Chesapeake',      count: 298, share: 0.07 },
  { zip: '23666', city: 'Hampton',         count: 286, share: 0.067 },
  { zip: '23320', city: 'Chesapeake',      count: 254, share: 0.06 },
  { zip: '23602', city: 'Newport News',    count: 227, share: 0.053 },
  { zip: '23505', city: 'Norfolk',         count: 198, share: 0.047 },
  { zip: '23669', city: 'Hampton',         count: 172, share: 0.04 },
]

export function ZipTable() {
  const max = Math.max(...ROWS.map((r) => r.count))
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead className="text-[var(--ink-3)] text-[11px] uppercase tracking-wider">
          <tr className="border-b border-[var(--stroke)]">
            <th className="text-left py-2 pr-3 font-semibold">ZIP</th>
            <th className="text-left py-2 pr-3 font-semibold">City</th>
            <th className="text-left py-2 font-semibold">Volume</th>
            <th className="text-right py-2 pl-3 font-semibold w-20">Sessions</th>
            <th className="text-right py-2 pl-3 font-semibold w-16">Share</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr
              key={r.zip}
              className="border-b border-[var(--stroke)]/50 last:border-0 hover:bg-[var(--surface-2)] transition-colors"
            >
              <td className="py-2 pr-3 font-mono num text-[var(--ink)]">{r.zip}</td>
              <td className="py-2 pr-3 text-[var(--ink-2)]">{r.city}</td>
              <td className="py-2">
                <div className="h-3 rounded bg-[var(--surface-2)] overflow-hidden max-w-[200px]">
                  <div
                    className="h-full bg-[var(--accent-primary)] rounded"
                    style={{ width: `${(r.count / max) * 100}%`, opacity: 0.85 }}
                  />
                </div>
              </td>
              <td className="py-2 pl-3 text-right num font-semibold text-[var(--ink)]">
                {r.count.toLocaleString()}
              </td>
              <td className="py-2 pl-3 text-right num text-[var(--ink-2)]">
                {(r.share * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
