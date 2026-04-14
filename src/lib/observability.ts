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

// Cleanup stale entries every 5 minutes to prevent unbounded growth.
setInterval(() => {
  const now = Date.now()
  while (failureTimestamps.length > 0 && now - failureTimestamps[0] >= windowMs) {
    failureTimestamps.shift()
  }
}, 300_000)

export function recordSessionLogFailure(err: unknown): void {
  const now = Date.now()
  // Purge expired timestamps at write time too (handles sparse failures).
  while (failureTimestamps.length > 0 && now - failureTimestamps[0] >= windowMs) {
    failureTimestamps.shift()
  }
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
  const now = Date.now()
  const failuresLastHour = failureTimestamps.filter((t) => now - t < windowMs).length
  return {
    failuresLastHour,
    totalFailures,
    lastFailureAt,
    lastErrorMessage,
  }
}
