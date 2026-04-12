'use client'

import { useTranslations } from 'next-intl'

interface EmergencyAlertProps {
  onDismiss?: () => void
}

export function EmergencyAlert({ onDismiss }: EmergencyAlertProps) {
  const t = useTranslations('emergency')
  return (
    <div className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center px-6 text-white text-center z-50" role="alertdialog" aria-labelledby="emergency-heading" aria-describedby="emergency-body">
      <div className="text-6xl mb-6" aria-hidden="true">🚨</div>
      <h1 id="emergency-heading" className="text-3xl font-bold mb-4">{t('alert')}</h1>
      <p id="emergency-body" className="text-xl mb-8">{t('alertBody')}</p>
      <a
        href="tel:911"
        className="block w-full max-w-sm bg-white text-red-600 text-center py-4 rounded-xl text-2xl font-bold min-h-[48px]"
      >
        {t('alert')}
      </a>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="mt-4 text-white underline text-lg min-h-[48px]"
        >
          {t('noneOfThese')}
        </button>
      )}
    </div>
  )
}
