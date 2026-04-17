/**
 * Fire-and-forget emergency/crisis session logger for client components.
 *
 * Uses sendBeacon where available (survives page navigation), falls back to
 * fetch with keepalive. Never throws — patient flow must never be blocked.
 */
export function logEmergencyBeacon(data: Record<string, unknown>): void {
  try {
    const width = typeof window !== 'undefined' ? window.innerWidth : 0
    const device = width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
    const body = JSON.stringify({ ...data, device })

    const sent =
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon(
        '/api/triage/log-emergency',
        new Blob([body], { type: 'application/json' }),
      )

    if (!sent) {
      void fetch('/api/triage/log-emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Swallow — never block the patient flow.
  }
}
