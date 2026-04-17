import { describe, it, expect } from 'vitest'
import { CareResources } from './CareResources'

/**
 * Tests for the CareResources afterRead hook that auto-nulls
 * temporaryNotice when temporaryNoticeExpires is in the past.
 */

// Extract the afterRead hook from the collection config
const afterReadHooks = CareResources.hooks?.afterRead ?? []
const expireNoticeHook = afterReadHooks[0] as (args: { doc: Record<string, unknown> }) => Record<string, unknown>

describe('CareResources afterRead hook — temporaryNoticeExpires', () => {
  it('nulls temporaryNotice when temporaryNoticeExpires is in the past', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString()
    const doc = {
      id: '1',
      name: 'Test Clinic',
      temporaryNotice: 'Closed for renovation',
      temporaryNoticeExpires: yesterday,
    }

    const result = expireNoticeHook({ doc })
    expect(result.temporaryNotice).toBeNull()
  })

  it('preserves temporaryNotice when temporaryNoticeExpires is in the future', () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString()
    const doc = {
      id: '1',
      name: 'Test Clinic',
      temporaryNotice: 'Limited hours this week',
      temporaryNoticeExpires: tomorrow,
    }

    const result = expireNoticeHook({ doc })
    expect(result.temporaryNotice).toBe('Limited hours this week')
  })

  it('preserves temporaryNotice when temporaryNoticeExpires is null', () => {
    const doc = {
      id: '1',
      name: 'Test Clinic',
      temporaryNotice: 'Permanent notice',
      temporaryNoticeExpires: null,
    }

    const result = expireNoticeHook({ doc })
    expect(result.temporaryNotice).toBe('Permanent notice')
  })

  it('preserves temporaryNotice when temporaryNoticeExpires is undefined', () => {
    const doc = {
      id: '1',
      name: 'Test Clinic',
      temporaryNotice: 'Permanent notice',
    }

    const result = expireNoticeHook({ doc })
    expect(result.temporaryNotice).toBe('Permanent notice')
  })
})
