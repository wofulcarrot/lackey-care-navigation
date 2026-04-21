import { getPayload } from 'payload'
import config from '@payload-config'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { CrisisTable } from './CrisisTable'
import type { CrisisDrawerRow } from '../components/CrisisDrawer'

export const dynamic = 'force-dynamic'

/**
 * Crisis log — every session in the last 14 days that triggered an
 * emergency (911) or crisis (988) pathway. Backed by real
 * TriageSessions rows where emergencyScreenTriggered=true or
 * isCrisis=true. The "trigger" column is a best-effort label derived
 * from the care type name + isCrisis flag — the underlying symptom
 * detail isn't stored (privacy: we deliberately don't log which
 * specific symptom the patient selected).
 */
export default async function CrisisLogPage() {
  const payload = await getPayload({ config })

  // 14-day window is the standard crisis-review cadence — long enough
  // to catch weekly patterns, short enough that the table stays scannable.
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const sessionsRes = await payload.find({
    collection: 'triage-sessions',
    where: {
      and: [
        { createdAt: { greater_than_equal: since.toISOString() } },
        {
          or: [
            { emergencyScreenTriggered: { equals: true } },
            { isCrisis: { equals: true } },
          ],
        },
        { sessionId: { not_like: 'sample-%' } },
      ],
    },
    depth: 1,
    limit: 500,
    sort: '-createdAt',
    pagination: false,
    overrideAccess: true,
  })

  const rows: CrisisDrawerRow[] = (sessionsRes.docs as Array<{
    id: string | number
    createdAt: string
    careTypeSelected?: { name?: string } | string | number | null
    isCrisis?: boolean | null
    locale?: 'en' | 'es' | null
  }>).map((d) => {
    const careName =
      typeof d.careTypeSelected === 'object' && d.careTypeSelected
        ? d.careTypeSelected.name ?? '—'
        : '—'
    return {
      id: d.id,
      timestamp: d.createdAt,
      type: d.isCrisis ? '988' : '911',
      // Privacy-preserving trigger label: care type + pathway, not the
      // specific symptom the patient clicked.
      trigger: d.isCrisis
        ? 'Behavioral health crisis (self-harm disclosure)'
        : `${careName} emergency pathway`,
      careType: careName,
      lang: d.locale ?? null,
    }
  })

  const t911 = rows.filter((r) => r.type === '911').length
  const t988 = rows.filter((r) => r.type === '988').length

  return (
    <>
      <PageHeader
        title="Crisis log"
        subtitle="Every session in the last 14 days that triggered an emergency (911) or crisis (988) pathway"
      />
      <main className="flex-1 px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryCard label="Total (14d)" value={rows.length} />
          <SummaryCard label="911 alerts" value={t911} tone="life" />
          <SummaryCard label="988 alerts" value={t988} tone="crisis" />
        </div>

        <Card
          title="Crisis escalations"
          subtitle={`${rows.length} session${rows.length === 1 ? '' : 's'} in the current window · Click a row for details`}
          padded={false}
        >
          <CrisisTable rows={rows} />
        </Card>

        <div className="rounded-2xl border border-dashed border-[var(--stroke-strong)] bg-[var(--surface-2)]/40 p-4 text-xs text-[var(--ink-2)]">
          <strong className="text-[var(--ink)]">Privacy note:</strong> we
          deliberately do not log the specific symptom or answer that triggered
          the escalation. The trigger column shows the pathway (911 vs 988) and
          the care type, not the patient&apos;s disclosure.
        </div>
      </main>
    </>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'life' | 'crisis' | 'warn'
}) {
  const stripe =
    tone === 'life'
      ? 'var(--urgent-life)'
      : tone === 'crisis'
      ? 'oklch(0.50 0.14 295)'
      : tone === 'warn'
      ? 'var(--urgent-semi)'
      : 'var(--accent-primary)'
  return (
    <div className="bg-[var(--surface-0)] border border-[var(--stroke)] rounded-2xl p-4 relative overflow-hidden shadow-[var(--shadow-card)]">
      <div
        className="absolute top-0 left-0 bottom-0 w-[3px]"
        style={{ background: stripe }}
        aria-hidden="true"
      />
      <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-1.5">
        {label}
      </div>
      <div className="font-display text-[28px] font-semibold text-[var(--ink)] num leading-none">
        {value.toLocaleString()}
      </div>
    </div>
  )
}
