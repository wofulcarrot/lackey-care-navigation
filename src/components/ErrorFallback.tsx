'use client'

import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

interface ErrorFallbackProps {
  clinicPhone?: string
  virtualCareUrl?: string
  onRetry?: () => void
}

export function ErrorFallback({ clinicPhone, virtualCareUrl, onRetry }: ErrorFallbackProps) {
  const t = useTranslations('common')
  const tResults = useTranslations('results')
  const router = useRouter()
  const locale = useLocale()

  // When rendered from a route-level error.tsx boundary, `onRetry` is
  // Next.js's `reset()` — but if the render keeps throwing, retrying dumps
  // the user back into the same error. Wrap it so Start Over instead clears
  // any stored triage state and navigates to the landing page, giving the
  // patient a reliable escape hatch.
  function handleStartOver() {
    try {
      sessionStorage.removeItem('triageResult')
      sessionStorage.removeItem('triageUserLocation')
      sessionStorage.removeItem('emergencyScreenCompleted')
    } catch {
      /* non-fatal */
    }
    router.push(`/${locale}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t('errorTitle')}</h2>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {clinicPhone && (
          <a href={`tel:${clinicPhone}`} className="block w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]">
            {tResults('call')} Lackey Clinic
          </a>
        )}
        {virtualCareUrl && (
          <a href={virtualCareUrl} target="_blank" rel="noopener noreferrer" className="block w-full bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-400 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]">
            {t('startVirtualVisit')}
          </a>
        )}
        {onRetry && (
          <button
            onClick={handleStartOver}
            className="block w-full bg-gray-100 dark:bg-gray-800 dark:text-gray-100 text-gray-700 text-center py-4 rounded-xl text-lg font-medium min-h-[48px]"
          >
            {tResults('startOver')}
          </button>
        )}
      </div>
    </div>
  )
}
