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

  // Handle meta-redirect (e.g. "Not Sure" → medical)
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
        sessionStorage.setItem('triageInputs', JSON.stringify({ careTypeId, answers, questionSetVersion }))
        track('triage_completed', { careType: careTypeId, urgencyLevel: data?.urgencyLevel?.name })
        // Route Urgent tier through the location screen so we can swap in
        // real nearby urgent cares via Foursquare.
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
    track('triage_question', {
      questionIndex: triage.questionNumber,
      totalQuestions: triage.totalQuestions,
    })
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
  if (triage.escalated) {
    if (isBehavioralHealth) return <CrisisAlert />
    return <EmergencyAlert />
  }
  if (!triage.currentQuestion) return null

  return (
    <div className="px-5 py-5 max-w-[440px] mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-[var(--accent-primary)] uppercase tracking-wide">
            {t('progress', {
              current: triage.questionNumber,
              total: triage.totalQuestions,
            })}
          </span>
          {triage.canGoBack && (
            <button
              onClick={triage.goBack}
              className="text-[13px] text-[var(--ink-2)] font-medium hover:text-[var(--ink)] min-h-[32px]"
            >
              ← {t('back')}
            </button>
          )}
        </div>
        <ProgressBar
          current={triage.questionNumber}
          total={triage.totalQuestions}
        />
      </div>

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
