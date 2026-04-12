'use client'

import { ErrorFallback } from '@/components/ErrorFallback'

export default function CareTypeError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorFallback onRetry={reset} />
}
