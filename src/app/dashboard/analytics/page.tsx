import { getDashboardData, parseDateRange } from '@/lib/dashboard-queries'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { DateRangePicker } from '../components/DateRangePicker'
import { VolumeLine } from '../components/VolumeLine'
import { UrgencyDonut } from '../components/UrgencyDonut'
import { CareTypeBars } from '../components/CareTypeBars'
import { HourlyHeatmap } from '../components/HourlyHeatmap'
import { ReachCard } from '../components/ReachCard'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Deeper analytics view — same data source as Overview but with the
 * scope widened to wider time ranges (30d default, up to all-time).
 * Trimmed to just the drill-down visuals without the KPI row, since
 * Overview already surfaces the topline. Urgency + care type +
 * language/device breakdowns are the "who is this app actually serving"
 * drill-down for grant reporting.
 */
export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const range = parseDateRange(params)
  const data = await getDashboardData(range)

  const rangeLabel =
    range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' – ' +
    range.end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Drill-down trends and breakdowns for grant reporting"
      />
      <main className="flex-1 px-6 lg:px-8 py-6 space-y-6">
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
              {data.totalSessions.toLocaleString()} sessions
            </p>
          </div>
          <DateRangePicker
            currentStart={data.dateRange.start}
            currentEnd={data.dateRange.end}
          />
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card
            title={`Sessions · ${data.days} days`}
            subtitle="Line: total sessions · bars: crisis escalations"
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

        <section className="grid gap-4 lg:grid-cols-2">
          <Card title="Care type" subtitle="What patients pick first">
            <CareTypeBars items={data.careTypeBreakdown} />
          </Card>
          <ReachCard
            languages={data.languageBreakdown}
            devices={data.deviceBreakdown}
          />
        </section>

        <Card
          title="When patients arrive"
          subtitle={`Sessions by day of week and hour · ${data.days}-day window · Eastern time`}
        >
          <HourlyHeatmap data={data.hourlyHeatmap} />
        </Card>

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
                  {data.resourceEngagement.slice(0, 20).map((r) => (
                    <tr
                      key={r.name}
                      className="border-b border-[var(--stroke)]/50 last:border-0"
                    >
                      <td
                        className="py-2 pr-4 text-[var(--ink)] truncate max-w-[260px]"
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
      </main>
    </>
  )
}
