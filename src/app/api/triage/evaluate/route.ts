import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { calculateScore, classifyUrgency, checkEscalation } from '@/lib/triage-engine'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'
    const { allowed, remaining } = rateLimit(ip)
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
    const safeLocale = validLocales.includes(locale as any) ? locale : 'en'
    const safeDevice = validDevices.includes(device as any) ? device : 'mobile'

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

    // Check for immediate escalation
    if (checkEscalation(answers)) {
      return NextResponse.json({
        escalate: true,
        urgencyLevel: null,
        resources: [],
        actionText: 'Call 911',
      })
    }

    const payload = await getPayload({ config })

    // Calculate score and classify urgency
    const score = calculateScore(answers)
    const urgencyLevelsResult = await payload.find({
      collection: 'urgency-levels',
      sort: '-scoreThreshold',
      limit: 100,
      locale: safeLocale,
    })
    const urgencyLevel = classifyUrgency(score, urgencyLevelsResult.docs.map((d) => ({
      id: String(d.id),
      name: typeof d.name === 'string' ? d.name : '',
      scoreThreshold: d.scoreThreshold,
    })))

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

    // Log anonymous session (fire-and-forget)
    const sessionId = crypto.randomUUID()
    payload.create({
      collection: 'triage-sessions',
      data: {
        sessionId,
        careTypeSelected: careTypeId,
        urgencyResult: urgencyLevel.id,
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
    }).catch(() => {}) // Fire-and-forget: never block patient flow

    return NextResponse.json({
      escalate: false,
      urgencyLevel,
      resources: rule.resources,
      virtualCareEligible: rule.virtualCareEligible,
      actionText: rule.actionText,
      nextSteps: rule.nextSteps,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong. Please call Lackey Clinic directly.', fallback: true },
      { status: 500 },
    )
  }
}
