'use client'

import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('common')
  return (
    <footer className="px-4 py-6 text-center text-sm text-gray-500 border-t border-gray-200">
      <p>{t('privacy')}</p>
      <p className="mt-1">{t('poweredBy')}</p>
    </footer>
  )
}
