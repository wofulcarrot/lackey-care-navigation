/**
 * Centralized logger with PHI / PII redaction.
 *
 * Vercel's runtime logs are NOT HIPAA-grade — retention and access
 * are managed by Vercel on their (non-BAA) infrastructure. Even in
 * an app that deliberately doesn't store PHI (see docs/adversarial-
 * review.md), an error can still leak identifiers into logs:
 *
 *   console.error('[spiritual] failed:', err.message)
 *     // err.message might be "duplicate email: mary@example.com"
 *
 *   console.warn(`[dashboard-auth] failed ip=${ip}`)
 *     // raw IP in log line
 *
 * safeLog wraps console.{error,warn,info} and runs a regex pass
 * over the variadic args before emission. Email, phone, IPv4,
 * IPv6, and long digit runs get replaced with neutral tokens.
 *
 * Convention (enforced by code review until ESLint is wired up):
 *
 *   ❌ DO NOT use console.error / console.warn / console.info directly
 *      in src/app/api/, src/lib/, src/middleware.ts
 *
 *   ✅ DO use safeLog.error / safeLog.warn / safeLog.info
 *
 *   ✅ DO still use console.log in src/seed/ scripts (dev-only tools,
 *      not production runtime — they don't ship)
 *
 * The redactor is intentionally aggressive (false positives preferred
 * over false negatives). If a log line looks garbled, that's a signal
 * to restructure the message to not interpolate user-derived strings.
 */

// Regexes are tuned for the shapes that appear in real error messages
// and error.message strings. They are NOT a substitute for not
// interpolating PHI in the first place — defense in depth only.
const EMAIL_RE = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g
const PHONE_RE = /\(?\b\d{3}\)?[\s.\-–]?\d{3}[\s.\-–]?\d{4}\b/g
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
// IPv6 — matches full + compressed forms. Conservative; will false-
// positive on any colon-separated hex, which is fine for our uses.
const IPV6_RE = /\b(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{0,4}\b/gi
// Long digit runs (≥10) catch SSNs, phone numbers without
// punctuation, and account-ish numbers. Short enough to miss port
// numbers and error codes.
const LONG_DIGITS_RE = /\b\d{10,}\b/g

/**
 * Strip likely PHI / PII from a single value. Used internally by
 * safeLog.{error,warn,info} but exported so callers can pre-redact
 * structured values if they prefer.
 */
export function redact(input: unknown): string {
  if (input == null) return ''
  let str: string
  if (input instanceof Error) {
    str = input.message
  } else if (typeof input === 'string') {
    str = input
  } else if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input)
  } else {
    // Objects / arrays: JSON-stringify then scrub. Defensive against
    // accidentally logging Payload row objects or Request bodies.
    try {
      str = JSON.stringify(input)
    } catch {
      return '[unserializable]'
    }
  }
  return str
    .replace(EMAIL_RE, '[email]')
    .replace(PHONE_RE, '[phone]')
    .replace(IPV4_RE, '[ip]')
    .replace(IPV6_RE, '[ip]')
    .replace(LONG_DIGITS_RE, '[num]')
}

/**
 * The `label` is NOT redacted — use a constant string (tag), never
 * a dynamic one. The rest of the args are redacted before emission.
 *
 * Example:
 *   safeLog.error('[triage] evaluate failed', err)
 *   safeLog.warn('[auth] failed attempt', { ip, userAgent })
 */
export const safeLog = {
  error(label: string, ...args: unknown[]): void {
    console.error(label, ...args.map(redact))
  },
  warn(label: string, ...args: unknown[]): void {
    console.warn(label, ...args.map(redact))
  },
  info(label: string, ...args: unknown[]): void {
    console.info(label, ...args.map(redact))
  },
}
