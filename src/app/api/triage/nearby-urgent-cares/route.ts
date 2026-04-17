/**
 * Server-side proxy for Foursquare Places API. Keeps the API key hidden
 * from the browser and enforces input validation + rate limiting.
 *
 * POST body:
 *   { lat: number, lon: number, radiusMiles?: number (default 10, max 25) }
 *
 * Response:
 *   200 { resources: NearbyUrgentCare[] }  on success (possibly empty)
 *   200 { resources: [], fallback: true }  if Foursquare is unavailable —
 *                                           caller should use seeded urgent cares
 *   400                                     on invalid input
 *   429                                     on rate limit
 */

import { NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { searchNearbyUrgentCares } from '@/lib/foursquare'

export const maxDuration = 30

const MAX_RADIUS_MILES = 25
const DEFAULT_RADIUS_MILES = 10
const MAX_RESULTS = 15

// Rough bounds for the continental United States. The triage app serves US
// patients, so rejecting wildly out-of-bounds coordinates is a cheap safety
// check.
const US_LAT_MIN = 18.0 // includes Puerto Rico / Hawaii
const US_LAT_MAX = 72.0 // includes Alaska
const US_LON_MIN = -180.0
const US_LON_MAX = -65.0

export async function POST(request: Request) {
  try {
    // Tighter rate limit than /evaluate since this hits a paid external API
    const ip = getClientIp(request)
    const { allowed } = rateLimit(`fsq:${ip}`)
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

    const { lat, lon, radiusMiles } = body as { lat?: unknown; lon?: unknown; radiusMiles?: unknown }

    if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        { error: 'lat and lon must be finite numbers' },
        { status: 400 },
      )
    }

    // Reject obviously bad coordinates (helps catch client bugs and makes
    // abuse harder). The app serves US patients.
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

    // Primary search at requested radius
    let results = await searchNearbyUrgentCares(lat, lon, requestedRadius, MAX_RESULTS)

    // If we got zero AND the user asked for the default 10 mi, widen to 25 mi
    // once before giving up. This handles rural edges near Hampton Roads.
    if (results !== null && results.length === 0 && requestedRadius < MAX_RADIUS_MILES) {
      results = await searchNearbyUrgentCares(lat, lon, MAX_RADIUS_MILES, MAX_RESULTS)
    }

    // Foursquare unreachable or misconfigured → caller falls back to seeds
    if (results === null) {
      return NextResponse.json({ resources: [], fallback: true })
    }

    return NextResponse.json({ resources: results })
  } catch (err) {
    console.error('[nearby-urgent-cares] unexpected:', (err as Error).message)
    return NextResponse.json({ resources: [], fallback: true })
  }
}
