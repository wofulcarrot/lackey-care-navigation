/**
 * Shared types and constants for the Spiritual Care feature. Centralized
 * here so the collection schema, API routes, email notifier, and
 * rotation helper all agree on the request-type vocabulary and locale
 * normalization.
 */

export const SPIRITUAL_REQUEST_TYPES = ['prayer', 'chaplain'] as const
export type SpiritualRequestType = (typeof SPIRITUAL_REQUEST_TYPES)[number]

export type SupportedLocale = 'en' | 'es'

/** Coerce untrusted input into a supported locale. Defaults to English. */
export function normalizeLocale(value: unknown): SupportedLocale {
  return value === 'es' ? 'es' : 'en'
}

/**
 * Discriminated union — prayer payloads require a message; chaplain
 * payloads require a phone. Email on a prayer request is optional
 * (patients may submit anonymously and just want the team to pray for
 * them without a follow-up).
 */
export type NotificationPayload =
  | {
      type: 'prayer'
      email?: string
      name?: string
      message: string
      locale: SupportedLocale
      requestId: string
    }
  | {
      type: 'chaplain'
      phone: string
      name?: string
      message?: string
      locale: SupportedLocale
      requestId: string
      /**
       * Optional recipient override — when the chaplain route has
       * already resolved a caregiver via the rotation, it passes the
       * email through to skip a second DB lookup in the email notifier.
       */
      recipientOverride?: string
    }
