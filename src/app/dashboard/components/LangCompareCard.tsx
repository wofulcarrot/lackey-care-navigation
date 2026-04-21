import type { LangCompareStats } from '@/lib/dashboard-queries'

/**
 * EN vs ES side-by-side comparison card — matches the Claude design's
 * LangCompare. Four stat tiles on the left, urgency-mix bars + top
 * care types on the right.
 *
 * The urgency bars use a mirrored layout: EN grows right-to-left from
 * the centerline, ES grows left-to-right. That makes the two language
 * mixes instantly comparable without the reader doing math.
 */

const TIERS = [
  { key: 'life', label: 'Life-Threat.', color: 'var(--urgent-life)' },
  { key: 'emg',  label: 'Emergent',     color: 'var(--urgent-emg)'  },
  { key: 'urg',  label: 'Urgent',       color: 'var(--urgent-urg)'  },
  { key: 'semi', label: 'Semi-Urg.',    color: 'var(--urgent-semi)' },
  { key: 'rout', label: 'Routine',      color: 'var(--urgent-rout)' },
  { key: 'elec', label: 'Elective',     color: 'var(--urgent-elec)' },
] as const

export function LangCompareCard({ data }: { data: LangCompareStats }) {
  const maxTier = Math.max(
    ...TIERS.flatMap((t) => [data.en.mix[t.key], data.es.mix[t.key]]),
    1,
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Left: stat tiles */}
      <div className="lg:col-span-2 flex flex-col gap-2.5">
        <Stat label="Sessions"        enVal={data.en.total.toLocaleString()}      esVal={data.es.total.toLocaleString()} />
        <Stat label="Completion rate" enVal={pct(data.en.completionRate)}         esVal={pct(data.es.completionRate)} />
        <Stat label="Crisis rate"     enVal={pct1(data.en.crisisRate)}            esVal={pct1(data.es.crisisRate)} />
        <Stat label="Virtual CTR"     enVal={pct(data.en.virtualCtr)}             esVal={pct(data.es.virtualCtr)} />
      </div>

      {/* Right: urgency mix + top care types */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-2">
            Urgency mix (% of sessions)
          </div>
          <div className="flex flex-col gap-1.5">
            {TIERS.map((t) => (
              <div
                key={t.key}
                className="grid grid-cols-[88px_1fr_44px_1fr_44px] items-center gap-2 text-[11.5px]"
              >
                <div className="text-[var(--ink-2)]">{t.label}</div>
                <div className="h-3.5 relative bg-[var(--surface-2)] rounded-sm overflow-hidden">
                  <div
                    className="absolute right-0 top-0 bottom-0"
                    style={{
                      width: `${(data.en.mix[t.key] / maxTier) * 100}%`,
                      background: t.color,
                      opacity: 0.9,
                    }}
                  />
                </div>
                <div className="num text-[var(--ink)] font-medium text-center">
                  {data.en.mix[t.key].toFixed(1)}%
                </div>
                <div className="h-3.5 relative bg-[var(--surface-2)] rounded-sm overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0"
                    style={{
                      width: `${(data.es.mix[t.key] / maxTier) * 100}%`,
                      background: t.color,
                      opacity: 0.9,
                    }}
                  />
                </div>
                <div className="num text-[var(--ink)] font-medium">
                  {data.es.mix[t.key].toFixed(1)}%
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[88px_1fr_44px_1fr_44px] gap-2 text-[10px] text-[var(--ink-3)] mt-1 uppercase tracking-wider">
              <div />
              <div className="text-right pr-1">EN</div>
              <div />
              <div className="pl-1">ES</div>
              <div />
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-2">
            Top care types
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CareList title="English" care={data.en.care} />
            <CareList title="Spanish" care={data.es.care} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  enVal,
  esVal,
}: {
  label: string
  enVal: string
  esVal: string
}) {
  return (
    <div className="rounded-xl border border-[var(--stroke)] p-3 bg-[var(--surface-0)]">
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-2">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] text-[var(--ink-3)] mb-0.5">EN</div>
          <div className="font-display text-[20px] font-semibold text-[var(--ink)] num leading-none">
            {enVal}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--ink-3)] mb-0.5">ES</div>
          <div className="font-display text-[20px] font-semibold text-[var(--ink)] num leading-none">
            {esVal}
          </div>
        </div>
      </div>
    </div>
  )
}

function CareList({
  title,
  care,
}: {
  title: string
  care: { id: string; label: string; pct: number }[]
}) {
  return (
    <div>
      <div className="text-[10.5px] text-[var(--ink-3)] mb-1">{title}</div>
      <div className="flex flex-col gap-1">
        {care.length === 0 ? (
          <div className="text-[11.5px] text-[var(--ink-3)] italic">No data</div>
        ) : (
          care.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <span className="text-[var(--ink)] truncate">{c.label}</span>
              <span className="text-[var(--ink-2)] num font-medium">{c.pct}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`
}
function pct1(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}
