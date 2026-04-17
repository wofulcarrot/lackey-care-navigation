'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { track } from '@/lib/tracker'

interface CrisisAlertProps {
  onDismiss?: () => void
}

/**
 * Suicide prevention / behavioral health crisis screen.
 * Shown instead of the generic 911 EmergencyAlert when a patient in the
 * Behavioral Health flow discloses self-harm thoughts. Routes to 988
 * Suicide & Crisis Lifeline first, with Crisis Text Line and local CSB
 * as additional options. 911 is still available but NOT the primary CTA.
 */
export function CrisisAlert({ onDismiss }: CrisisAlertProps) {
  const t = useTranslations('crisis')

  useEffect(() => {
    track('crisis_screen_view')
  }, [])

  return (
    <div
      className="fixed inset-0 bg-indigo-900 flex flex-col items-center justify-center px-6 text-white text-center z-50 overflow-auto"
      role="alertdialog"
      aria-labelledby="crisis-heading"
      aria-describedby="crisis-body"
    >
      <div className="max-w-md w-full py-8">
        {/* Header */}
        <div className="text-5xl mb-4" aria-hidden="true">💜</div>
        <h1 id="crisis-heading" className="text-3xl font-bold mb-2">
          {t('heading')}
        </h1>
        <p id="crisis-body" className="text-xl mb-8 text-indigo-100">
          {t('body')}
        </p>

        {/* 988 Lifeline — primary CTA */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-4 text-left">
          <h2 className="text-lg font-bold mb-1 text-white">{t('lifelineTitle')}</h2>
          <p className="text-sm text-indigo-200 mb-4">{t('lifelineBody')}</p>
          <div className="flex flex-col gap-3">
            <a
              href="tel:988"
              onClick={() => track('crisis_988_tap')}
              className="block w-full bg-white text-indigo-900 text-center py-4 rounded-xl text-xl font-bold min-h-[48px]"
            >
              {t('call988')}
            </a>
            <a
              href="sms:988"
              onClick={() => track('crisis_988_tap')}
              className="block w-full bg-indigo-700 text-white text-center py-3 rounded-xl text-lg font-bold min-h-[48px]"
            >
              {t('text988')}
            </a>
          </div>
        </div>

        {/* Crisis Text Line */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-4 text-left">
          <h2 className="text-base font-bold mb-1 text-white">{t('textLineTitle')}</h2>
          <p className="text-sm text-indigo-200 mb-3">{t('textLineBody')}</p>
          <a
            href="sms:741741&body=ASKUS"
            className="block w-full bg-indigo-700 text-white text-center py-3 rounded-xl text-base font-bold min-h-[48px]"
          >
            {t('textAskus')}
          </a>
        </div>

        {/* Local CSB */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-6 text-left">
          <h2 className="text-base font-bold mb-1 text-white">{t('csbTitle')}</h2>
          <p className="text-sm text-indigo-200 mb-3">{t('csbBody')}</p>
          <a
            href="https://vacsb.org/find-your-csb/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-indigo-700 text-white text-center py-3 rounded-xl text-base font-bold min-h-[48px]"
          >
            {t('findCsb')}
          </a>
        </div>

        {/* 911 as secondary option */}
        <a
          href="tel:911"
          className="block w-full border-2 border-white/30 text-white text-center py-3 rounded-xl text-base font-medium min-h-[48px] mb-3"
        >
          {t('call911')}
        </a>

        {/* Dismiss / go back */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-2 text-indigo-200 underline text-sm min-h-[48px]"
          >
            {t('goBack')}
          </button>
        )}
      </div>
    </div>
  )
}
