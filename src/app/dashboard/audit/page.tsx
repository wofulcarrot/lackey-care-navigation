import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'

export const dynamic = 'force-dynamic'

/**
 * Audit log — who edited what, when. Design-only for now: we don't
 * have an audit-events collection yet, so the feed is populated from
 * a static sample that shows the shape staff will see once we wire
 * Payload's `afterChange` hooks into an `audit-events` collection.
 *
 * The banner at top makes the "sample data" status explicit — this is
 * so stakeholders can click around the nav and see the vision without
 * being confused about whether any of these events are real.
 */

interface AuditActor {
  name: string
  role: string
  avatar: string
  color: string
}

const ACTORS: AuditActor[] = [
  { name: 'Dr. Maya Ellis', role: 'super',    avatar: 'ME', color: 'oklch(0.68 0.155 35)' },
  { name: 'Julia Park',     role: 'clinical', avatar: 'JP', color: 'oklch(0.55 0.08 155)' },
  { name: 'Marcus Obi',     role: 'resource', avatar: 'MO', color: 'oklch(0.62 0.12 240)' },
  { name: 'Priya Raman',    role: 'analyst',  avatar: 'PR', color: 'oklch(0.70 0.09 295)' },
  { name: 'System',         role: 'system',   avatar: '⚙',  color: 'oklch(0.58 0.015 42)' },
]

interface AuditEvent {
  id: string
  timestamp: Date
  actor: AuditActor
  verb: string
  object: string
  icon: string
  category: 'content' | 'routing' | 'resource' | 'analytics' | 'crisis' | 'user' | 'auth' | 'settings' | 'system'
}

function makeEvents(): AuditEvent[] {
  const now = Date.now()
  // Realistic staff-workflow sample — shows what a typical admin day
  // looks like once auditing is wired up to Payload hooks.
  const templates: Array<Omit<AuditEvent, 'id' | 'timestamp'>> = [
    { actor: ACTORS[1], verb: 'updated',     object: 'Question "med-q1" (EN + ES)',              icon: '✎', category: 'content' },
    { actor: ACTORS[1], verb: 'published',   object: 'Urgency threshold: Urgent → 10',           icon: '▲', category: 'routing' },
    { actor: ACTORS[2], verb: 'added',       object: 'Resource: "Hampton VA Medical Center"',    icon: '＋', category: 'resource' },
    { actor: ACTORS[2], verb: 'deactivated', object: 'Resource: "Dr. Kwan Dental"',              icon: '⏻', category: 'resource' },
    { actor: ACTORS[2], verb: 'edited',      object: 'Resource hours: Sentara UC Wards Corner',  icon: '✎', category: 'resource' },
    { actor: ACTORS[3], verb: 'exported',    object: 'Analytics — Crisis Q1 report',             icon: '↓', category: 'analytics' },
    { actor: ACTORS[0], verb: 'reviewed',    object: 'Crisis session from 10:42 AM',             icon: '✓', category: 'crisis' },
    { actor: ACTORS[1], verb: 'reviewed',    object: 'Crisis session from 09:15 AM',             icon: '✓', category: 'crisis' },
    { actor: ACTORS[0], verb: 'invited',     object: 'T. Beckett (Analyst)',                     icon: '＋', category: 'user' },
    { actor: ACTORS[1], verb: 'logged in',   object: '',                                         icon: '→', category: 'auth' },
    { actor: ACTORS[3], verb: 'logged in',   object: '',                                         icon: '→', category: 'auth' },
    { actor: ACTORS[0], verb: 'rotated',     object: 'API key (Foursquare)',                     icon: '↻', category: 'settings' },
    { actor: ACTORS[4], verb: 'ran',         object: 'Nightly resource geocoding',               icon: '⚙', category: 'system' },
    { actor: ACTORS[4], verb: 'flagged',     object: 'Low completion rate on vis-q1',            icon: '!', category: 'system' },
  ]
  const out: AuditEvent[] = []
  for (let i = 0; i < 40; i++) {
    const t = templates[i % templates.length]
    const minsAgo = i * 35 + (i * 7) % 22
    out.push({
      id: `e_${i}`,
      timestamp: new Date(now - minsAgo * 60_000),
      ...t,
    })
  }
  return out.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export default async function AuditLogPage() {
  const events = makeEvents()

  // Group events by calendar day for the sticky day headers.
  const groups: Array<{ day: string; items: AuditEvent[] }> = []
  let lastKey: string | null = null
  for (const e of events) {
    const key = e.timestamp.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    if (key !== lastKey) {
      groups.push({ day: key, items: [] })
      lastKey = key
    }
    groups[groups.length - 1].items.push(e)
  }

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Who did what, when"
      />
      <main className="flex-1 px-6 lg:px-8 py-6 space-y-6">
        <div className="rounded-2xl border border-dashed border-[var(--stroke-strong)] bg-[var(--urgent-yellow-soft)]/60 p-4 text-[13px] text-[var(--ink-2)]">
          <strong className="text-[var(--ink)]">Sample data.</strong> Audit
          capture isn&apos;t wired up yet — the entries below show the
          shape of the activity feed staff will see once we attach
          Payload&apos;s <code className="font-mono text-[12px] px-1 rounded bg-[var(--surface-2)]">afterChange</code> hooks
          to an <code className="font-mono text-[12px] px-1 rounded bg-[var(--surface-2)]">audit-events</code> collection.
        </div>

        <Card padded={false} title="Activity feed" subtitle={`${events.length} sample events`}>
          <div className="max-h-[70vh] overflow-auto">
            {groups.map((g) => (
              <div key={g.day}>
                <div className="px-5 py-2 bg-[var(--surface-1)] border-b border-[var(--stroke)] text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] sticky top-0 z-10">
                  {g.day}
                </div>
                {g.items.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 px-5 py-3 border-b border-[var(--stroke)] last:border-0 hover:bg-[var(--surface-2)] transition"
                  >
                    <div
                      className="w-8 h-8 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0"
                      style={{ background: e.actor.color }}
                      aria-hidden="true"
                    >
                      {e.actor.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] text-[var(--ink)] leading-snug">
                        <span className="font-semibold">{e.actor.name}</span>{' '}
                        <span className="text-[var(--ink-2)]">{e.verb}</span>
                        {e.object && (
                          <>
                            {' '}
                            <span className="font-medium">{e.object}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11.5px] text-[var(--ink-3)] num">
                          {formatTime(e.timestamp)}
                        </span>
                        <span className="text-[10.5px] text-[var(--ink-3)] uppercase tracking-wider bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
                          {e.category}
                        </span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-md bg-[var(--surface-2)] text-[var(--ink-2)] flex items-center justify-center text-[13px] shrink-0">
                      {e.icon}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </main>
    </>
  )
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}
