'use client'

import { ErrorFallback } from '@/components/ErrorFallback'

export default function EmergencyError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorFallback onRetry={reset} />
}
