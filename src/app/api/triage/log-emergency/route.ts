import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimit, getClientIp, ipKey } from '@/lib/rate-limit'
import { safeLocale, safeDevice, logSession } from '@/lib/triage-session'

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
    const { allowed } = rateLimit(ipKey('emergency', ip))
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' } },
      )
    }

    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // Empty/invalid body is acceptable — we just fall back to defaults.
    }

    const { careTypeId } = body
    const safeCareTypeId =
      typeof careTypeId === 'string' && careTypeId.length > 0
        ? Number(careTypeId) || null
        : null

    const payload = await getPayload({ config })

    await logSession(payload, {
      careTypeSelected: safeCareTypeId,
      urgencyResult: null,
      resourcesShown: [],
      virtualCareOffered: false,
      emergencyScreenTriggered: true,
      isCrisis: body.isCrisis === true,
      completedFlow: false,
      locale: safeLocale(body.locale),
      device: safeDevice(body.device),
      questionSetVersion: null,
    }, 'emergency screen event')

    return new NextResponse(null, { status: 204 })
  } catch {
    // Never block the patient flow — swallow and return a success response.
    return new NextResponse(null, { status: 204 })
  }
}
