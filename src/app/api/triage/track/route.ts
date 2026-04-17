/**
 * Lightweight event tracking endpoint for the comprehensive funnel system.
 *
 * POST body: { sessionId, event, metadata?, locale?, device? }
 *   — or an array of events for batched sends.
 *
 * Design: fire-and-forget from the client via sendBeacon. Never blocks
 * patient flow. Rate-limited to 60/min/IP (higher than triage/evaluate
 * because a single flow may generate 10-15 events).
 */

import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimit } from '@/lib/rate-limit'
import { recordSessionLogFailure } from '@/lib/observability'

export const maxDuration = 30

const VALID_EVENTS = new Set([
  'landing_view', 'get_care_click',
  'emergency_screen_view', 'emergency_none', 'emergency_symptom',
  'care_type_selected', 'triage_question', 'triage_completed',
  'results_view', 'location_shared', 'location_skipped',
  'resource_call', 'resource_directions', 'resource_website',
  'virtual_care_click', 'virtual_care_skip', 'eligibility_click',
  'crisis_screen_view', 'crisis_988_tap',
  'start_over', 'language_toggle',
])

const VALID_LOCALES = new Set(['en', 'es'])
const VALID_DEVICES = new Set(['mobile', 'tablet', 'desktop'])

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'
    const { allowed } = rateLimit(`track:${ip}`)
    if (!allowed) {
      return new NextResponse(null, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    if (!body) return new NextResponse(null, { status: 400 })

    // Accept a single event or an array (batched)
    const events = Array.isArray(body) ? body : [body]

    // Cap batch size to prevent abuse
    if (events.length > 25) {
      return new NextResponse(null, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Await all writes before responding. On Vercel Serverless, the runtime
    // freezes after the response is sent — fire-and-forget writes get lost.
    // Using Promise.allSettled so one failed write doesn't block the rest.
    const writes = events
      .filter((evt: any) => evt.sessionId && evt.event && VALID_EVENTS.has(evt.event))
      .map((evt: any) =>
        (payload.create as any)({
          collection: 'triage-events',
          overrideAccess: true,
          data: {
            sessionId: String(evt.sessionId).slice(0, 64),
            event: evt.event,
            metadata: evt.metadata ?? null,
            locale: VALID_LOCALES.has(evt.locale) ? evt.locale : null,
            device: VALID_DEVICES.has(evt.device) ? evt.device : null,
          },
        }).catch((err: any) => {
          recordSessionLogFailure(err)
        }),
      )

    await Promise.allSettled(writes)
    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 204 }) // never fail visibly
  }
}
