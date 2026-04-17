import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { calculateScore, classifyUrgency, checkEscalation } from '@/lib/triage-engine'
import { rateLimit } from '@/lib/rate-limit'
import { recordSessionLogFailure } from '@/lib/observability'

// Allow up to 30s for cold-start (Neon wake + Payload init)
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'
    const { allowed } = rateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' } },
      )
    }

    const body = await request.json()
    const { careTypeId, answers, locale = 'en', device = 'mobile' } = body

    const validLocales = ['en', 'es'] as const
    const validDevices = ['mobile', 'tablet', 'desktop'] as const
    const safeLocale: 'en' | 'es' = validLocales.includes(locale as any) ? (locale as 'en' | 'es') : 'en'
    const safeDevice: 'mobile' | 'tablet' | 'desktop' = validDevices.includes(device as any) ? (device as 'mobile' | 'tablet' | 'desktop') : 'mobile'

    if (!careTypeId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'careTypeId and answers[] are required' },
        { status: 400 },
      )
    }

    const validAnswers = answers.every(
      (a: unknown) =>
        typeof a === 'object' && a !== null &&
        typeof (a as Record<string, unknown>).urgencyWeight === 'number',
    )
    if (!validAnswers) {
      return NextResponse.json(
        { error: 'Each answer must include a numeric urgencyWeight' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    // Check for immediate escalation
    if (checkEscalation(answers)) {
      // Await session log — Vercel freezes the runtime after response, so
      // fire-and-forget writes get lost on serverless.
      const sessionId = crypto.randomUUID()
      try {
        await payload.create({
          collection: 'triage-sessions',
          overrideAccess: true,
          data: {
            sessionId,
            careTypeSelected: Number(careTypeId),
            urgencyResult: null,
            resourcesShown: [],
            virtualCareOffered: false,
            emergencyScreenTriggered: false,
            completedFlow: true,
            locale: safeLocale,
            device: safeDevice,
            questionSetVersion: body.questionSetVersion ?? null,
          },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[triage-session] Failed to log escalation session:', message)
        recordSessionLogFailure(err)
      }

      return NextResponse.json({
        escalate: true,
        urgencyLevel: null,
        resources: [],
        actionText: 'Call 911',
      })
    }

    // Calculate score and classify urgency
    const score = calculateScore(answers)
    const urgencyLevelsResult = await payload.find({
      collection: 'urgency-levels',
      sort: '-scoreThreshold',
      limit: 100,
      locale: safeLocale,
    })
    const urgencyLevelsForClient = urgencyLevelsResult.docs.map((d) => ({
      id: String(d.id),
      name: typeof d.name === 'string' ? d.name : '',
      scoreThreshold: d.scoreThreshold,
      color: typeof d.color === 'string' ? d.color : '#E5E7EB',
      timeToCare: typeof d.timeToCare === 'string' ? d.timeToCare : undefined,
    }))
    const urgencyLevel = classifyUrgency(score, urgencyLevelsForClient)

    if (!urgencyLevel) {
      return NextResponse.json({
        escalate: false,
        urgencyLevel: null,
        resources: [],
        actionText: 'Contact Lackey Clinic',
        fallback: true,
      })
    }

    // Find routing rule
    const routingRules = await payload.find({
      collection: 'routing-rules',
      where: {
        and: [
          { careType: { equals: careTypeId } },
          { urgencyLevel: { equals: urgencyLevel.id } },
        ],
      },
      locale: safeLocale,
      depth: 2,
    })

    const rule = routingRules.docs[0]

    if (!rule) {
      // Fallback: no routing rule found
      const staticContent = await payload.findGlobal({ slug: 'static-content', locale: safeLocale })
      return NextResponse.json({
        escalate: false,
        urgencyLevel,
        resources: [],
        actionText: 'Contact Lackey Clinic',
        clinicPhone: staticContent.clinicPhone,
        virtualCareUrl: staticContent.virtualCareUrl,
        fallback: true,
      })
    }

    // Log anonymous session (fire-and-forget).
    // Await session log — Vercel freezes the runtime after response, so
    // fire-and-forget writes get lost on serverless.
    const sessionId = crypto.randomUUID()
    try {
      await payload.create({
        collection: 'triage-sessions',
        overrideAccess: true,
        data: {
          sessionId,
          careTypeSelected: Number(careTypeId),
          urgencyResult: Number(urgencyLevel.id),
          resourcesShown: Array.isArray(rule.resources)
            ? rule.resources.map((r: any) => (typeof r === 'object' ? r.id : r))
            : [],
          virtualCareOffered: rule.virtualCareEligible ?? false,
          emergencyScreenTriggered: false,
          completedFlow: true,
          locale: safeLocale,
          device: safeDevice,
          questionSetVersion: body.questionSetVersion ?? null,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[triage-session] Failed to log session:', message)
      recordSessionLogFailure(err)
    }

    return NextResponse.json({
      escalate: false,
      urgencyLevel,
      resources: rule.resources,
      virtualCareEligible: rule.virtualCareEligible,
      actionText: rule.actionText,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong. Please call Lackey Clinic directly.', fallback: true },
      { status: 500 },
    )
  }
}
