import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionLogStats } from '@/lib/observability'

/**
 * Unauthenticated health endpoint for uptime monitors and the CEO dashboard.
 *
 * - Cheap DB round-trip (limit:1 find) to confirm Payload + DB connectivity.
 * - Surfaces session-logging failure counters so silent fire-and-forget
 *   breakage on /api/triage/evaluate becomes visible.
 * - Cache-Control: no-store so monitors always get a fresh read.
 */
export async function GET() {
  const sessionLogging = getSessionLogStats()
  const timestamp = new Date().toISOString()

  let database: 'ok' | 'error' = 'ok'

  try {
    const payload = await getPayload({ config })
    await payload.find({ collection: 'care-types', limit: 1 })
  } catch {
    database = 'error'
  }

  const status: 'ok' | 'degraded' = database === 'ok' ? 'ok' : 'degraded'
  const httpStatus = database === 'ok' ? 200 : 503

  // SECURITY: do NOT surface sessionLogging.lastErrorMessage to unauthenticated
  // callers. Raw Postgres / Payload errors can contain table or column names,
  // SQL fragments, or even connection-string segments that leak internal
  // structure. Instead expose a boolean `hasRecentError` derived from whether
  // we recorded a failure in the last hour. Operators with DB access can
  // inspect the actual message server-side via logs / getSessionLogStats().
  const ONE_HOUR_MS = 60 * 60 * 1000
  const hasRecentError = sessionLogging.lastFailureAt
    ? Date.now() - sessionLogging.lastFailureAt.getTime() < ONE_HOUR_MS
    : false

  return NextResponse.json(
    {
      status,
      database,
      sessionLogging: {
        failuresLastHour: sessionLogging.failuresLastHour,
        totalFailures: sessionLogging.totalFailures,
        lastFailureAt: sessionLogging.lastFailureAt
          ? sessionLogging.lastFailureAt.toISOString()
          : null,
        hasRecentError,
      },
      timestamp,
    },
    {
      status: httpStatus,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
