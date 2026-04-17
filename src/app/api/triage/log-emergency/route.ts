import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { recordSessionLogFailure } from '@/lib/observability'

export const maxDuration = 30

/**
 * Log a pre-triage emergency-screen event.
 *
 * The emergency symptom screen (chest pain, stroke signs, etc.) triggers a
 * full-screen 911 alert and historically never touched the API, which meant
 * the CEO dashboard's emergencyCount only reflected seeded data. This endpoint
 * records a minimal TriageSession row so grant-reporting metrics are accurate.
 *
 * Body: { locale?: 'en'|'es', device?: 'mobile'|'tablet'|'desktop' }
 * Response: 204 No Content on success. Write errors are swallowed so patient
 * flow is never blocked.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { allowed } = rateLimit(`emergency:${ip}`)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' } },
      )
    }

    let body: { locale?: unknown; device?: unknown; isCrisis?: unknown; careTypeId?: unknown } = {}
    try {
      body = await request.json()
    } catch {
      // Empty/invalid body is acceptable — we just fall back to defaults.
      body = {}
    }

    const { locale = 'en', device = 'mobile', isCrisis = false, careTypeId } = body
    const validLocales = ['en', 'es'] as const
    const validDevices = ['mobile', 'tablet', 'desktop'] as const
    const safeLocale = validLocales.includes(locale as any) ? (locale as 'en' | 'es') : 'en'
    const safeDevice = validDevices.includes(device as any)
      ? (device as 'mobile' | 'tablet' | 'desktop')
      : 'mobile'
    const safeCrisis = isCrisis === true
    // careTypeId is an optional relationship — validate it's a non-empty string
    const safeCareTypeId = typeof careTypeId === 'string' && careTypeId.length > 0 ? Number(careTypeId) || null : null

    const payload = await getPayload({ config })

    // Await the write — on Vercel Serverless, the runtime freezes after
    // the response is sent, so fire-and-forget writes get lost.
    const sessionId = crypto.randomUUID()
    try {
      await payload.create({
        collection: 'triage-sessions',
        overrideAccess: true,
        data: {
          sessionId,
          careTypeSelected: safeCareTypeId,
          urgencyResult: null,
          resourcesShown: [],
          virtualCareOffered: false,
          emergencyScreenTriggered: true,
          isCrisis: safeCrisis,
          completedFlow: false,
          locale: safeLocale,
          device: safeDevice,
          questionSetVersion: null,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[triage-session] Failed to log emergency screen event:', message)
      recordSessionLogFailure(err)
    }

    return new NextResponse(null, { status: 204 })
  } catch {
    // Never block the patient flow — swallow and return a success response.
    return new NextResponse(null, { status: 204 })
  }
}
