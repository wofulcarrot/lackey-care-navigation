import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'

export const dynamic = 'force-dynamic'

/**
 * Clinic directory — reads CareResources out of Payload so staff can
 * see what's in the patient-app directory today. Edits route to the
 * Payload admin (via `/admin/collections/care-resources/:id`) rather
 * than a custom form, since Payload already has the full editor with
 * validation, i18n, and versioning.
 */
export default async function ResourcesPage() {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'care-resources',
    limit: 200,
    sort: 'name',
    overrideAccess: true,
  })

  // Intentionally any-cast — the generated Payload types don't line up
  // with the optional fields we render (cost, type, address city/zip)
  // because they're localized/compound. The shape below is what the
  // table actually uses.
  const rows = res.docs as any[]
  const activeCount = rows.filter((r) => r.isActive !== false).length

  return (
    <>
      <PageHeader
        title="Clinic directory"
        subtitle={`${rows.length} resources · Patient app pulls live from this table`}
        actions={
          <Link
            href="/admin/collections/care-resources"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 rounded-lg bg-[var(--ink)] text-[var(--surface-0)] text-[13px] font-semibold hover:brightness-110 transition inline-flex items-center gap-1.5"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add in CMS
          </Link>
        }
      />
      <main className="flex-1 px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryPill label="Total" value={rows.length} />
          <SummaryPill label="Active" value={activeCount} tone="sage" />
          <SummaryPill label="Inactive" value={rows.length - activeCount} tone="muted" />
          <SummaryPill
            label="Free / sliding"
            value={rows.filter((r) => r.cost === 'free' || r.cost === 'sliding_scale').length}
            tone="sage"
          />
        </div>

        <Card padded={false}>
          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-[13px]">
              <thead className="text-[var(--ink-3)] text-[11px] uppercase tracking-wider sticky top-0 bg-[var(--surface-0)] z-10">
                <tr className="border-b border-[var(--stroke)]">
                  <th className="text-left px-5 py-2.5 font-semibold">Name</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Type</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Cost</th>
                  <th className="text-left px-4 py-2.5 font-semibold">City</th>
                  <th className="text-left px-4 py-2.5 font-semibold">ZIP</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Phone</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Edit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const active = r.isActive !== false
                  const addr = r.address ?? {}
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-[var(--stroke)] last:border-0 hover:bg-[var(--surface-2)] transition"
                    >
                      <td className="px-5 py-3 font-medium text-[var(--ink)] truncate max-w-[260px]">
                        {r.name}
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-2)] capitalize">
                        {(r.type ?? '—').toString().replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <CostChip cost={r.cost} />
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-2)] truncate max-w-[140px]">
                        {addr.city ?? '—'}
                      </td>
                      <td className="px-4 py-3 num text-[var(--ink-2)]">
                        {addr.zip ?? '—'}
                      </td>
                      <td className="px-4 py-3 num text-[var(--ink-2)]">
                        {r.phone ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            active ? 'bg-[var(--accent-sage)]' : 'bg-[var(--ink-3)]'
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className={
                            active
                              ? 'text-[var(--ink-2)]'
                              : 'text-[var(--ink-3)] italic'
                          }
                        >
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/collections/care-resources/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-semibold text-[var(--accent-primary)] hover:underline"
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="rounded-2xl border border-dashed border-[var(--stroke-strong)] bg-[var(--surface-2)]/40 p-4 text-xs text-[var(--ink-2)]">
          Edits route to the full Payload editor so you get
          validation, EN/ES localization, and versioning for every change.
          The patient app pulls live from this table — changes go live at
          the next page load.
        </div>
      </main>
    </>
  )
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'sage' | 'muted'
}) {
  const stripe =
    tone === 'sage'
      ? 'var(--accent-sage)'
      : tone === 'muted'
      ? 'var(--ink-3)'
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

function CostChip({ cost }: { cost?: string }) {
  const map: Record<string, { label: string; tone: string }> = {
    free: {
      label: 'Free',
      tone: 'bg-[var(--accent-sage-soft)] text-[var(--accent-sage-ink)]',
    },
    sliding_scale: {
      label: 'Sliding fee',
      tone: 'bg-[var(--urgent-yellow-soft)] text-[var(--urgent-yellow-ink)]',
    },
    insurance: {
      label: 'Insurance',
      tone: 'bg-[var(--surface-2)] text-[var(--ink-2)]',
    },
  }
  const entry = cost
    ? map[cost] ?? { label: cost, tone: 'bg-[var(--surface-2)] text-[var(--ink-2)]' }
    : { label: '—', tone: 'bg-transparent text-[var(--ink-3)]' }
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${entry.tone}`}
    >
      {entry.label}
    </span>
  )
}
