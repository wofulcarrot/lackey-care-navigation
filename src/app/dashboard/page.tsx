import { getDashboardData, parseDateRange } from '../../lib/dashboard-queries'
import { DateRangePicker } from './components/DateRangePicker'
import { MetricTile } from './components/MetricTile'
import { RoutingMixChart } from './components/RoutingMixChart'
import { CareTypeChart } from './components/CareTypeChart'
import { TrendChart } from './components/TrendChart'
import { PartnerReferralChart } from './components/PartnerReferralChart'
import { PacingCard } from './components/PacingCard'
import { ReachCard } from './components/ReachCard'
import { HourlyHeatmap } from './components/HourlyHeatmap'
import ReferralMap from './components/ReferralMapClient'
import { ExportButton } from './components/ExportButton'
import { FunnelChart } from './components/FunnelChart'

export const dynamic = 'force-dynamic'

// Shared section-wrapper styling. Using a constant keeps every dashboard
// card visually consistent and makes global tweaks (e.g. adding padding)
// a single-line change.
const CARD = 'rounded-2xl border border-[var(--stroke)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-card)]'
const SECTION_H2 = 'font-display mb-3 text-base font-semibold text-[var(--ink)]'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const range = parseDateRange(params)
  const data = await getDashboardData(range)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangePicker currentStart={data.dateRange.start} currentEnd={data.dateRange.end} />
        <ExportButton
          data={{
            dateRange: {
              start: data.dateRange.start.toISOString(),
              end: data.dateRange.end.toISOString(),
            },
            days: data.days,
            totalSessions: data.totalSessions,
            completedCount: data.completedCount,
            completedRate: data.completedRate,
            virtualCount: data.virtualCount,
            emergencyCount: data.emergencyCount,
            crisisCount: data.crisisCount,
            inPersonCount: data.inPersonCount,
            abandonedCount: data.abandonedCount,
            routingMix: data.routingMix.map(({ name, count }) => ({ name, count })),
            careTypeBreakdown: data.careTypeBreakdown,
            urgencyBreakdown: data.urgencyBreakdown,
            languageBreakdown: data.languageBreakdown,
            deviceBreakdown: data.deviceBreakdown,
            dailyTrend: data.dailyTrend,
            hourlyHeatmap: data.hourlyHeatmap,
            topPartners: data.topPartners,
            virtualPacing: data.virtualPacing,
          }}
        />
      </div>

      {/* Headline tiles */}
      <section
        aria-label="Headline metrics"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <MetricTile
          label="Users served"
          value={data.totalSessions.toLocaleString()}
          sublabel={`Over ${data.days} day${data.days === 1 ? '' : 's'}`}
        />
        <MetricTile
          label="Completed triage"
          value={`${data.completedRate}%`}
          sublabel={`${data.completedCount.toLocaleString()} of ${data.totalSessions.toLocaleString()}`}
          tone={data.completedRate >= 70 ? 'success' : 'warning'}
        />
        <MetricTile
          label="Virtual care"
          value={data.virtualCount.toLocaleString()}
          sublabel="Routed to Lackey Virtual Care"
          tone="success"
        />
        <MetricTile
          label="Emergency (911)"
          value={data.emergencyCount.toLocaleString()}
          sublabel="Sent to ED / 911"
          tone={data.emergencyCount > 0 ? 'danger' : 'neutral'}
        />
        <MetricTile
          label="Crisis (988)"
          value={data.crisisCount.toLocaleString()}
          sublabel="Routed to 988 Lifeline / CSB"
          tone={data.crisisCount > 0 ? 'danger' : 'neutral'}
        />
      </section>

      {/* Pacing + Reach */}
      <section className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PacingCard
            count={data.virtualPacing.count}
            annualRate={data.virtualPacing.annualRate}
            target={data.virtualPacing.target}
            percentOfTarget={data.virtualPacing.percentOfTarget}
          />
        </div>
        <ReachCard languages={data.languageBreakdown} devices={data.deviceBreakdown} />
      </section>

      {/* Trend (wide) */}
      <section className={CARD}>
        <h2 className={SECTION_H2}>Sessions over time</h2>
        <TrendChart data={data.dailyTrend} />
      </section>

      {/* Routing mix + Care types */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className={CARD}>
          <h2 className={SECTION_H2}>Care routing mix</h2>
          <RoutingMixChart data={data.routingMix} />
        </div>
        <div className={CARD}>
          <h2 className={SECTION_H2}>Sessions by care type</h2>
          <CareTypeChart data={data.careTypeBreakdown} />
        </div>
      </section>

      {/* Hourly heatmap */}
      <section className={CARD}>
        <h2 className="font-display mb-1 text-base font-semibold text-[var(--ink)]">
          When people seek care
        </h2>
        <p className="mb-4 text-xs text-[var(--ink-3)]">
          Session volume by day of week and hour of day (local time). Darker cells = more sessions.
        </p>
        <HourlyHeatmap data={data.hourlyHeatmap} />
      </section>

      {/* Patient funnel + Resource engagement */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className={CARD}>
          <h2 className="font-display mb-1 text-base font-semibold text-[var(--ink)]">
            Patient funnel
          </h2>
          <p className="mb-3 text-xs text-[var(--ink-3)]">Drop-off at each step of the triage flow</p>
          <FunnelChart data={data.funnel} />
        </div>
        <div className={CARD}>
          <h2 className="font-display mb-1 text-base font-semibold text-[var(--ink)]">
            Resource engagement
          </h2>
          <p className="mb-3 text-xs text-[var(--ink-3)]">
            Which resources patients actually interact with
          </p>
          {data.resourceEngagement.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-[var(--ink-3)]">
              No resource engagement data yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--stroke)] text-left text-xs font-semibold text-[var(--ink-3)]">
                    <th className="pb-2">Provider</th>
                    <th className="pb-2 text-center">Calls</th>
                    <th className="pb-2 text-center">Directions</th>
                    <th className="pb-2 text-center">Website</th>
                    <th className="pb-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.resourceEngagement.slice(0, 10).map((r) => (
                    <tr key={r.name} className="border-b border-[var(--stroke)]/50">
                      <td
                        className="py-2 pr-4 text-[var(--ink)] truncate max-w-[200px]"
                        title={r.name}
                      >
                        {r.name}
                      </td>
                      <td className="py-2 text-center font-semibold num text-[var(--accent-primary)]">
                        {r.calls || '\u2014'}
                      </td>
                      <td className="py-2 text-center font-semibold num text-[var(--accent-sage-ink)]">
                        {r.directions || '\u2014'}
                      </td>
                      <td className="py-2 text-center font-semibold num text-[var(--urgent-lavender)]">
                        {r.website || '\u2014'}
                      </td>
                      <td className="py-2 text-center font-bold num text-[var(--ink)]">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Partner referrals + Map */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className={CARD}>
          <h2 className={SECTION_H2}>Top partner referrals</h2>
          <PartnerReferralChart data={data.topPartners.map(({ name, count }) => ({ name, count }))} />
        </div>
        <div className={CARD}>
          <h2 className={SECTION_H2}>Referral destinations</h2>
          <ReferralMap partners={data.topPartners} />
        </div>
      </section>

      {/* Footer note */}
      <section className="rounded-2xl border border-dashed border-[var(--stroke-strong)] bg-[var(--surface-2)]/50 p-4 text-xs text-[var(--ink-2)]">
        <strong className="text-[var(--ink)]">Coming post-pilot:</strong> virtual visit completion
        rate (Lackey virtual platform feed), ED deflection estimates (Sentara data share), patient
        satisfaction (SMS survey), referral click-through tracking.
      </section>
    </div>
  )
}
