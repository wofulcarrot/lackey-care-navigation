interface AnswerScore {
  answerId: string
  urgencyWeight: number
}

interface UrgencyLevel {
  id: string
  name: string
  scoreThreshold: number
}

interface Answer {
  nextQuestion: string | null
}

interface Question {
  id: string
  sortOrder: number
}

interface EscalatableAnswer {
  escalateImmediately: boolean
}

interface MetaAnswer {
  redirectToCareType: string | null
}

export function calculateScore(answers: AnswerScore[]): number {
  return answers.reduce((sum, a) => sum + a.urgencyWeight, 0)
}

export function classifyUrgency(
  score: number,
  levels: UrgencyLevel[],
): UrgencyLevel | null {
  if (levels.length === 0) return null
  const sorted = [...levels].sort((a, b) => b.scoreThreshold - a.scoreThreshold)
  return sorted.find((level) => score >= level.scoreThreshold) ?? null
}

export function resolveNextQuestion(
  answer: Answer,
  currentQuestionId: string,
  questions: Question[],
): string | null {
  if (answer.nextQuestion) return answer.nextQuestion
  const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder)
  const currentIndex = sorted.findIndex((q) => q.id === currentQuestionId)
  if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null
  return sorted[currentIndex + 1].id
}

export function checkEscalation(answers: EscalatableAnswer[]): boolean {
  return answers.some((a) => a.escalateImmediately)
}

export function checkMetaRedirect(answer: MetaAnswer): string | null {
  return answer.redirectToCareType ?? null
}
