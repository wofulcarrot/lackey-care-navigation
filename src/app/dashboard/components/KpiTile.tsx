import type { DashboardKpi } from '@/lib/dashboard-queries'
import { Chip } from './Card'

/**
 * KPI tile — the row of five stat cards at the top of the dashboard.
 *
 * Each tile shows:
 *  - a small uppercase label ("Total sessions", "Crisis escalations", …)
 *  - the big current-period value (Fraunces, tabular, with optional unit)
 *  - a delta chip ("↑ 1.3pp vs last week") with color-coded tone
 *
 * Delta tone logic:
 *  - For most KPIs, UP is good (green chip) and DOWN is bad (red).
 *  - For `tone: 'urgent'` KPIs like crisis escalations, that's inverted
 *    — a DECREASE is good news. The tile also gets a thin orange bar
 *    on top so scanning the row surfaces the safety metric at a glance.
 */
export function KpiTile({ kpi }: { kpi: DashboardKpi }) {
  const isUrgent = kpi.tone === 'urgent'
  const deltaUp = kpi.delta > 0
  const deltaZero = kpi.delta === 0
  const deltaGood = isUrgent ? !deltaUp : deltaUp
  const chipTone: 'up' | 'down' | 'neutral' = deltaZero
    ? 'neutral'
    : deltaGood
    ? 'up'
    : 'down'
  const arrow = deltaZero ? '·' : deltaUp ? '↑' : '↓'
  const abs = Math.abs(kpi.delta)
  // % KPIs report pp (percentage points); count KPIs report %.
  const deltaUnit = kpi.unit === '%' ? 'pp' : '%'

  // Format the value: plain number for counts, as-is for percent.
  const valueText = kpi.unit === '%' ? `${kpi.value}` : kpi.value.toLocaleString()

  return (
    <div className="bg-[var(--surface-0)] border border-[var(--stroke)] rounded-2xl p-4 shadow-[var(--shadow-card)] relative overflow-hidden">
      {isUrgent && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--urgent-emg)]"
          aria-hidden="true"
        />
      )}
      <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-1.5">
        {kpi.label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[32px] font-semibold text-[var(--ink)] num leading-none">
          {valueText}
        </span>
        {kpi.unit && (
          <span className="text-[14px] text-[var(--ink-3)] font-medium">{kpi.unit}</span>
        )}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <Chip tone={chipTone}>
          {arrow} {abs}
          {deltaUnit}
        </Chip>
        <span className="text-[12px] text-[var(--ink-3)]">vs last period</span>
      </div>
    </div>
  )
}
