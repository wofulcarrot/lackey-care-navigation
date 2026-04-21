import { getDashboardData, parseDateRange } from '../../lib/dashboard-queries'
import { Card } from './components/Card'
import { DateRangePicker } from './components/DateRangePicker'
import { ExportButton } from './components/ExportButton'
import { KpiTile } from './components/KpiTile'
import { VolumeLine } from './components/VolumeLine'
import { UrgencyDonut } from './components/UrgencyDonut'
import { CareTypeBars } from './components/CareTypeBars'
import { CompletionFunnel } from './components/CompletionFunnel'
import { HourlyHeatmap } from './components/HourlyHeatmap'
import { PacingCard } from './components/PacingCard'
import { ReachCard } from './components/ReachCard'
import { PartnerReferralChart } from './components/PartnerReferralChart'
import ReferralMap from './components/ReferralMapClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const range = parseDateRange(params)
  const data = await getDashboardData(range)

  const rangeLabel = range.start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) +
    ' – ' +
    range.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <>
      {/* Top bar: breadcrumb kicker, page title, user controls */}
      <header className="border-b border-[var(--stroke)] bg-[var(--surface-0)] px-6 lg:px-8 py-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="font-display text-[22px] font-semibold text-[var(--ink)] leading-tight">
            Overview
          </div>
          <p className="text-[13px] text-[var(--ink-2)] mt-1">
            Welcome back. Here&apos;s what&apos;s happening at Lackey today.
          </p>
        </div>
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
            urgencyBreakdown: data.urgencyBreakdown.map(({ name, count }) => ({ name, count })),
            languageBreakdown: data.languageBreakdown,
            deviceBreakdown: data.deviceBreakdown,
            dailyTrend: data.dailyTrend,
            hourlyHeatmap: data.hourlyHeatmap,
            topPartners: data.topPartners,
            virtualPacing: data.virtualPacing,
          }}
        />
      </header>

      {/* Main scroll area */}
      <main className="flex-1 px-6 lg:px-8 py-6 space-y-6">
        {/* Range header + presets */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-1">
              Date range
            </div>
            <h2 className="font-display text-[20px] font-semibold text-[var(--ink)] leading-tight">
              {rangeLabel}
            </h2>
            <p className="text-[13px] text-[var(--ink-2)] mt-0.5 num">
              {data.days} day{data.days === 1 ? '' : 's'} ·{' '}
              {data.totalSessions.toLocaleString()} sessions · {data.crisisCount} crisis{' '}
              {data.crisisCount === 1 ? 'escalation' : 'escalations'}
            </p>
          </div>
          <DateRangePicker
            currentStart={data.dateRange.start}
            currentEnd={data.dateRange.end}
          />
        </div>

        {/* KPI row */}
        <section
          aria-label="Headline metrics"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {data.kpis.map((kpi) => (
            <KpiTile key={kpi.id} kpi={kpi} />
          ))}
        </section>

        {/* Row 1: Sessions line (2 col) + Urgency donut (1 col) */}
        <section className="grid gap-4 lg:grid-cols-3">
          <Card
            title={`Sessions · ${data.days} days`}
            subtitle="Daily totals · line: sessions · bars: crisis"
            className="lg:col-span-2"
          >
            <VolumeLine data={data.dailyTrend} />
          </Card>
          <Card
            title="Urgency tier"
            subtitle="Share of sessions by recommended urgency"
          >
            <UrgencyDonut slices={data.urgencyBreakdown} centerLabel="in range" />
          </Card>
        </section>

        {/* Row 2: Care type (1 col) + Completion funnel (2 col) */}
        <section className="grid gap-4 lg:grid-cols-3">
          <Card title="Care type" subtitle="What patients pick first">
            <CareTypeBars items={data.careTypeBreakdown} />
          </Card>
          <Card
            title="Completion funnel"
            subtitle="Where patients drop off"
            className="lg:col-span-2"
          >
            <CompletionFunnel steps={data.funnel} />
          </Card>
        </section>

        {/* Row 3: Heatmap */}
        <Card
          title="When patients arrive"
          subtitle={`Sessions by day of week and hour · ${data.days}-day window · Eastern time`}
        >
          <HourlyHeatmap data={data.hourlyHeatmap} />
        </Card>

        {/* Row 4: Virtual care pacing + Reach */}
        <section className="grid gap-4 lg:grid-cols-3">
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

        {/* Row 5: Partner referrals + Map */}
        <section className="grid gap-4 lg:grid-cols-2">
          <Card title="Top partner referrals" subtitle="Where we sent patients in this range">
            <PartnerReferralChart
              data={data.topPartners.map(({ name, count }) => ({ name, count }))}
            />
          </Card>
          <Card title="Referral destinations" subtitle="Map view of where we routed patients">
            <ReferralMap partners={data.topPartners} />
          </Card>
        </section>

        {/* Resource engagement */}
        {data.resourceEngagement.length > 0 && (
          <Card
            title="Resource engagement"
            subtitle="Which resources patients actually interact with"
            padded={false}
          >
            <div className="overflow-x-auto px-5 pb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--stroke)] text-left text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-3)]">
                    <th className="pt-3 pb-2">Provider</th>
                    <th className="pt-3 pb-2 text-center">Calls</th>
                    <th className="pt-3 pb-2 text-center">Directions</th>
                    <th className="pt-3 pb-2 text-center">Website</th>
                    <th className="pt-3 pb-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.resourceEngagement.slice(0, 10).map((r) => (
                    <tr key={r.name} className="border-b border-[var(--stroke)]/50 last:border-0">
                      <td
                        className="py-2 pr-4 text-[var(--ink)] truncate max-w-[240px]"
                        title={r.name}
                      >
                        {r.name}
                      </td>
                      <td className="py-2 text-center font-semibold num text-[var(--accent-primary)]">
                        {r.calls || '—'}
                      </td>
                      <td className="py-2 text-center font-semibold num text-[var(--accent-sage-ink)]">
                        {r.directions || '—'}
                      </td>
                      <td className="py-2 text-center font-semibold num text-[var(--urgent-elec)]">
                        {r.website || '—'}
                      </td>
                      <td className="py-2 text-center font-bold num text-[var(--ink)]">
                        {r.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Footer note */}
        <div className="rounded-2xl border border-dashed border-[var(--stroke-strong)] bg-[var(--surface-2)]/40 p-4 text-xs text-[var(--ink-2)]">
          <strong className="text-[var(--ink)]">Coming post-pilot:</strong> virtual visit completion
          rate (Lackey virtual platform feed), ED deflection estimates (Sentara data share),
          patient satisfaction (SMS survey), referral click-through tracking.
        </div>

        <footer className="pt-2 pb-6 text-[11px] text-[var(--ink-3)]">
          Confidential · For internal Lackey leadership and pilot partners only
        </footer>
      </main>
    </>
  )
}
