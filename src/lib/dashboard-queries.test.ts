import { describe, it, expect } from 'vitest'

/**
 * Unit tests for dashboard-queries logic.
 *
 * The real getDashboardData function requires a live Payload instance,
 * so we extract and test the pure computational logic inline:
 * - abandonedCount formula
 * - isBhCrisis helper
 */

// ─── abandonedCount formula ──────────────────────────────────────────
// Mirrors the formula in getDashboardData:
//   abandonedCount = max(0, totalSessions - completedCount - allEmergencyCount)
// where completedCount only counts sessions with completedFlow && !emergencyScreenTriggered.

function computeAbandoned(
  sessions: Array<{ completedFlow?: boolean | null; emergencyScreenTriggered?: boolean | null }>,
) {
  let completedCount = 0
  let allEmergencyCount = 0

  for (const d of sessions) {
    if (d.completedFlow && !d.emergencyScreenTriggered) completedCount++
    if (d.emergencyScreenTriggered) allEmergencyCount++
  }

  return {
    completedCount,
    allEmergencyCount,
    abandonedCount: Math.max(0, sessions.length - completedCount - allEmergencyCount),
  }
}

describe('abandonedCount formula', () => {
  it('produces zero for all metrics when there are no sessions', () => {
    const result = computeAbandoned([])
    expect(result.completedCount).toBe(0)
    expect(result.allEmergencyCount).toBe(0)
    expect(result.abandonedCount).toBe(0)
  })

  it('abandonedCount >= 0 when completedFlow and emergencyScreenTriggered overlap', () => {
    // A session that has BOTH completedFlow and emergencyScreenTriggered was
    // historically double-counted and could make abandoned negative. The fix
    // counts it only in allEmergencyCount, not completedCount.
    const sessions = [
      { completedFlow: true, emergencyScreenTriggered: true },
    ]
    const result = computeAbandoned(sessions)
    expect(result.abandonedCount).toBeGreaterThanOrEqual(0)
    // Specifically: total=1, completed=0 (excluded by !emergency), emergency=1 → abandoned=0
    expect(result.abandonedCount).toBe(0)
  })

  it('excludes emergency sessions from completedCount to avoid double-counting', () => {
    const sessions = [
      { completedFlow: true, emergencyScreenTriggered: false },  // completed
      { completedFlow: true, emergencyScreenTriggered: true },   // emergency (not completed)
      { completedFlow: false, emergencyScreenTriggered: false },  // abandoned
    ]
    const result = computeAbandoned(sessions)
    expect(result.completedCount).toBe(1)
    expect(result.allEmergencyCount).toBe(1)
    expect(result.abandonedCount).toBe(1)
  })

  it('counts all sessions as abandoned when none completed and none emergency', () => {
    const sessions = [
      { completedFlow: false, emergencyScreenTriggered: false },
      { completedFlow: null, emergencyScreenTriggered: null },
    ]
    const result = computeAbandoned(sessions)
    expect(result.abandonedCount).toBe(2)
  })
})

// ─── isBhCrisis helper ──────────────────────────────────────────────
// Mirrors the isBhCrisis closure in getDashboardData:
//   1. If d.isCrisis === true → true (new boolean field)
//   2. Else if careTypeSelected is a populated object with name matching
//      'Behavioral Health' or 'Salud mental' → true (legacy fallback)
//   3. Else → false

function isBhCrisis(d: {
  isCrisis?: boolean
  careTypeSelected?: { name?: string } | string | number | null
}): boolean {
  if (d.isCrisis === true) return true
  const ct = d.careTypeSelected
  if (!ct || typeof ct !== 'object' || !('name' in ct)) return false
  const name = (ct as { name?: string }).name ?? ''
  return name === 'Behavioral Health' || name === 'Salud mental'
}

describe('isBhCrisis', () => {
  it('returns true when session has isCrisis: true', () => {
    expect(isBhCrisis({ isCrisis: true, careTypeSelected: null })).toBe(true)
  })

  it('returns true when careTypeSelected name matches "Behavioral Health" (legacy)', () => {
    expect(
      isBhCrisis({ careTypeSelected: { name: 'Behavioral Health' } }),
    ).toBe(true)
  })

  it('returns true when careTypeSelected name matches "Salud mental" (Spanish legacy)', () => {
    expect(
      isBhCrisis({ careTypeSelected: { name: 'Salud mental' } }),
    ).toBe(true)
  })

  it('returns false when careTypeSelected is null', () => {
    expect(isBhCrisis({ careTypeSelected: null })).toBe(false)
  })

  it('returns false when careTypeSelected is a non-BH name and isCrisis is false', () => {
    expect(
      isBhCrisis({ isCrisis: false, careTypeSelected: { name: 'Dental' } }),
    ).toBe(false)
  })

  it('returns false when careTypeSelected is a non-BH name and isCrisis is undefined', () => {
    expect(
      isBhCrisis({ careTypeSelected: { name: 'Primary Care' } }),
    ).toBe(false)
  })

  it('returns false when careTypeSelected is an unpopulated ID (string)', () => {
    expect(isBhCrisis({ careTypeSelected: 'some-id-string' })).toBe(false)
  })

  it('returns false when careTypeSelected is an unpopulated ID (number)', () => {
    expect(isBhCrisis({ careTypeSelected: 42 })).toBe(false)
  })
})
