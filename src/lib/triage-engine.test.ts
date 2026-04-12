import { describe, it, expect } from 'vitest'
import {
  calculateScore,
  classifyUrgency,
  resolveNextQuestion,
  checkEscalation,
  checkMetaRedirect,
} from './triage-engine'

describe('calculateScore', () => {
  it('sums urgency weights from selected answers', () => {
    const answers = [
      { answerId: 'a1', urgencyWeight: 3 },
      { answerId: 'a2', urgencyWeight: 5 },
      { answerId: 'a3', urgencyWeight: 2 },
    ]
    expect(calculateScore(answers)).toBe(10)
  })

  it('returns 0 for empty answers', () => {
    expect(calculateScore([])).toBe(0)
  })
})

describe('classifyUrgency', () => {
  const levels = [
    { id: 'life', name: 'Life-Threatening', scoreThreshold: 20 },
    { id: 'emergent', name: 'Emergent', scoreThreshold: 15 },
    { id: 'urgent', name: 'Urgent', scoreThreshold: 10 },
    { id: 'semi', name: 'Semi-Urgent', scoreThreshold: 5 },
    { id: 'routine', name: 'Routine', scoreThreshold: 0 },
  ]

  it('matches highest threshold first', () => {
    expect(classifyUrgency(22, levels)?.id).toBe('life')
  })

  it('matches exact threshold boundary', () => {
    expect(classifyUrgency(15, levels)?.id).toBe('emergent')
  })

  it('falls to lowest level for low score', () => {
    expect(classifyUrgency(2, levels)?.id).toBe('routine')
  })

  it('returns null for empty levels', () => {
    expect(classifyUrgency(10, [])).toBeNull()
  })
})

describe('resolveNextQuestion', () => {
  const questions = [
    { id: 'q1', sortOrder: 1 },
    { id: 'q2', sortOrder: 2 },
    { id: 'q3', sortOrder: 3 },
  ]

  it('follows nextQuestion override when set', () => {
    const answer = { nextQuestion: 'q3' }
    expect(resolveNextQuestion(answer, 'q1', questions)).toBe('q3')
  })

  it('falls back to next by sortOrder when no override', () => {
    const answer = { nextQuestion: null }
    expect(resolveNextQuestion(answer, 'q1', questions)).toBe('q2')
  })

  it('returns null when at last question', () => {
    const answer = { nextQuestion: null }
    expect(resolveNextQuestion(answer, 'q3', questions)).toBeNull()
  })
})

describe('checkEscalation', () => {
  it('returns true when any answer has escalateImmediately', () => {
    const answers = [
      { escalateImmediately: false },
      { escalateImmediately: true },
    ]
    expect(checkEscalation(answers)).toBe(true)
  })

  it('returns false when no answers escalate', () => {
    const answers = [
      { escalateImmediately: false },
      { escalateImmediately: false },
    ]
    expect(checkEscalation(answers)).toBe(false)
  })
})

describe('checkMetaRedirect', () => {
  it('returns the redirected care type ID when set', () => {
    const answer = { redirectToCareType: 'dental' }
    expect(checkMetaRedirect(answer)).toBe('dental')
  })

  it('returns null when no redirect', () => {
    const answer = { redirectToCareType: null }
    expect(checkMetaRedirect(answer)).toBeNull()
  })
})
