/**
 * Simple in-memory sliding window rate limiter.
 * Suitable for single-instance deployments. For multi-instance,
 * swap to @upstash/ratelimit or a Redis-backed solution.
 */

const windowMs = 60_000 // 1 minute
const maxRequests = 30  // 30 requests per minute per IP

const hits = new Map<string, number[]>()

// Cleanup stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of hits) {
    const valid = timestamps.filter((t) => now - t < windowMs)
    if (valid.length === 0) hits.delete(key)
    else hits.set(key, valid)
  }
}, 300_000)

export function rateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= maxRequests) {
    hits.set(ip, timestamps)
    return { allowed: false, remaining: 0 }
  }

  timestamps.push(now)
  hits.set(ip, timestamps)
  return { allowed: true, remaining: maxRequests - timestamps.length }
}
