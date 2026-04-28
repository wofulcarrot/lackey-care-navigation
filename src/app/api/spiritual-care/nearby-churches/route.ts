/**
 * POST /api/spiritual-care/nearby-churches
 *
 * Server-side proxy for Foursquare place-of-worship search. Mirrors
 * /api/triage/nearby-urgent-cares — same input validation, rate limit,
 * and fallback behavior — but points at the church category set.
 *
 * Body:
 *   { lat: number, lon: number, radiusMiles?: number (default 10, max 25) }
 *
 * Response:
 *   200 { results: NearbyChurch[] }         on success (possibly empty)
 *   200 { results: [], fallback: true }     if Foursquare is unavailable
 *   400                                     invalid input
 *   429                                     rate-limited
 */

import { NextResponse } from 'next/server'
import { rateLimit, getClientIp, ipKey } from '@/lib/rate-limit'
import { safeLog } from '@/lib/safe-log'
import { searchNearbyChurches } from '@/lib/foursquare'

export const maxDuration = 30

const MAX_RADIUS_MILES = 25
const DEFAULT_RADIUS_MILES = 10
const MAX_RESULTS = 15

// Same US bounds as nearby-urgent-cares — the app serves US patients.
const US_LAT_MIN = 18.0
const US_LAT_MAX = 72.0
const US_LON_MIN = -180.0
const US_LON_MAX = -65.0

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { allowed } = rateLimit(ipKey('fsq-church', ip))
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many location searches. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { lat, lon, radiusMiles } = body as {
      lat?: unknown
      lon?: unknown
      radiusMiles?: unknown
    }

    if (
      typeof lat !== 'number' ||
      typeof lon !== 'number' ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      return NextResponse.json(
        { error: 'lat and lon must be finite numbers' },
        { status: 400 },
      )
    }

    if (lat < US_LAT_MIN || lat > US_LAT_MAX || lon < US_LON_MIN || lon > US_LON_MAX) {
      return NextResponse.json(
        { error: 'Coordinates outside supported region' },
        { status: 400 },
      )
    }

    const requestedRadius =
      typeof radiusMiles === 'number' && Number.isFinite(radiusMiles)
        ? Math.min(Math.max(radiusMiles, 1), MAX_RADIUS_MILES)
        : DEFAULT_RADIUS_MILES

    let results = await searchNearbyChurches(lat, lon, requestedRadius, MAX_RESULTS)

    // Same "widen once before giving up" logic as urgent cares — rural
    // patients at the edge of Hampton Roads should still find something.
    if (results !== null && results.length === 0 && requestedRadius < MAX_RADIUS_MILES) {
      results = await searchNearbyChurches(lat, lon, MAX_RADIUS_MILES, MAX_RESULTS)
    }

    if (results === null) {
      return NextResponse.json({ results: [], fallback: true })
    }

    return NextResponse.json({ results })
  } catch (err) {
    safeLog.error('[nearby-churches] unexpected', err)
    return NextResponse.json({ results: [], fallback: true })
  }
}
