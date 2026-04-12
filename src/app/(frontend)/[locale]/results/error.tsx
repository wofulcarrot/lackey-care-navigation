'use client'

import { ErrorFallback } from '@/components/ErrorFallback'

export default function ResultsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorFallback onRetry={reset} />
}
