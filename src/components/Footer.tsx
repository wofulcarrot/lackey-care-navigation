'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const disclaimerKeys = [
  'notEmergency',
  'notEligibility',
  'noAppointmentGuarantee',
  'noSeriousMentalIllness',
  'noControlledSubstances',
] as const

export function Footer() {
  const t = useTranslations('common')
  const d = useTranslations('disclaimers')
  const [open, setOpen] = useState(false)

  return (
    <footer className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
        >
          {d('heading')} {open ? '▲' : '▼'}
        </button>

        {open && (
          <ul className="mt-2 mx-auto max-w-md space-y-1 text-left text-xs text-gray-400 dark:text-gray-500 list-disc list-inside">
            {disclaimerKeys.map((key) => (
              <li key={key}>{d(key)}</li>
            ))}
          </ul>
        )}
      </div>

      <p>{t('privacy')}</p>
      <p className="mt-1">{t('poweredBy')}</p>
    </footer>
  )
}
