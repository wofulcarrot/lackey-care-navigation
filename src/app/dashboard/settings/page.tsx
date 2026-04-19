import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'

export const dynamic = 'force-dynamic'

/**
 * Settings landing page. Not a custom form — the underlying editor
 * lives in the Payload admin (richer validation, i18n, versioning).
 * This page pulls the current static-content global and shows each
 * field as a quick-glance card with an "Edit in CMS" link.
 *
 * Sections are grouped by concern: patient-facing content, clinical
 * routing, and hosting/security so admins can mental-model which
 * change affects what without clicking through every global.
 */
export default async function SettingsPage() {
  const payload = await getPayload({ config })
  const content = await payload.findGlobal({
    slug: 'static-content',
    locale: 'en',
  })

  const bullets = Array.isArray((content as any).virtualCareBullets)
    ? ((content as any).virtualCareBullets as Array<{ text?: string }>)
        .map((b) => b.text)
        .filter(Boolean)
    : []

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Content, routing rules, and system configuration"
        actions={
          <Link
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 rounded-lg bg-[var(--ink)] text-[var(--surface-0)] text-[13px] font-semibold hover:brightness-110 transition"
          >
            Open CMS admin
          </Link>
        }
      />
      <main className="flex-1 px-6 lg:px-8 py-6 space-y-6">
        <Section title="Patient-facing content" description="Copy + URLs that appear in the patient flow">
          <SettingRow
            label="Virtual care URL"
            value={(content as any).virtualCareUrl ?? '—'}
            href="/admin/globals/static-content"
          />
          <SettingRow
            label="Clinic phone"
            value={(content as any).clinicPhone ?? '—'}
            href="/admin/globals/static-content"
          />
          <SettingRow
            label="Eligibility intake form"
            value={(content as any).eligibilityIntakeUrl ?? '—'}
            href="/admin/globals/static-content"
          />
          <SettingRow
            label="Virtual care bullets"
            value={bullets.length ? `${bullets.length} bullets: ${bullets.slice(0, 2).join(' · ')}${bullets.length > 2 ? '…' : ''}` : '—'}
            href="/admin/globals/static-content"
          />
        </Section>

        <Section title="Triage content" description="Questions, urgency thresholds, and care-type metadata">
          <LinkRow
            label="Emergency symptoms"
            description="The pre-triage safety-check list"
            href="/admin/collections/emergency-symptoms"
          />
          <LinkRow
            label="Question sets"
            description="The adaptive questionnaires per care type"
            href="/admin/collections/question-sets"
          />
          <LinkRow
            label="Urgency levels"
            description="Score thresholds for each urgency tier"
            href="/admin/collections/urgency-levels"
          />
          <LinkRow
            label="Routing rules"
            description="Which resources to recommend per (care type × urgency)"
            href="/admin/collections/routing-rules"
          />
          <LinkRow
            label="Care types"
            description="Top-level categories on the care-type screen"
            href="/admin/collections/care-types"
          />
        </Section>

        <Section title="Directory" description="The clinic list the patient app pulls from">
          <LinkRow
            label="Care resources"
            description="Partner clinics, urgent cares, virtual care"
            href="/admin/collections/care-resources"
          />
        </Section>

        <Section title="Hosting & security" description="Infrastructure knobs — managed via deployment env vars">
          <InfoRow
            label="Hosting"
            value="Vercel (Norfolk preview + production)"
          />
          <InfoRow
            label="Database"
            value="Neon PostgreSQL (pooled)"
          />
          <InfoRow
            label="Dashboard Basic Auth"
            value="Production only · DASHBOARD_USERNAME + DASHBOARD_PASSWORD"
          />
          <InfoRow
            label="Preview protection"
            value="Vercel SSO (Deployment Protection) — team members only"
          />
          <InfoRow
            label="API rate limit"
            value="60 req/min/IP on the triage endpoints"
          />
        </Section>
      </main>
    </>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card title={title} subtitle={description} padded={false}>
      <div className="divide-y divide-[var(--stroke)]">{children}</div>
    </Card>
  )
}

function SettingRow({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href: string
}) {
  return (
    <div className="px-5 py-3 flex items-start justify-between gap-4 hover:bg-[var(--surface-2)]/50 transition">
      <div className="min-w-0">
        <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mb-0.5">
          {label}
        </div>
        <div className="text-[13px] text-[var(--ink)] font-mono truncate">{value}</div>
      </div>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] font-semibold text-[var(--accent-primary)] hover:underline shrink-0 mt-1"
      >
        Edit →
      </Link>
    </div>
  )
}

function LinkRow({
  label,
  description,
  href,
}: {
  label: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="px-5 py-3 flex items-start justify-between gap-4 hover:bg-[var(--surface-2)]/50 transition"
    >
      <div className="min-w-0">
        <div className="text-[14px] text-[var(--ink)] font-semibold">{label}</div>
        <div className="text-[12px] text-[var(--ink-3)] mt-0.5">{description}</div>
      </div>
      <span className="text-[12px] font-semibold text-[var(--accent-primary)] shrink-0 mt-1">
        Open →
      </span>
    </Link>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 flex items-start justify-between gap-4">
      <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] mt-0.5 w-44 shrink-0">
        {label}
      </div>
      <div className="text-[13px] text-[var(--ink-2)] flex-1 text-right">{value}</div>
    </div>
  )
}
