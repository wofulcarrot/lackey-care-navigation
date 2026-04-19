'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { track } from '@/lib/tracker'

interface CrisisAlertProps {
  onDismiss?: () => void
}

/**
 * Suicide prevention / behavioral health crisis screen — purple takeover.
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
      className="fixed inset-0 bg-[var(--crisis-bg)] text-white overflow-auto z-50"
      role="alertdialog"
      aria-labelledby="crisis-heading"
      aria-describedby="crisis-body"
    >
      <div className="px-5 py-9 flex flex-col items-center text-center max-w-[440px] mx-auto">
        <div className="text-5xl mb-4" aria-hidden="true">💜</div>
        <h1 id="crisis-heading" className="font-display text-[28px] font-semibold mb-2 leading-tight">
          {t('heading')}
        </h1>
        <p id="crisis-body" className="text-[16px] text-white/80 mb-6 max-w-[320px]">
          {t('body')}
        </p>

        {/* 988 Lifeline — primary CTA, backdrop-blur glass card */}
        <div className="w-full rounded-2xl p-5 mb-3 text-left bg-white/[0.09] backdrop-blur border border-white/10">
          <h2 className="font-semibold text-[17px] mb-0.5">{t('lifelineTitle')}</h2>
          <p className="text-[13px] text-white/70 mb-4">{t('lifelineBody')}</p>
          <div className="flex flex-col gap-2.5">
            <a
              href="tel:988"
              onClick={() => track('crisis_988_tap')}
              className="block w-full bg-white text-[var(--crisis-bg)] text-center py-4 rounded-xl text-[19px] font-bold min-h-[56px]"
            >
              📞 {t('call988')}
            </a>
            <a
              href="sms:988"
              onClick={() => track('crisis_988_tap')}
              className="block w-full bg-white/15 text-white text-center py-3 rounded-xl text-[15px] font-semibold min-h-[48px] border border-white/10"
            >
              💬 {t('text988')}
            </a>
          </div>
        </div>

        {/* Crisis Text Line */}
        <div className="w-full rounded-2xl p-4 mb-3 text-left bg-white/[0.06] border border-white/5">
          <h2 className="font-semibold text-[15px] mb-0.5">{t('textLineTitle')}</h2>
          <p className="text-[13px] text-white/70 mb-3">{t('textLineBody')}</p>
          <a
            href="sms:741741&body=ASKUS"
            className="block w-full bg-white/15 text-white text-center py-3 rounded-xl text-[14px] font-semibold min-h-[48px] border border-white/10"
          >
            {t('textAskus')}
          </a>
        </div>

        {/* Local CSB */}
        <div className="w-full rounded-2xl p-4 mb-5 text-left bg-white/[0.06] border border-white/5">
          <h2 className="font-semibold text-[15px] mb-0.5">{t('csbTitle')}</h2>
          <p className="text-[13px] text-white/70 mb-3">{t('csbBody')}</p>
          <a
            href="https://vacsb.org/find-your-csb/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-white/15 text-white text-center py-3 rounded-xl text-[14px] font-semibold min-h-[48px] border border-white/10"
          >
            {t('findCsb')}
          </a>
        </div>

        {/* 911 as secondary option */}
        <a
          href="tel:911"
          className="block w-full border-2 border-white/30 text-white text-center py-3 rounded-xl text-[14px] font-medium min-h-[48px] mb-3"
        >
          {t('call911')}
        </a>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-white/70 underline text-[14px] min-h-[44px]"
          >
            {t('goBack')}
          </button>
        )}
      </div>
    </div>
  )
}
