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

export const dynamic = 'force-dynamic'

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
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-800">Sessions over time</h2>
        <TrendChart data={data.dailyTrend} />
      </section>

      {/* Routing mix + Care types */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-800">Care routing mix</h2>
          <RoutingMixChart data={data.routingMix} />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-800">Sessions by care type</h2>
          <CareTypeChart data={data.careTypeBreakdown} />
        </div>
      </section>

      {/* Hourly heatmap */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-800">When people seek care</h2>
        <p className="mb-4 text-xs text-gray-600">
          Session volume by day of week and hour of day (local time). Darker cells = more sessions.
        </p>
        <HourlyHeatmap data={data.hourlyHeatmap} />
      </section>

      {/* Partner referrals + Map */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-800">Top partner referrals</h2>
          <PartnerReferralChart data={data.topPartners.map(({ name, count }) => ({ name, count }))} />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-800">Referral destinations</h2>
          <ReferralMap partners={data.topPartners} />
        </div>
      </section>

      {/* Footer note */}
      <section className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-gray-600">
        <strong>Coming post-pilot:</strong> virtual visit completion rate (Lackey virtual
        platform feed), ED deflection estimates (Sentara data share), patient satisfaction
        (SMS survey), referral click-through tracking.
      </section>
    </div>
  )
}
