import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getClientIp } from './rate-limit'

/**
 * Tests for getClientIp which extracts the client IP from request headers,
 * preferring Vercel's trusted x-vercel-forwarded-for header when on Vercel.
 */

/** Helper to build a minimal Request with specific headers. */
function makeRequest(headers: Record<string, string>): Request {
  return new Request('http://localhost/', {
    headers: new Headers(headers),
  })
}

describe('getClientIp', () => {
  const originalEnv = process.env.VERCEL

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.VERCEL
    else process.env.VERCEL = originalEnv
  })

  describe('on Vercel (process.env.VERCEL set)', () => {
    beforeEach(() => {
      process.env.VERCEL = '1'
    })

    it('prefers x-vercel-forwarded-for when present', () => {
      const req = makeRequest({
        'x-vercel-forwarded-for': '1.2.3.4',
        'x-forwarded-for': '5.6.7.8',
      })
      expect(getClientIp(req)).toBe('1.2.3.4')
    })

    it('takes the first IP from a comma-separated x-vercel-forwarded-for', () => {
      const req = makeRequest({
        'x-vercel-forwarded-for': '10.0.0.1, 10.0.0.2',
      })
      expect(getClientIp(req)).toBe('10.0.0.1')
    })
  })

  describe('outside Vercel (process.env.VERCEL unset)', () => {
    beforeEach(() => {
      delete process.env.VERCEL
    })

    it('ignores x-vercel-forwarded-for to prevent IP spoofing', () => {
      const req = makeRequest({
        'x-vercel-forwarded-for': '1.2.3.4',
        'x-forwarded-for': '5.6.7.8',
      })
      expect(getClientIp(req)).toBe('5.6.7.8')
    })
  })

  it('falls back to x-forwarded-for when Vercel header is absent', () => {
    delete process.env.VERCEL
    const req = makeRequest({
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
    })
    expect(getClientIp(req)).toBe('192.168.1.1')
  })

  it('returns the default fallback when both headers are absent', () => {
    delete process.env.VERCEL
    const req = makeRequest({})
    expect(getClientIp(req)).toBe('127.0.0.1')
  })

  it('returns a custom fallback when both headers are absent and fallback is provided', () => {
    delete process.env.VERCEL
    const req = makeRequest({})
    expect(getClientIp(req, '0.0.0.0')).toBe('0.0.0.0')
  })
})
