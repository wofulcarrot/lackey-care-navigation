'use client'

import { useTranslations } from 'next-intl'
import { PrimaryButton, GhostButton } from './ui/Button'

interface ErrorFallbackProps {
  clinicPhone?: string
  virtualCareUrl?: string
  onRetry?: () => void
}

/**
 * Unified empty / error screen. Shown by per-route error.tsx boundaries
 * when a server component throws, and by the results page when the API
 * call fails (isFallback=true). Gives the patient a live phone number
 * and the virtual-care link so they never hit a dead end.
 */
export function ErrorFallback({ clinicPhone, virtualCareUrl, onRetry }: ErrorFallbackProps) {
  const t = useTranslations('common')
  const tResults = useTranslations('results')
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center max-w-[440px] mx-auto">
      <h2 className="font-display text-[24px] font-semibold mb-4 text-[var(--ink)]">
        {t('errorTitle')}
      </h2>
      <div className="flex flex-col gap-3 w-full">
        {clinicPhone && (
          <PrimaryButton tone="coral" href={`tel:${clinicPhone}`}>
            {tResults('call')} Lackey Clinic
          </PrimaryButton>
        )}
        {virtualCareUrl && (
          <PrimaryButton
            tone="sage"
            href={virtualCareUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('startVirtualVisit')}
          </PrimaryButton>
        )}
        {onRetry && <GhostButton onClick={onRetry}>{tResults('startOver')}</GhostButton>}
      </div>
    </div>
  )
}
