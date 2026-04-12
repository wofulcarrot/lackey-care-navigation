'use client'

import { useTranslations } from 'next-intl'

export function EmergencyAlert() {
  const t = useTranslations('emergency')
  return (
    <div className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center px-6 text-white text-center z-50">
      <div className="text-6xl mb-6">🚨</div>
      <h1 className="text-3xl font-bold mb-4">{t('alert')}</h1>
      <p className="text-xl mb-8">{t('alertBody')}</p>
      <a
        href="tel:911"
        className="block w-full max-w-sm bg-white text-red-600 text-center py-4 rounded-xl text-2xl font-bold min-h-[48px]"
      >
        {t('alert')}
      </a>
    </div>
  )
}
