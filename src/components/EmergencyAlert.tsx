'use client'

import { useTranslations } from 'next-intl'

interface EmergencyAlertProps {
  onDismiss?: () => void
}

/**
 * Full-screen 911 takeover shown when a patient reports a life-threatening
 * symptom. Primary CTA is a tel: link to 911; sms: fallback for users who
 * can't speak (hearing-impaired or unsafe to call). Secondary "Go back"
 * only shown during the pre-triage safety check, not after escalation.
 */
export function EmergencyAlert({ onDismiss }: EmergencyAlertProps) {
  const t = useTranslations('emergency')

  return (
    <div
      className="fixed inset-0 bg-[var(--urgent-red)] flex flex-col items-center justify-center px-6 text-white text-center z-50"
      role="alertdialog"
      aria-labelledby="emergency-heading"
      aria-describedby="emergency-body"
    >
      <div className="text-6xl mb-5" aria-hidden="true">🚨</div>
      <h1
        id="emergency-heading"
        className="font-display text-[28px] font-semibold mb-3 leading-tight"
      >
        {t('alertHeading')}
      </h1>
      <p id="emergency-body" className="text-[16px] mb-7 max-w-[300px] leading-snug">
        {t('alertBody')}
      </p>

      <a
        href="tel:911"
        className="block w-full max-w-[320px] bg-white text-[var(--urgent-red)] text-center py-5 rounded-2xl text-[22px] font-bold mb-3 min-h-[60px] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
      >
        📞 {t('alertCall')}
      </a>

      <a
        href="sms:911"
        className="text-white/90 underline underline-offset-2 text-[14px] mb-4"
      >
        {t('alertText')}
      </a>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-white/90 underline underline-offset-2 text-[15px] py-2 min-h-[44px]"
        >
          {t('alertBack')}
        </button>
      )}
    </div>
  )
}
