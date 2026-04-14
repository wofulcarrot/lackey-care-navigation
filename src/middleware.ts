import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

/**
 * HTTP Basic Auth guard for /dashboard/*.
 * Username: DASHBOARD_USERNAME (default: "lackey")
 * Password: DASHBOARD_PASSWORD (default: "lackey-pilot-2026")
 * Browser prompts natively; credentials are cached by browser for the session.
 */
function basicAuth(request: NextRequest): NextResponse {
  const expectedUsername = process.env.DASHBOARD_USERNAME || 'lackey'
  const expectedPassword = process.env.DASHBOARD_PASSWORD || 'lackey-pilot-2026'

  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ')
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = atob(encoded)
        const sep = decoded.indexOf(':')
        const username = decoded.slice(0, sep)
        const password = decoded.slice(sep + 1)
        if (username === expectedUsername && password === expectedPassword) {
          return NextResponse.next()
        }
      } catch {
        // Fall through to 401
      }
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Lackey Executive Dashboard", charset="UTF-8"',
    },
  })
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Guard the CEO dashboard with Basic Auth
  if (pathname.startsWith('/dashboard')) {
    return basicAuth(request)
  }

  // Everything else goes through next-intl locale routing
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/', '/(en|es)/:path*', '/dashboard/:path*'],
}
