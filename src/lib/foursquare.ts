/**
 * Foursquare Places API client for nearby urgent care search.
 *
 * Auth: FOURSQUARE_API_KEY env var (https://foursquare.com/developers/)
 * Endpoint: Places API v3 — https://location.foursquare.com/developer/reference/places-api-overview
 */

import { METERS_PER_MILE } from '@/lib/constants'
import { safeLog } from '@/lib/safe-log'

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
  /** Distance in meters from the query point */
  distanceMeters?: number
  /** Always active (we don't know hours from FSQ search endpoint alone) */
  isActive: true
  description?: string
}

interface FsqCategory {
  id: number
  name: string
}

interface FsqPlace {
  fsq_place_id: string
  name: string
  tel?: string
  website?: string
  distance?: number
  categories?: FsqCategory[]
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

// Foursquare Places API v3 uses 24-char hex category IDs (not the short
// integer IDs from v2). These were verified against live API responses —
// the short numeric IDs we previously used silently matched nothing,
// which is why every urgent-care search was actually driven by the
// `query=urgent` text filter plus the post-filter below.
const HEALTHCARE_CATEGORIES = [
  '4bf58dd8d48988d177941735', // Doctor's Office
  '4bf58dd8d48988d196941735', // Hospital
  '4bf58dd8d48988d104941735', // Medical Center
  '56aa371be4b08b9a8d573526', // Urgent Care Center
].join(',')
const URGENT_CARE_QUERY = 'urgent'

/**
 * Shared FSQ Places call — both urgent-care and church searches
 * reuse the same auth / timeout / error handling / JSON parsing
 * logic. Returns raw FsqPlace[] (so callers can post-filter as
 * appropriate) or null on unrecoverable error.
 *
 * NOTE: FSQ v3 expects the category filter as `fsq_category_ids` (not
 * the `categories` param that v2 used). We emit the v3 name here.
 */
async function fsqPlacesSearch(opts: {
  lat: number
  lon: number
  radiusMiles: number
  limit: number
  fsqCategoryIds: string
  query?: string
  logTag: string
}): Promise<FsqPlace[] | null> {
  const apiKey = process.env.FOURSQUARE_API_KEY
  if (!apiKey) {
    safeLog.warn(`[foursquare:${opts.logTag}] FOURSQUARE_API_KEY not set; skipping API call`)
    return null
  }

  const cappedMiles = Math.min(Math.max(opts.radiusMiles, 1), 25)
  const radiusMeters = Math.round(cappedMiles * METERS_PER_MILE)

  const params = new URLSearchParams({
    ll: `${opts.lat.toFixed(6)},${opts.lon.toFixed(6)}`,
    radius: String(radiusMeters),
    fsq_category_ids: opts.fsqCategoryIds,
    limit: String(Math.min(Math.max(opts.limit, 1), 50)),
    sort: 'DISTANCE',
  })
  if (opts.query) params.set('query', opts.query)

  let res: Response
  try {
    res = await fetch(`${FSQ_ENDPOINT}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Places-Api-Version': '2025-06-17',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    })
  } catch (err) {
    safeLog.error(`[foursquare:${opts.logTag}] fetch failed`, err)
    return null
  }

  if (!res.ok) {
    safeLog.error(`[foursquare:${opts.logTag}] HTTP ${res.status} ${res.statusText}`)
    return null
  }

  try {
    const data = (await res.json()) as FsqResponse
    return Array.isArray(data.results) ? data.results : []
  } catch (err) {
    safeLog.error(`[foursquare:${opts.logTag}] bad JSON`, err)
    return null
  }
}

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
  const results = await fsqPlacesSearch({
    lat,
    lon,
    radiusMiles,
    limit,
    fsqCategoryIds: HEALTHCARE_CATEGORIES,
    query: URGENT_CARE_QUERY,
    logTag: 'urgent-care',
  })
  if (results === null) return null

  // Additional client-side filter: keep only results whose name suggests
  // actual urgent care / clinic / health / medical. The text query is good
  // but occasionally returns tangentially-named places.
  return results.filter(isLikelyHealthcare).map(normalizeFsqPlace)
}

/**
 * Two-pass filter: REQUIRE at least one healthcare keyword AND reject
 * obvious non-healthcare results.
 *
 * The denylist-only approach (round 3) let through "TruGreen Lawn Care",
 * "M & M Log Home Care", "InMotion Chiropractic" because those names
 * don't match any deny token. A hybrid approach catches these:
 * 1. The name must contain at least one healthcare-positive token, OR
 * 2. The Foursquare result name literally contains "urgent care".
 *
 * We keep the denylist to reject obvious noise even if a positive matches
 * (e.g., "Pizza Clinic" would match "clinic" but also "pizza" → rejected).
 */
function isLikelyHealthcare(p: FsqPlace): boolean {
  const name = (p.name || '').toLowerCase()
  const catNames = (p.categories ?? []).map((c) => c.name.toLowerCase())

  // Category-level rejection — if Foursquare explicitly categorized this
  // as a vet, pet service, etc., reject even if the name sounds medical.
  // Catches "Furgent Care" (Veterinarian category) and similar.
  const deniedCategories = ['veterinarian', 'pet', 'animal']
  if (catNames.some((cn) => deniedCategories.some((dc) => cn.includes(dc)))) return false

  // Name-level denylist — always reject these regardless of positive matches
  const nonHealthcareTokens = [
    'library', 'pizza', 'restaurant', 'cafe', 'coffee',
    'boutique', 'salon', 'spa', 'gym', 'bar', 'theater',
    'mall', 'store', 'parking', 'hotel', 'market',
    'school', 'church', 'park', 'stadium',
    'lawn', 'landscaping', 'roofing', 'plumbing', 'hvac',
    'auto', 'tire', 'car wash', 'pet', 'veterinar',
    'chiropractic', 'chiropractor', 'acupunctur', 'massage',
    'log home', 'home care', 'carpet', 'cleaning',
    'insurance', 'attorney', 'legal', 'real estate',
  ]
  if (nonHealthcareTokens.some((token) => name.includes(token))) return false

  // If Foursquare categorized it as an Urgent Care Center, trust that.
  if (catNames.some((cn) => cn.includes('urgent care'))) return true

  // Otherwise, require at least one healthcare keyword in the name.
  const healthcareTokens = [
    'urgent care', 'urgentcare', 'urgent',
    'clinic', 'medical', 'health center', 'healthcare',
    'walk-in', 'walk in', 'immediate care', 'acute care',
    'patient first', 'medexpress', 'medcare', 'nextcare',
    'concentra', 'fastmed', 'carenow', 'citymd',
    'afc', 'velocity', 'sentara', 'wellnow',
    'minuteclinic', 'physician', 'doctor', 'md ',
    'hospital', 'emergency', 'er express',
    'family medicine', 'internal medicine',
    'pediatric', 'primary care',
  ]
  return healthcareTokens.some((token) => name.includes(token))
}

// ── Church / place-of-worship search ─────────────────────────────────
// Separate from the urgent-care search because the result shape is
// different (no "isActive" / "type: urgent_care"), and the category
// filtering is different — we don't want any clinical keyword
// post-filter.

export interface NearbyChurch {
  id: string
  name: string
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
  /** Distance in meters from the query point */
  distanceMeters?: number
}

// Foursquare v3 category IDs for places of worship. Verified against
// live API. We match the three major place-of-worship categories; the
// patient-facing copy says "church" but the results are broader on
// purpose so a Jewish or Muslim patient also finds their community.
const WORSHIP_CATEGORIES = [
  '4bf58dd8d48988d132941735', // Church
  '4bf58dd8d48988d139941735', // Synagogue
  '4bf58dd8d48988d138941735', // Mosque
].join(',')

/**
 * Name-level sanity check for worship results. FSQ occasionally
 * returns places whose category is "Synagogue" or "Church" but whose
 * name is clearly not a congregation (joke names like "BRAD AND
 * BRYANS HOUSE OF PAIN" miscategorized by users, or business-chain
 * names that contain religious words). Reject obvious false positives.
 */
function isLikelyWorship(p: FsqPlace): boolean {
  const name = (p.name || '').toLowerCase()
  const catNames = (p.categories ?? []).map((c) => c.name.toLowerCase())

  // Must have a worship category — if it slipped past the category
  // filter somehow, reject.
  const worshipCats = ['church', 'synagogue', 'mosque', 'temple', 'spiritual']
  if (!catNames.some((cn) => worshipCats.some((wc) => cn.includes(wc)))) return false

  // Reject names that are clearly not congregations.
  const nonWorshipTokens = [
    'mortgage', 'insurance', 'real estate', 'attorney', 'legal',
    'restaurant', 'cafe', 'coffee', 'pizza', 'bar ', ' bar',
    'gym', 'fitness', 'spa', 'salon', 'boutique',
    'house of pain', 'mma', 'cross fit', 'crossfit',
    'storage', 'car wash', 'auto', 'pet', 'veterinar',
  ]
  if (nonWorshipTokens.some((token) => name.includes(token))) return false

  return true
}

export async function searchNearbyChurches(
  lat: number,
  lon: number,
  radiusMiles: number = 10,
  limit: number = 15,
): Promise<NearbyChurch[] | null> {
  const results = await fsqPlacesSearch({
    lat,
    lon,
    radiusMiles,
    limit,
    fsqCategoryIds: WORSHIP_CATEGORIES,
    logTag: 'churches',
  })
  if (results === null) return null
  return results.filter(isLikelyWorship).map(normalizeFsqChurch)
}

function normalizeFsqChurch(p: FsqPlace): NearbyChurch {
  const loc = p.location || {}
  const website = p.website && p.website.startsWith('http') ? p.website : undefined
  return {
    id: `fsq:${p.fsq_place_id}`,
    name: p.name,
    address: {
      street: loc.address,
      city: loc.locality,
      state: loc.region,
      zip: loc.postcode,
      latitude: typeof p.latitude === 'number' ? p.latitude : undefined,
      longitude: typeof p.longitude === 'number' ? p.longitude : undefined,
    },
    phone: p.tel ? p.tel.replace(/\s+/g, ' ').trim() : undefined,
    website,
    distanceMeters: p.distance,
  }
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
    // cost intentionally omitted — many urgent cares accept self-pay,
    // and we don't know the individual facility's policy from FSQ data.
    distanceMeters: p.distance,
    isActive: true,
    description: 'Walk-in urgent care. Call ahead to confirm self-pay rates.',
  }
}
