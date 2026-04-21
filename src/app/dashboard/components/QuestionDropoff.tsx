/**
 * Per-question drop-off chart — shows which triage questions cause
 * patients to abandon the flow. Each row is: question ID + text +
 * horizontal bar + percent. Bars color-code by severity:
 *   <7%   sage   (healthy)
 *   7–15% yellow (watch)
 *   >15%  orange (investigate)
 *
 * Represents the shape of analysis staff will see once
 * triage-events is extended with per-question metadata. Current seed
 * data doesn't yet include the session-id → question-id link needed
 * to compute real drop-off rates per question, so the rows below are
 * a representative sample that matches the design.
 */

interface Row {
  id: string
  text: string
  dropRate: number
}

const ROWS: Row[] = [
  { id: 'med-q1',  text: 'How bad is your pain?',                       dropRate: 3.8 },
  { id: 'med-q2',  text: 'How long has it been hurting?',               dropRate: 6.2 },
  { id: 'med-q3',  text: 'Do you have a fever?',                        dropRate: 4.1 },
  { id: 'bh-q1',   text: 'Have you thought about hurting yourself?',    dropRate: 18.4 },
  { id: 'bh-q2',   text: 'How are you sleeping?',                       dropRate: 9.1 },
  { id: 'den-q1',  text: 'Where does it hurt in your mouth?',           dropRate: 5.7 },
  { id: 'vis-q1',  text: 'What is wrong with your eyes?',               dropRate: 12.3 },
  { id: 'med-q4',  text: 'Are you pregnant?',                           dropRate: 8.6 },
  { id: 'chr-q1',  text: 'Do you have a long-term condition?',          dropRate: 7.2 },
  { id: 'rx-q1',   text: 'What medicine do you need?',                  dropRate: 4.9 },
]

export function QuestionDropoff() {
  const max = Math.max(...ROWS.map((r) => r.dropRate))
  return (
    <div className="flex flex-col gap-1.5">
      {ROWS.map((r) => {
        const severity =
          r.dropRate >= 15 ? 'high' : r.dropRate >= 7 ? 'med' : 'low'
        const bar = {
          high: 'var(--urgent-emg)',
          med:  'var(--urgent-semi)',
          low:  'var(--accent-sage)',
        }[severity]
        const textColor = severity === 'high' ? 'var(--urgent-emg)' : 'var(--ink)'
        return (
          <div
            key={r.id}
            className="grid grid-cols-[72px_1fr_72px_56px] items-center gap-2.5 text-[12.5px]"
          >
            <div className="text-[11px] font-mono text-[var(--ink-3)] truncate">
              {r.id}
            </div>
            <div className="text-[var(--ink)] truncate pr-2" title={r.text}>
              {r.text}
            </div>
            <div className="relative h-4 rounded bg-[var(--surface-2)] overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded transition-all"
                style={{
                  width: `${(r.dropRate / max) * 100}%`,
                  background: bar,
                  opacity: 0.85,
                }}
              />
            </div>
            <div
              className="text-right num font-semibold"
              style={{ color: textColor }}
            >
              {r.dropRate.toFixed(1)}%
            </div>
          </div>
        )
      })}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[var(--stroke)] text-[11px] text-[var(--ink-3)]">
        <span className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-sm"
            style={{ background: 'var(--accent-sage)' }}
          />
          &lt;7% · healthy
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-sm"
            style={{ background: 'var(--urgent-semi)' }}
          />
          7–15% · watch
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-sm"
            style={{ background: 'var(--urgent-emg)' }}
          />
          &gt;15% · investigate
        </span>
      </div>
    </div>
  )
}
