/**
 * Top "answer paths" by urgency tier — shows which care-type → answer
 * sequences most often route patients into each urgency bucket. Useful
 * for validating triage logic ("are we sending the right signals into
 * the right tiers?").
 *
 * The real data for this would come from the triage-events collection
 * once we attach per-answer metadata. For the current seeded dataset,
 * we render a representative sample matching the design so stakeholders
 * can see the intended shape of the analysis.
 */

const PATHS = [
  { tier: 'Life-Threatening', color: 'var(--urgent-life)', chain: ['Emergency screener', 'Chest pain + breathing'],  count: 42 },
  { tier: 'Life-Threatening', color: 'var(--urgent-life)', chain: ['Emergency screener', 'Unresponsive / seizure'],  count: 28 },
  { tier: 'Emergent',         color: 'var(--urgent-emg)',  chain: ['Mental Health', 'Self-harm thoughts = yes'],      count: 118 },
  { tier: 'Emergent',         color: 'var(--urgent-emg)',  chain: ['Medical', 'Severe pain + < 24h'],                 count: 86 },
  { tier: 'Urgent',           color: 'var(--urgent-urg)',  chain: ['Medical', 'Fever + 1–3 days'],                    count: 204 },
  { tier: 'Urgent',           color: 'var(--urgent-urg)',  chain: ['Dental', 'Swelling in jaw'],                      count: 142 },
  { tier: 'Routine',          color: 'var(--urgent-rout)', chain: ['Medical', 'Persistent but stable'],               count: 612 },
  { tier: 'Routine',          color: 'var(--urgent-rout)', chain: ['Dental', 'Tooth cleaning overdue'],               count: 284 },
  { tier: 'Elective',         color: 'var(--urgent-elec)', chain: ['Vision', 'Routine eye check'],                    count: 154 },
] as const

export function PathToTier() {
  return (
    <div className="flex flex-col gap-2">
      {PATHS.map((p, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[var(--surface-2)] transition"
        >
          <span
            className="w-1 h-8 rounded-full shrink-0"
            style={{ background: p.color }}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-[var(--ink)]">{p.tier}</div>
            <div className="text-[11.5px] text-[var(--ink-2)] truncate">
              {p.chain.map((step, idx) => (
                <span key={idx}>
                  {idx > 0 && <span className="text-[var(--ink-3)] mx-1">→</span>}
                  {step}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[13px] font-semibold num text-[var(--ink)]">
            {p.count.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
