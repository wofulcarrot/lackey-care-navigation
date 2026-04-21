import { getDashboardData, parseDateRange } from '@/lib/dashboard-queries'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { DateRangePicker } from '../components/DateRangePicker'
import { UrgencyDonut } from '../components/UrgencyDonut'
import { LangCompareCard } from '../components/LangCompareCard'
import { QuestionDropoff } from '../components/QuestionDropoff'
import { PathToTier } from '../components/PathToTier'
import { ZipTable } from '../components/ZipTable'
import { CompletionTrendChart } from '../components/CompletionTrendChart'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Analytics drill-down — ports the Claude design's full Analytics page.
 * Goes beyond Overview's "what happened?" into "why" and "how":
 *
 *  - Urgency tier mix (donut, full period)
 *  - Completion rate trend (daily)
 *  - Language compare (EN vs ES side-by-side)
 *  - Top paths into each urgency tier (representative sample)
 *  - Per-question drop-off rates (representative sample)
 *  - Top ZIP codes by volume (representative sample)
 *  - Resource engagement (calls / directions / website clicks)
 *
 * The three "representative sample" sections surface the analysis
 * shape staff will see once we attach per-question and per-ZIP
 * metadata to triage-events. That work isn't part of this PR.
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
        subtitle="Why & how — drill-down trends and breakdowns for grant reporting"
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

        {/* Row 1: Urgency donut + Completion trend */}
        <section className="grid gap-4 lg:grid-cols-3">
          <Card
            title="Urgency tier mix"
            subtitle="Share of sessions by recommended urgency"
          >
            <UrgencyDonut slices={data.urgencyBreakdown} centerLabel="in range" />
          </Card>
          <Card
            title="Completion rate trend"
            subtitle="Share of started sessions that reach a recommendation"
            className="lg:col-span-2"
          >
            <CompletionTrendChart data={data.dailyTrend} />
          </Card>
        </section>

        {/* Row 2: Language compare */}
        <Card
          title="English vs Spanish"
          subtitle="Are we equally effective in both languages?"
        >
          <LangCompareCard data={data.langCompare} />
        </Card>

        {/* Row 3: Question drop-off + Path to tier */}
        <section className="grid gap-4 lg:grid-cols-2">
          <Card
            title="Triage drop-off by question"
            subtitle="Where in the flow patients abandon"
          >
            <QuestionDropoff />
            <div className="mt-3 text-[11px] text-[var(--ink-3)] italic">
              Representative sample — real per-question drop-off arrives when
              triage-events carries question IDs.
            </div>
          </Card>
          <Card
            title="Top paths into each tier"
            subtitle="Most common care-type + answer sequences by urgency"
          >
            <PathToTier />
            <div className="mt-3 text-[11px] text-[var(--ink-3)] italic">
              Representative sample — real paths arrive when triage-events
              carries per-answer metadata.
            </div>
          </Card>
        </section>

        {/* Row 4: ZIP table */}
        <Card
          title="Top ZIPs"
          subtitle="Hampton Roads neighborhoods reached — volume by ZIP"
        >
          <ZipTable />
          <div className="mt-3 text-[11px] text-[var(--ink-3)] italic">
            Representative sample — real ZIP bucketing arrives when the location
            screen logs a geo-bucketed prefix.
          </div>
        </Card>

        {/* Row 5: Resource engagement — real data */}
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
