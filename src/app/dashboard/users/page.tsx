import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'

export const dynamic = 'force-dynamic'

/**
 * Staff user directory. Reads from Payload's built-in users collection
 * so the list stays in sync with who actually has CMS access. Create /
 * edit links route to the Payload admin — Payload already owns auth,
 * password management, roles, and invite emails.
 */
export default async function UsersPage() {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'users',
    limit: 100,
    sort: 'email',
    overrideAccess: true,
  })

  type UserRow = {
    id: string | number
    email?: string
    role?: string
    createdAt?: string
    updatedAt?: string
  }
  const rows = res.docs as UserRow[]

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${rows.length} staff ${rows.length === 1 ? 'account' : 'accounts'} with CMS access`}
        actions={
          <Link
            href="/admin/collections/users"
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
            Invite user
          </Link>
        }
      />
      <main className="flex-1 px-6 lg:px-8 py-6 space-y-6">
        <Card padded={false}>
          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center text-[14px] text-[var(--ink-3)]">
              No staff users yet.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-[13px]">
                <thead className="text-[var(--ink-3)] text-[11px] uppercase tracking-wider">
                  <tr className="border-b border-[var(--stroke)]">
                    <th className="text-left px-5 py-2.5 font-semibold">User</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Role</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Created</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Last updated</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--stroke)] last:border-0 hover:bg-[var(--surface-2)] transition"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0"
                            style={{ background: avatarColorFor(u.email ?? '') }}
                            aria-hidden="true"
                          >
                            {initialsFor(u.email ?? '')}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[var(--ink)] font-medium truncate">
                              {u.email ?? '(no email)'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-3)] num">
                        {u.createdAt ? formatDate(u.createdAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-3)] num">
                        {u.updatedAt ? formatDate(u.updatedAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/collections/users/${u.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-semibold text-[var(--accent-primary)] hover:underline"
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="rounded-2xl border border-dashed border-[var(--stroke-strong)] bg-[var(--surface-2)]/40 p-4 text-xs text-[var(--ink-2)]">
          <strong className="text-[var(--ink)]">Role scopes:</strong> Admin
          can edit every collection. Editor can edit care resources, emergency
          symptoms, and routing rules but cannot manage users. Invites are
          sent by email via the Payload admin.
        </div>
      </main>
    </>
  )
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) return <span className="text-[var(--ink-3)] text-[12px]">—</span>
  const tone =
    role === 'admin'
      ? 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary-ink)]'
      : 'bg-[var(--accent-sage-soft)] text-[var(--accent-sage-ink)]'
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${tone}`}
    >
      {role}
    </span>
  )
}

function initialsFor(email: string): string {
  const local = email.split('@')[0] ?? email
  const parts = local.split(/[._-]/).filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
  return letters || email.slice(0, 2).toUpperCase() || '?'
}

// Deterministic color-from-email so the same user always gets the
// same avatar color across page loads — avoids pointless jitter.
function avatarColorFor(email: string): string {
  const palette = [
    'oklch(0.68 0.155 35)',  // coral
    'oklch(0.55 0.08 155)',  // sage
    'oklch(0.62 0.12 240)',  // blue
    'oklch(0.70 0.09 295)',  // lavender
    'oklch(0.64 0.18 45)',   // orange
  ]
  let h = 0
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
