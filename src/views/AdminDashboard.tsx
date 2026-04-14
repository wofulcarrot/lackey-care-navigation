import type { AdminViewServerProps } from 'payload'
import Link from 'next/link'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Custom admin home view for the Lackey Care Navigation CMS.
 * Replaces Payload's default dashboard with quick stats, recent activity,
 * and task-oriented shortcuts for clinic staff.
 */
export async function AdminDashboard({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const payload = await getPayload({ config })

  // Gather lightweight stats (counts only)
  const [
    careResourcesCount,
    activeResourcesCount,
    careTypesCount,
    questionsCount,
    recentSessions,
    sessionsLast7d,
    emergencyLast7d,
  ] = await Promise.all([
    payload.count({ collection: 'care-resources' }),
    payload.count({ collection: 'care-resources', where: { isActive: { equals: true } } }),
    payload.count({ collection: 'care-types' }),
    payload.count({ collection: 'questions' }),
    payload.find({ collection: 'triage-sessions', limit: 5, sort: '-createdAt', depth: 1 }),
    payload.count({
      collection: 'triage-sessions',
      where: { createdAt: { greater_than: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() } },
    }),
    payload.count({
      collection: 'triage-sessions',
      where: {
        and: [
          { createdAt: { greater_than: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() } },
          { emergencyScreenTriggered: { equals: true } },
        ],
      },
    }),
  ])

  const cardStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 20,
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    transition: 'transform 0.12s, box-shadow 0.12s',
  }
  const statCardStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  }

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user ?? undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <div style={{ padding: '24px 0' }}>
          {/* Welcome header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#1B4F72' }}>
              Lackey Care Navigation
            </h1>
            <p style={{ color: '#6b7280', marginTop: 6, fontSize: 15 }}>
              Welcome back{initPageResult.req.user?.email ? `, ${initPageResult.req.user.email}` : ''}. Here's what's happening with your care navigation tool.
            </p>
          </div>

          {/* Stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Sessions — last 7 days</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1B4F72' }}>{sessionsLast7d.totalDocs.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>patients triaged this week</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Emergency redirects</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: emergencyLast7d.totalDocs > 0 ? '#b91c1c' : '#16a34a' }}>
                {emergencyLast7d.totalDocs.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>sent to ER or 911 (7 days)</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Active care resources</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1B4F72' }}>
                {activeResourcesCount.totalDocs.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                of {careResourcesCount.totalDocs} total — {careResourcesCount.totalDocs - activeResourcesCount.totalDocs} inactive
              </div>
            </div>
            <div style={statCardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Triage content</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1B4F72' }}>
                {careTypesCount.totalDocs}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                care types · {questionsCount.totalDocs} questions
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
            <Link href="/admin/collections/care-resources" style={cardStyle}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🏥</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Manage Care Resources</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Add or edit clinics, hospitals, urgent cares, and crisis lines</div>
            </Link>
            <Link href="/admin/collections/questions" style={cardStyle}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>❓</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Edit Triage Questions</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Adjust questions, answers, and urgency weights</div>
            </Link>
            <Link href="/admin/collections/routing-rules" style={cardStyle}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔀</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Routing Rules</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Map care type + urgency → which resources patients see</div>
            </Link>
            <Link href="/admin/globals/static-content" style={cardStyle}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📝</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Site Content</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Update hero copy, phone numbers, and disclaimers</div>
            </Link>
            <Link href="/admin/analytics" style={cardStyle}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Triage Analytics</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Session history, completion rates, CSV export</div>
            </Link>
            <Link href="/dashboard" style={cardStyle} target="_blank" rel="noopener">
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Executive Dashboard ↗</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>CEO view — pacing, partner referrals, CSV export</div>
            </Link>
          </div>

          {/* Recent sessions */}
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>Recent Triage Sessions</h2>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            {recentSessions.docs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                No triage sessions yet. They'll appear here as patients use the app.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>Date</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>Care Type</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>Urgency</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>Completed</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>Language</th>
                    <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.docs.map((s: Record<string, unknown>) => {
                    const ct = s.careTypeSelected as { name?: string } | string | undefined
                    const ul = s.urgencyResult as { name?: string } | string | undefined
                    return (
                      <tr key={String(s.id)} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 12 }}>
                          {new Date(s.createdAt as string).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: 12 }}>
                          {typeof ct === 'object' && ct?.name ? ct.name : '—'}
                        </td>
                        <td style={{ padding: 12 }}>
                          {typeof ul === 'object' && ul?.name ? ul.name : '—'}
                        </td>
                        <td style={{ padding: 12 }}>
                          {s.completedFlow ? '✓' : '—'}
                        </td>
                        <td style={{ padding: 12 }}>
                          {String(s.locale ?? '').toUpperCase() || '—'}
                        </td>
                        <td style={{ padding: 12 }}>
                          {String(s.device ?? '—')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Link href="/admin/collections/triage-sessions" style={{ fontSize: 13, color: '#1B4F72', textDecoration: 'none', fontWeight: 500 }}>
              View all sessions →
            </Link>
          </div>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

export default AdminDashboard
