/**
 * Foursquare Places API client for nearby urgent care search.
 *
 * Auth: FOURSQUARE_API_KEY env var (https://foursquare.com/developers/)
 * Endpoint: Places API v3 — https://location.foursquare.com/developer/reference/places-api-overview
 */

export interface NearbyUrgentCare {
  /** Foursquare venue ID (prefixed 'fsq:' so it can't collide with CareResource numeric IDs) */
  id: string
  name: string
  type: 'urgent_care'
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    latitude?: number
    longitude?: number
  }
  phone?: string
  website?: string
  cost?: 'insurance_required'
  /** Distance in meters from the query point */
  distanceMeters?: number
  /** Always active (we don't know hours from FSQ search endpoint alone) */
  isActive: true
  description?: string
}

interface FsqPlace {
  fsq_place_id: string
  name: string
  tel?: string
  website?: string
  distance?: number
  location?: {
    address?: string
    locality?: string
    region?: string
    postcode?: string
    formatted_address?: string
  }
  latitude?: number
  longitude?: number
  closed_bucket?: string
}

interface FsqResponse {
  results: FsqPlace[]
}

const FSQ_ENDPOINT = 'https://places-api.foursquare.com/places/search'

// Places API v3 uses a different category taxonomy than v2; its IDs are
// not stable and have broken before. We get much more reliable results with
// a text query. "urgent care" reliably returns urgent care clinics (and
// occasionally a health center or two), and the client can filter further.
const URGENT_CARE_QUERY = 'urgent care'

/**
 * Search Foursquare Places for urgent care facilities near a lat/lng.
 *
 * @param lat Latitude in decimal degrees
 * @param lon Longitude in decimal degrees
 * @param radiusMiles Max radius to search; capped at 25 mi server-side
 * @param limit Max results (Foursquare allows up to 50)
 * @returns Array of normalized urgent cares sorted by distance, or null if the
 *          API call failed (so callers can fall back to seed data).
 */
export async function searchNearbyUrgentCares(
  lat: number,
  lon: number,
  radiusMiles: number = 10,
  limit: number = 15,
): Promise<NearbyUrgentCare[] | null> {
  const apiKey = process.env.FOURSQUARE_API_KEY
  if (!apiKey) {
    console.warn('[foursquare] FOURSQUARE_API_KEY not set; skipping API call')
    return null
  }

  // Cap server-side so the client can't demand huge searches
  const cappedMiles = Math.min(Math.max(radiusMiles, 1), 25)
  const radiusMeters = Math.round(cappedMiles * 1609.34)

  const params = new URLSearchParams({
    ll: `${lat.toFixed(6)},${lon.toFixed(6)}`,
    radius: String(radiusMeters),
    query: URGENT_CARE_QUERY,
    limit: String(Math.min(Math.max(limit, 1), 50)),
    sort: 'DISTANCE',
  })

  let res: Response
  try {
    res = await fetch(`${FSQ_ENDPOINT}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Places-Api-Version': '2025-06-17',
        Accept: 'application/json',
      },
      // Avoid hanging the triage flow if Foursquare is slow
      signal: AbortSignal.timeout(6000),
    })
  } catch (err) {
    console.error('[foursquare] fetch failed:', (err as Error).message)
    return null
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[foursquare] ${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
    return null
  }

  let data: FsqResponse
  try {
    data = await res.json() as FsqResponse
  } catch (err) {
    console.error('[foursquare] bad JSON:', (err as Error).message)
    return null
  }

  if (!data.results || !Array.isArray(data.results)) {
    return []
  }

  // Additional client-side filter: keep only results whose name suggests
  // actual urgent care / clinic / health / medical. The text query is good
  // but occasionally returns tangentially-named places.
  return data.results
    .filter(isLikelyHealthcare)
    .map(normalizeFsqPlace)
}

/**
 * Heuristic: the place's name or chain indicates it's a healthcare provider.
 * Foursquare's 'urgent care' query occasionally returns things like
 * libraries or shopping centers nearby; this filter is the final gate.
 */
function isLikelyHealthcare(p: FsqPlace): boolean {
  const name = (p.name || '').toLowerCase()
  // Positive signals: common urgent care chains + obvious keywords
  const healthcareTokens = [
    'urgent care', 'urgentcare',
    'medexpress', 'medcare', 'medical',
    'patient first', 'afc urgent', 'afc doctor', 'velocity urgent',
    'concentra', 'fastmed', 'nextcare', 'sentara', 'citymd', 'carenow',
    'clinic', 'walk-in', 'walk in', 'health center', 'healthcare',
    'immediate care', 'acute care', 'minuteclinic', 'care now',
    'physician', 'doctor', 'er express',
  ]
  return healthcareTokens.some((token) => name.includes(token))
}

function normalizeFsqPlace(p: FsqPlace): NearbyUrgentCare {
  const lat = typeof p.latitude === 'number' ? p.latitude : undefined
  const lon = typeof p.longitude === 'number' ? p.longitude : undefined

  const loc = p.location || {}
  const phone = p.tel ? p.tel.replace(/\s+/g, ' ').trim() : undefined

  // Foursquare's website field may be 'N/A' or junk; sanity check.
  const website =
    p.website && p.website.startsWith('http') ? p.website : undefined

  return {
    id: `fsq:${p.fsq_place_id}`,
    name: p.name,
    type: 'urgent_care',
    address: {
      street: loc.address,
      city: loc.locality,
      state: loc.region,
      zip: loc.postcode,
      latitude: lat,
      longitude: lon,
    },
    phone,
    website,
    cost: 'insurance_required',
    distanceMeters: p.distance,
    isActive: true,
    description: 'Walk-in urgent care. Call ahead to confirm self-pay rates.',
  }
}
