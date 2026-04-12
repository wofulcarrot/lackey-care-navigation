import { describe, it, expect } from 'vitest'
import { calculateScore, classifyUrgency } from '@/lib/triage-engine'

// Integration test: verifies the evaluation pipeline end-to-end with mock data
describe('triage evaluation pipeline', () => {
  const urgencyLevels = [
    { id: 'life', name: 'Life-Threatening', scoreThreshold: 20 },
    { id: 'emergent', name: 'Emergent', scoreThreshold: 15 },
    { id: 'urgent', name: 'Urgent', scoreThreshold: 10 },
    { id: 'semi', name: 'Semi-Urgent', scoreThreshold: 5 },
    { id: 'routine', name: 'Routine', scoreThreshold: 0 },
  ]

  it('medical answers scoring 12 → Urgent classification', () => {
    const answers = [
      { answerId: 'a1', urgencyWeight: 5 },
      { answerId: 'a2', urgencyWeight: 4 },
      { answerId: 'a3', urgencyWeight: 3 },
    ]
    const score = calculateScore(answers)
    const level = classifyUrgency(score, urgencyLevels)
    expect(score).toBe(12)
    expect(level?.id).toBe('urgent')
  })

  it('low-scoring answers → Routine classification', () => {
    const answers = [
      { answerId: 'a1', urgencyWeight: 1 },
      { answerId: 'a2', urgencyWeight: 2 },
    ]
    const score = calculateScore(answers)
    const level = classifyUrgency(score, urgencyLevels)
    expect(score).toBe(3)
    expect(level?.id).toBe('routine')
  })
})
