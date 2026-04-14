/**
 * Haversine distance in miles between two lat/lng pairs.
 */
export function distanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3958.8 // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Hampton Roads / Norfolk-area ZIP centroids.
 * Covers Norfolk, Chesapeake, Virginia Beach, Portsmouth, Hampton, Newport News,
 * Suffolk, and surrounding areas. Source: USPS / public ZIP centroid data.
 */
const ZIP_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  // Norfolk
  '23502': { lat: 36.8617, lon: -76.2218 },
  '23503': { lat: 36.9332, lon: -76.2548 },
  '23504': { lat: 36.8516, lon: -76.2607 },
  '23505': { lat: 36.9043, lon: -76.2935 },
  '23507': { lat: 36.8612, lon: -76.3052 },
  '23508': { lat: 36.8884, lon: -76.3034 },
  '23509': { lat: 36.8729, lon: -76.2502 },
  '23510': { lat: 36.8528, lon: -76.2885 },
  '23511': { lat: 36.9477, lon: -76.3204 },
  '23513': { lat: 36.9024, lon: -76.2247 },
  '23517': { lat: 36.8782, lon: -76.2932 },
  '23518': { lat: 36.9214, lon: -76.2236 },
  '23523': { lat: 36.8369, lon: -76.2802 },
  // Chesapeake
  '23320': { lat: 36.7682, lon: -76.2543 },
  '23321': { lat: 36.8101, lon: -76.4434 },
  '23322': { lat: 36.6778, lon: -76.2391 },
  '23323': { lat: 36.7645, lon: -76.3724 },
  '23324': { lat: 36.8001, lon: -76.2899 },
  '23325': { lat: 36.7717, lon: -76.2236 },
  // Virginia Beach
  '23451': { lat: 36.8466, lon: -75.9789 },
  '23452': { lat: 36.8390, lon: -76.0732 },
  '23453': { lat: 36.7806, lon: -76.0689 },
  '23454': { lat: 36.7935, lon: -76.0339 },
  '23455': { lat: 36.8807, lon: -76.1466 },
  '23456': { lat: 36.7414, lon: -76.0407 },
  '23457': { lat: 36.6418, lon: -75.9890 },
  '23459': { lat: 36.9269, lon: -76.0150 },
  '23460': { lat: 36.8120, lon: -76.0212 },
  '23461': { lat: 36.8339, lon: -75.9784 },
  '23462': { lat: 36.8392, lon: -76.1571 },
  '23464': { lat: 36.7935, lon: -76.1817 },
  // Portsmouth
  '23701': { lat: 36.8059, lon: -76.3729 },
  '23702': { lat: 36.8284, lon: -76.3279 },
  '23703': { lat: 36.8520, lon: -76.4040 },
  '23704': { lat: 36.8345, lon: -76.3001 },
  '23707': { lat: 36.8190, lon: -76.3473 },
  '23708': { lat: 36.8321, lon: -76.3093 },
  // Hampton
  '23661': { lat: 36.9912, lon: -76.3782 },
  '23663': { lat: 37.0327, lon: -76.3398 },
  '23664': { lat: 37.0635, lon: -76.3075 },
  '23665': { lat: 37.0850, lon: -76.3621 },
  '23666': { lat: 37.0494, lon: -76.4297 },
  '23669': { lat: 37.0248, lon: -76.3382 },
  // Newport News
  '23601': { lat: 37.0635, lon: -76.4707 },
  '23602': { lat: 37.1140, lon: -76.5161 },
  '23603': { lat: 37.1808, lon: -76.5295 },
  '23604': { lat: 37.1339, lon: -76.5908 },
  '23605': { lat: 37.0226, lon: -76.4309 },
  '23606': { lat: 37.0828, lon: -76.4929 },
  '23607': { lat: 37.0193, lon: -76.4126 },
  '23608': { lat: 37.1428, lon: -76.5328 },
  // Suffolk
  '23432': { lat: 36.8390, lon: -76.5895 },
  '23433': { lat: 36.9301, lon: -76.5253 },
  '23434': { lat: 36.7385, lon: -76.6063 },
  '23435': { lat: 36.8761, lon: -76.4671 },
  '23436': { lat: 36.7960, lon: -76.4928 },
  '23437': { lat: 36.6298, lon: -76.7273 },
  '23438': { lat: 36.6094, lon: -76.5967 },
}

export function lookupZip(zip: string): { lat: number; lon: number } | null {
  const cleaned = zip.trim().slice(0, 5)
  return ZIP_CENTROIDS[cleaned] ?? null
}

/**
 * Format a distance in miles for display.
 * < 0.1 mi → "<0.1 mi", < 10 mi → "X.X mi", else → "XX mi"
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) return '<0.1 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}
