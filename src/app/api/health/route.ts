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
        lastErrorMessage: sessionLogging.lastErrorMessage,
      },
      timestamp,
    },
    {
      status: httpStatus,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
