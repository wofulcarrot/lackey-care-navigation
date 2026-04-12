'use client'

import { ErrorFallback } from '@/components/ErrorFallback'

export default function TriageError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorFallback onRetry={reset} />
}
