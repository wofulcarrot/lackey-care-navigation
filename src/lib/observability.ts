/**
 * Lightweight in-memory observability counter for session-logging failures.
 *
 * Tracks fire-and-forget DB write failures so the /api/health endpoint can
 * surface silent logging breakage (CEO dashboard / grant-reporting integrity).
 *
 * Single-instance only. For multi-instance deployments, swap to a shared store.
 * Mirrors the sliding-window approach used in rate-limit.ts — no external deps.
 */

const windowMs = 60 * 60 * 1000 // 1 hour sliding window

// Sliding window of failure timestamps within the last hour.
const failureTimestamps: number[] = []

// Lifetime counters / last-failure metadata.
let totalFailures = 0
let lastFailureAt: Date | null = null
let lastErrorMessage: string | null = null

/** Purge expired timestamps in O(n) — find the cutoff index then splice once. */
function purgeExpired(): void {
  const cutoff = Date.now() - windowMs
  let i = 0
  while (i < failureTimestamps.length && failureTimestamps[i] < cutoff) i++
  if (i > 0) failureTimestamps.splice(0, i)
}

// Cleanup stale entries every 5 minutes to prevent unbounded growth.
setInterval(purgeExpired, 300_000)

export function recordSessionLogFailure(err: unknown): void {
  // Purge expired timestamps at write time too (handles sparse failures).
  purgeExpired()
  const now = Date.now()
  failureTimestamps.push(now)
  totalFailures += 1
  lastFailureAt = new Date(now)
  lastErrorMessage =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'Unknown error'
}

export interface SessionLogStats {
  failuresLastHour: number
  totalFailures: number
  lastFailureAt: Date | null
  lastErrorMessage: string | null
}

export function getSessionLogStats(): SessionLogStats {
  purgeExpired()
  return {
    failuresLastHour: failureTimestamps.length,
    totalFailures,
    lastFailureAt,
    lastErrorMessage,
  }
}
