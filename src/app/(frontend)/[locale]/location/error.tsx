'use client'

import { useTranslations } from 'next-intl'
import { ErrorFallback } from '@/components/ErrorFallback'

export default function LocationError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Access translations so this component participates in the i18n context
  // like other route-level error boundaries.
  useTranslations('common')
  return (
    <ErrorFallback
      clinicPhone="(757) 547-7484"
      virtualCareUrl="https://luca.zipnosis.com/guest_visits/new?l=en"
      onRetry={reset}
    />
  )
}
