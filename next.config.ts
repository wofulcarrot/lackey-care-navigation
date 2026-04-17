import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const isDev = process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.236'],
  async headers() {
    // In development, use a permissive CSP so HMR, WebSockets, and
    // network-IP access (e.g. phone on same WiFi) all work.
    // In production, lock it down.
    //
    // Production CSP notes:
    // - 'unsafe-eval' is removed in prod — Next.js production client code
    //   does not need it (only dev HMR/Turbopack does).
    // - 'strict-dynamic' combined with 'unsafe-inline' enables Next.js
    //   hydration (`__next_f.push(...)`) in modern browsers that support
    //   strict-dynamic (they ignore 'unsafe-inline' when strict-dynamic is
    //   present), while older browsers fall back to 'unsafe-inline'.
    // - style-src keeps 'unsafe-inline' because Tailwind and Leaflet inject
    //   inline styles at runtime. TODO: move to hashed inline styles.
    // - Future improvement (Option B): implement full nonce-based CSP via
    //   Next.js middleware for maximum hardening. That requires generating a
    //   per-request nonce, injecting it into all inline scripts, and
    //   referencing it in the CSP header. Out of scope for this pilot.
    // - The production CSP is intentionally stricter than dev; dev needs
    //   'unsafe-eval' for HMR and `connect-src *` for WebSocket/network-IP.
    const csp = isDev
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src *",
          "frame-ancestors 'none'",
        ].join('; ')
      : [
          "default-src 'self'",
          // strict-dynamic was removed: it ignores 'self' and 'unsafe-inline'
          // in modern browsers, requiring nonce-based trust that Next.js doesn't
          // set by default. Without nonces, strict-dynamic blocks ALL scripts.
          // Future: implement nonce-based CSP via middleware, then re-add.
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          // connect-src: browser-side fetches. Must include:
          // - 'self' (our own API routes)
          // - luca.zipnosis.com (virtual care partner embed)
          // - *.tile.openstreetmap.org (Leaflet map tiles)
          // - api.zippopotam.us (ZIP -> lat/lon lookup used by lookupZipAnywhere
          //   in src/lib/distance.ts for the "Find closest to me" flow).
          "connect-src 'self' https://luca.zipnosis.com https://*.tile.openstreetmap.org https://api.zippopotam.us",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Content-Security-Policy', value: csp },
          {
            key: 'Permissions-Policy',
            // geolocation=(self) allows same-origin use of the Geolocation API
            // (powers the "Find closest to me" button). An empty () would block
            // ALL origins including self, silently breaking GPS lookup.
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ]
  },
}

export default withPayload(withNextIntl(nextConfig))
