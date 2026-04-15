'use client'

import { useState, useCallback, useMemo } from 'react'

interface Question {
  id: string
  text: string
  helpText?: string
  type: 'single_choice' | 'multi_choice' | 'yes_no'
  sortOrder: number
  answers: Answer[]
}

// Payload relationships may arrive as a primitive ID (number | string) when
// depth=0, or as a populated object { id, ... } when depth>=1. Accept both.
type PayloadRelation = string | number | { id: string | number } | null | undefined

interface Answer {
  id?: string
  label: string
  urgencyWeight: number
  escalateImmediately: boolean
  nextQuestion?: PayloadRelation
  redirectToCareType?: PayloadRelation
}

/** Extract the ID from a Payload relationship field, whether populated or not. */
function relationId(rel: PayloadRelation): string | null {
  if (rel == null) return null
  if (typeof rel === 'string' || typeof rel === 'number') return String(rel)
  if (typeof rel === 'object' && 'id' in rel && rel.id != null) return String(rel.id)
  return null
}

interface TriageState {
  currentQuestionIndex: number
  selectedAnswers: { questionId: string; answers: Answer[] }[]
  totalScore: number
  escalated: boolean
  redirectCareType: string | null
  completed: boolean
}

export function useTriage(questions: Question[]) {
  const sorted = useMemo(() => [...questions].sort((a, b) => a.sortOrder - b.sortOrder), [questions])
  const [state, setState] = useState<TriageState>({
    currentQuestionIndex: 0,
    selectedAnswers: [],
    totalScore: 0,
    escalated: false,
    redirectCareType: null,
    completed: false,
  })

  const currentQuestion = sorted[state.currentQuestionIndex] ?? null

  const submitAnswer = useCallback((answers: Answer[]) => {
    if (answers.some((a) => a.escalateImmediately)) {
      setState((prev) => ({ ...prev, escalated: true }))
      return
    }

    const redirectAnswer = answers.find((a) => relationId(a.redirectToCareType) !== null)
    if (redirectAnswer) {
      const targetId = relationId(redirectAnswer.redirectToCareType)
      if (targetId) {
        setState((prev) => ({ ...prev, redirectCareType: targetId }))
        return
      }
    }

    setState((prev) => {
      const scoreAdd = answers.reduce((sum, a) => sum + a.urgencyWeight, 0)
      const currentQ = sorted[prev.currentQuestionIndex]

      const branchTarget = answers.length === 1 ? relationId(answers[0].nextQuestion) : null
      let nextIndex: number

      if (branchTarget) {
        nextIndex = sorted.findIndex((q) => String(q.id) === branchTarget)
        if (nextIndex === -1) nextIndex = prev.currentQuestionIndex + 1
      } else {
        nextIndex = prev.currentQuestionIndex + 1
      }

      const completed = nextIndex >= sorted.length

      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        selectedAnswers: [...prev.selectedAnswers, { questionId: currentQ.id, answers }],
        totalScore: prev.totalScore + scoreAdd,
        completed,
      }
    })
  }, [sorted])

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.selectedAnswers.length === 0) return prev
      const newAnswers = prev.selectedAnswers.slice(0, -1)
      const lastAnswer = prev.selectedAnswers[prev.selectedAnswers.length - 1]
      const scoreRemove = lastAnswer.answers.reduce((sum, a) => sum + a.urgencyWeight, 0)
      const prevIndex = sorted.findIndex((q) => q.id === lastAnswer.questionId)

      return {
        ...prev,
        currentQuestionIndex: prevIndex >= 0 ? prevIndex : prev.currentQuestionIndex - 1,
        selectedAnswers: newAnswers,
        totalScore: prev.totalScore - scoreRemove,
        completed: false,
      }
    })
  }, [sorted])

  return {
    currentQuestion,
    questionNumber: state.selectedAnswers.length + 1,
    totalQuestions: sorted.length,
    totalScore: state.totalScore,
    escalated: state.escalated,
    redirectCareType: state.redirectCareType,
    completed: state.completed,
    selectedAnswers: state.selectedAnswers,
    submitAnswer,
    goBack,
    canGoBack: state.selectedAnswers.length > 0,
  }
}
