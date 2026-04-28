import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { safeLog } from './lib/safe-log'

const intlMiddleware = createMiddleware(routing)

/**
 * TEMPORARY PILOT AUTH — HTTP Basic Auth guard for /dashboard/*.
 *
 * !!! UPGRADE BEFORE PRODUCTION SCALE !!!
 * Basic Auth is a stopgap for the Lackey pilot. Before broader rollout,
 * replace this with Payload CMS user session auth (C2 in the security gap
 * tracker). Basic Auth lacks proper session management, password rotation
 * hooks, MFA support, and leaves credentials exposed on every request.
 *
 * Env vars:
 *   DASHBOARD_USERNAME — required in production; dev fallback "lackey"
 *   DASHBOARD_PASSWORD — REQUIRED in production (no fallback); dev-only
 *                        fallback "dev-only-change-me" with a loud warning
 *
 * Security properties of this implementation:
 *   - Uses constant-time comparison (hashed with SHA-256 so inputs of any
 *     length can be compared without leaking length info via timing).
 *   - Fails fast (500) in production if DASHBOARD_PASSWORD is unset, so a
 *     missing env var cannot silently open the dashboard.
 *   - Logs wrong-password attempts with originating IP for abuse visibility.
 *   - Handles malformed Authorization headers (missing colon) safely.
 */
/**
 * Constant-time comparison using Web Crypto API.
 * Middleware runs in Edge Runtime which lacks Node's `crypto` module, so we
 * use crypto.subtle.digest + a manual byte-loop instead of timingSafeEqual.
 * Hashing both inputs to SHA-256 first gives equal-length buffers regardless
 * of input length, preventing timing leaks from mismatched lengths.
 */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const aHash = await crypto.subtle.digest('SHA-256', encoder.encode(a))
  const bHash = await crypto.subtle.digest('SHA-256', encoder.encode(b))
  const aView = new Uint8Array(aHash)
  const bView = new Uint8Array(bHash)
  let diff = 0
  for (let i = 0; i < aView.length; i++) {
    diff |= aView[i] ^ bView[i]
  }
  return diff === 0
}

function unauthorized(): NextResponse {
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Lackey Executive Dashboard", charset="UTF-8"',
    },
  })
}

async function basicAuth(request: NextRequest): Promise<NextResponse> {
  const isProduction = process.env.NODE_ENV === 'production'
  const vercelEnv = process.env.VERCEL_ENV // 'production' | 'preview' | 'development'

  // On Vercel preview deploys, Vercel's own SSO Deployment Protection
  // already gates access to the URL at the CDN edge — only authorized
  // team members on the Vercel project can reach the app at all.
  // Layering Basic Auth on top of SSO just creates a double-prompt with
  // no additional security benefit (and makes sharing the preview with
  // internal reviewers a chore). Skip Basic Auth when VERCEL_ENV=preview.
  if (vercelEnv === 'preview') {
    return NextResponse.next()
  }

  const expectedUsername = process.env.DASHBOARD_USERNAME || (isProduction ? '' : 'lackey')
  const rawExpectedPassword = process.env.DASHBOARD_PASSWORD

  // Fail-fast in production if credentials are not configured. Do NOT fall
  // back to a default — a missing env var must never silently open the door.
  if (isProduction && (!rawExpectedPassword || !expectedUsername)) {
    safeLog.error(
      '[dashboard-auth] FATAL: DASHBOARD_USERNAME or DASHBOARD_PASSWORD is not set in production. Refusing all requests.',
    )
    return new NextResponse('Server configuration error.', { status: 500 })
  }

  let expectedPassword = rawExpectedPassword
  if (!expectedPassword) {
    // Dev-only fallback. Log a warning each request so it cannot slip past
    // unnoticed in a long-running dev session.
    safeLog.warn(
      '[dashboard-auth] DASHBOARD_PASSWORD is not set; using dev-only fallback. DO NOT ship this to any shared environment.',
    )
    expectedPassword = 'dev-only-change-me'
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return unauthorized()
  }

  const [scheme, encoded] = authHeader.split(' ')
  if (scheme !== 'Basic' || !encoded) {
    return unauthorized()
  }

  let decoded: string
  try {
    decoded = atob(encoded)
  } catch {
    return unauthorized()
  }

  const sep = decoded.indexOf(':')
  if (sep === -1) {
    // Malformed Basic header (no colon). Return 401 without attempting
    // comparison — the absent password means safeEqual would compare
    // against an empty string, which is useless signal.
    return unauthorized()
  }

  const username = decoded.slice(0, sep)
  // slice(sep + 1) preserves any ':' characters inside the password, fixing
  // the earlier split-on-first-colon bug.
  const password = decoded.slice(sep + 1)

  // Run both hashes+comparisons in parallel so timing doesn't leak which of
  // (username, password) failed first.
  const [userOk, passOk] = await Promise.all([
    safeEqual(username, expectedUsername),
    safeEqual(password, expectedPassword),
  ])
  if (userOk && passOk) {
    return NextResponse.next()
  }

  // Log failed attempt with best-effort client IP. x-forwarded-for may be a
  // list when behind proxies; take the first entry. Fall back to
  // x-real-ip. We intentionally do not log the submitted username/password.
  const fwd = request.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
  // The IP is passed as a redactable arg (NOT interpolated into the label),
  // so safeLog scrubs it to [ip] before emission. Abuse visibility is
  // preserved (you still see failed attempts + their relative frequency);
  // identification of a specific client requires correlating with Vercel's
  // separate access logs, which is the appropriate audit trail anyway.
  safeLog.warn('[dashboard-auth] 401 failed basic-auth attempt', { ip })

  return unauthorized()
}

/** Simple per-IP login attempt counter. Limits brute-force on /api/users/login. */
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 min
const MAX_LOGIN_ATTEMPTS = 10

function checkLoginRateLimit(request: NextRequest): NextResponse | null {
  const fwd = request.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (entry && now - entry.firstAttempt < LOGIN_WINDOW_MS) {
    if (entry.count >= MAX_LOGIN_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } },
      )
    }
    entry.count++
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now })
  }
  return null // allow
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Guard the CEO dashboard with Basic Auth
  if (pathname.startsWith('/dashboard')) {
    return await basicAuth(request)
  }

  // Rate-limit Payload CMS login to prevent brute-force attacks. The
  // login endpoint is a Payload REST route, NOT a localized page — we
  // must NOT fall through to intlMiddleware afterward, or next-intl
  // will rewrite the path to /en/api/users/login and Payload 404s.
  if (pathname === '/api/users/login') {
    if (request.method === 'POST') {
      const blocked = checkLoginRateLimit(request)
      if (blocked) return blocked
    }
    return NextResponse.next()
  }

  // Everything else goes through next-intl locale routing
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/', '/(en|es)/:path*', '/dashboard/:path*', '/api/users/login'],
}
