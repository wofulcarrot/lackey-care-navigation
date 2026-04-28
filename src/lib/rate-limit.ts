/**
 * Simple in-memory sliding window rate limiter.
 * Suitable for single-instance deployments. For multi-instance,
 * swap to @upstash/ratelimit or a Redis-backed solution.
 *
 * Keys are IP-derived. Callers should use `ipKey(scope, ip)` so the
 * raw IP is hashed before it ever lands in the in-memory Map (or
 * accidentally in any future log line that includes a key). Hash
 * is salted with PAYLOAD_SECRET so leaked hashes can't be rainbow-
 * tabled back to IPs.
 */
import { createHash } from 'node:crypto'

const windowMs = 60_000 // 1 minute
const maxRequests = 30  // 30 requests per minute per IP

const hits = new Map<string, number[]>()

// Cleanup stale entries every 5 minutes to prevent memory leak
const timer = setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of hits) {
    const valid = timestamps.filter((t) => now - t < windowMs)
    if (valid.length === 0) hits.delete(key)
    else hits.set(key, valid)
  }
  // Hard cap: evict oldest entries to bound memory under bot scans / DDoS.
  // Map iterates in insertion order, so the first keys are the oldest.
  if (hits.size > 10_000) {
    const excess = hits.size - 10_000
    let deleted = 0
    for (const key of hits.keys()) {
      if (deleted >= excess) break
      hits.delete(key)
      deleted++
    }
  }
}, 300_000)
if (typeof timer === 'object' && 'unref' in timer) timer.unref()

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

/**
 * Compose a rate-limit key that does NOT contain the raw client IP.
 *
 * Hashes `<ip>:<salt>` with SHA-256 and truncates to 16 hex chars.
 * The salt is PAYLOAD_SECRET in production (deployment-unique, not in
 * source) and a fixed dev value otherwise. 16 hex chars = 64 bits of
 * collision space — way more than enough for per-IP buckets.
 *
 * Use this everywhere you'd otherwise build keys like `${scope}:${ip}`.
 *
 * Example:
 *   const { allowed } = rateLimit(ipKey('triage-evaluate', ip))
 */
export function ipKey(scope: string, ip: string): string {
  const salt = process.env.PAYLOAD_SECRET || 'dev-only-rate-limit-salt'
  const hash = createHash('sha256').update(`${ip}:${salt}`).digest('hex').slice(0, 16)
  return `${scope}:${hash}`
}

/** Extract the client IP from the request, preferring Vercel's trusted header. */
export function getClientIp(request: Request, fallback = '127.0.0.1'): string {
  // x-vercel-forwarded-for is infra-set on Vercel and cannot be spoofed by
  // clients. In Docker/self-hosted deployments it may be forwarded unchanged,
  // so only trust it when the VERCEL env var is present (Vercel sets this).
  if (process.env.VERCEL) {
    const vercelIp = request.headers.get('x-vercel-forwarded-for')
    if (vercelIp) return vercelIp.split(',')[0].trim()
  }
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || fallback
}
