import { describe, it, expect } from 'vitest'
import { getClientIp } from './rate-limit'

/**
 * Tests for getClientIp which extracts the client IP from request headers,
 * preferring Vercel's trusted x-vercel-forwarded-for header.
 */

/** Helper to build a minimal Request with specific headers. */
function makeRequest(headers: Record<string, string>): Request {
  return new Request('http://localhost/', {
    headers: new Headers(headers),
  })
}

describe('getClientIp', () => {
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

  it('falls back to x-forwarded-for when Vercel header is absent', () => {
    const req = makeRequest({
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
    })
    expect(getClientIp(req)).toBe('192.168.1.1')
  })

  it('returns the default fallback when both headers are absent', () => {
    const req = makeRequest({})
    expect(getClientIp(req)).toBe('127.0.0.1')
  })

  it('returns a custom fallback when both headers are absent and fallback is provided', () => {
    const req = makeRequest({})
    expect(getClientIp(req, '0.0.0.0')).toBe('0.0.0.0')
  })
})
