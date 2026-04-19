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
    <footer className="px-5 py-4 text-center text-[12px] text-[var(--ink-3)] border-t border-[var(--stroke)] bg-[var(--surface-0)] transition-colors">
      <div className="mb-3">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="text-[12px] text-[var(--ink-3)] hover:text-[var(--ink-2)] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-primary)] min-h-[32px]"
        >
          {d('heading')} {open ? '▲' : '▼'}
        </button>

        {open && (
          <ul className="mt-2 mx-auto max-w-md space-y-1 text-left text-[12px] text-[var(--ink-3)] list-disc list-inside">
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
