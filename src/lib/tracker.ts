'use client'

/**
 * Client-side funnel tracker. Fire-and-forget event logging via sendBeacon.
 *
 * Usage in any client component:
 *   import { track } from '@/lib/tracker'
 *   track('care_type_selected', { careType: 'Medical' })
 *
 * Events are batched and flushed every 2 seconds or on page unload.
 * The sessionId is a UUID generated once per browser session (persists
 * via sessionStorage so it survives page navigations within the flow).
 *
 * Zero PII: no names, emails, IPs, or coordinates are sent. The sessionId
 * is random and cannot be linked back to a person.
 */

type EventName =
  | 'landing_view' | 'get_care_click'
  | 'emergency_screen_view' | 'emergency_none' | 'emergency_symptom'
  | 'care_type_selected' | 'triage_question' | 'triage_completed'
  | 'results_view' | 'location_shared' | 'location_skipped'
  | 'resource_call' | 'resource_directions' | 'resource_website'
  | 'virtual_care_click' | 'virtual_care_skip' | 'eligibility_click'
  | 'crisis_screen_view' | 'crisis_988_tap'
  | 'start_over' | 'language_toggle'

interface TrackEvent {
  sessionId: string
  event: EventName
  metadata?: Record<string, unknown>
  locale?: string
  device?: string
}

const TRACK_ENDPOINT = '/api/triage/track'
const FLUSH_INTERVAL_MS = 2000
const SESSION_KEY = 'triageTrackingSessionId'

let queue: TrackEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function getDevice(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'
}

function getLocale(): string {
  if (typeof window === 'undefined') return 'en'
  const path = window.location.pathname
  if (path.startsWith('/es')) return 'es'
  return 'en'
}

function flush() {
  if (queue.length === 0) return
  const batch = queue.splice(0)
  try {
    const payload = JSON.stringify(batch)
    // sendBeacon survives page navigations (unlike fetch which may be cancelled)
    const sent = typeof navigator !== 'undefined' && navigator.sendBeacon
      ? navigator.sendBeacon(TRACK_ENDPOINT, new Blob([payload], { type: 'application/json' }))
      : false
    if (!sent) {
      // Fallback to fetch with keepalive
      fetch(TRACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Never fail — tracking is best-effort
  }
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, FLUSH_INTERVAL_MS)
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flush)
  // Also flush on visibility change (mobile browsers don't always fire beforeunload)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

/**
 * Track a funnel event. Fire-and-forget — never throws, never blocks.
 *
 * @param event  The event name (must match the TriageEvents collection enum)
 * @param metadata  Optional step-specific data (careType, resourceName, etc.)
 */
export function track(event: EventName, metadata?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return // SSR guard

  queue.push({
    sessionId: getSessionId(),
    event,
    metadata,
    locale: getLocale(),
    device: getDevice(),
  })
  scheduleFlush()
}
