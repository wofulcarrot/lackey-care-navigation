'use client'

import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect, useRef } from 'react'
import { useTriage } from '@/hooks/useTriage'
import { QuestionCard } from '@/components/QuestionCard'
import { ProgressBar } from '@/components/ProgressBar'
import { EmergencyAlert } from '@/components/EmergencyAlert'
import { CrisisAlert } from '@/components/CrisisAlert'
import { track } from '@/lib/tracker'
import { SESSION_KEYS, isUrgentLevel } from '@/lib/constants'
import { logEmergencyBeacon } from '@/lib/log-emergency-beacon'

interface Props {
  careTypeId: string
  isBehavioralHealth: boolean
  questions: any[]
  questionSetVersion: number
}

export function TriageClient({
  careTypeId,
  isBehavioralHealth,
  questions,
  questionSetVersion,
}: Props) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('triage')
  const triage = useTriage(questions)
  const hasSubmittedRef = useRef(false)

  // Handle meta-redirect
  useEffect(() => {
    if (triage.redirectCareType) {
      router.replace(`/${locale}/triage?careType=${triage.redirectCareType}`)
    }
  }, [triage.redirectCareType, router, locale])

  // Handle completion — POST to API and navigate to results
  useEffect(() => {
    if (!triage.completed || hasSubmittedRef.current) return
    hasSubmittedRef.current = true

    const answers = triage.selectedAnswers.flatMap((sa) =>
      sa.answers.map((a) => ({
        answerId: a.id ?? '',
        urgencyWeight: a.urgencyWeight,
        escalateImmediately: a.escalateImmediately,
      })),
    )
    fetch('/api/triage/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        careTypeId,
        answers,
        locale,
        questionSetVersion,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        sessionStorage.setItem(SESSION_KEYS.triageResult, JSON.stringify(data))
        // Store the inputs so results page can re-evaluate on locale change
        sessionStorage.setItem('triageInputs', JSON.stringify({ careTypeId, answers, questionSetVersion }))
        track('triage_completed', { careType: careTypeId, urgencyLevel: data?.urgencyLevel?.name })
        // When urgency is Urgent, route through the location screen so we
        // can swap in real nearby urgent cares via Foursquare. All other
        // urgency levels proceed directly to results as before. We match
        // on the urgency level name rather than a hardcoded scoreThreshold
        // so admins can tune thresholds in the CMS without breaking this
        // flow. The evaluate API returns the localized name, so we check
        // both English ("Urgent") and Spanish ("Urgente").
        const urgencyName = data?.urgencyLevel?.name
        if (isUrgentLevel(urgencyName) && !data?.escalate) {
          router.push(`/${locale}/location`)
        } else {
          router.push(`/${locale}/results`)
        }
      })
      .catch(() => {
        router.push(`/${locale}/results?fallback=true`)
      })
  }, [triage.completed]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAnswer(answers: any[]) {
    track('triage_question', { questionIndex: triage.questionNumber, totalQuestions: triage.totalQuestions })
    triage.submitAnswer(answers)
  }

  // Fire-and-forget crisis logging — guarded by ref so React re-renders
  // and concurrent mode retries don't duplicate the analytics event.
  const crisisLogged = useRef(false)
  useEffect(() => {
    if (triage.escalated && isBehavioralHealth && !crisisLogged.current) {
      crisisLogged.current = true
      logEmergencyBeacon({ isCrisis: true, careTypeId, locale })
    }
  }, [triage.escalated, isBehavioralHealth, careTypeId, locale])

  // Early returns AFTER all hooks (React rules of hooks)
  // Behavioral Health escalation shows the dedicated suicide prevention
  // screen (988 Lifeline + Crisis Text Line + CSB) instead of the generic
  // 911 EmergencyAlert. All other care types keep the 911 path.
  if (triage.escalated) {
    if (isBehavioralHealth) return <CrisisAlert />
    return <EmergencyAlert />
  }
  if (!triage.currentQuestion) return null

  return (
    <div>
      <div className="px-4 pt-4">
        <ProgressBar
          current={triage.questionNumber}
          total={triage.totalQuestions}
        />
      </div>
      {triage.canGoBack && (
        <button
          onClick={triage.goBack}
          className="px-4 pt-3 text-blue-600 font-medium min-h-[48px]"
        >
          &larr; {t('back')}
        </button>
      )}
      <QuestionCard
        key={triage.currentQuestion.id}
        text={triage.currentQuestion.text}
        helpText={triage.currentQuestion.helpText}
        type={triage.currentQuestion.type}
        answers={triage.currentQuestion.answers}
        onSubmit={handleAnswer}
      />
    </div>
  )
}
