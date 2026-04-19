'use client'

import { useTranslations } from 'next-intl'
import { PrimaryButton, GhostButton } from './ui/Button'
import { track } from '@/lib/tracker'

interface Props {
  virtualCareUrl: string
  bullets?: string[]
  onShowOther: () => void
}

/**
 * "You can talk to a doctor right now — free" interstitial shown between
 * triage completion and the results page when the urgency tier qualifies
 * for virtual care (semi-urgent / routine / elective). Patients who need
 * in-person care (urgent, emergent) never see this screen.
 */
export function VirtualCareInterstitial({ virtualCareUrl, bullets, onShowOther }: Props) {
  const t = useTranslations('virtualCareInterstitial')
  return (
    <div className="px-6 py-8 text-center max-w-[440px] mx-auto">
      {/* Sage-green emoji circle — reinforces the "free & safe" framing */}
      <div className="w-24 h-24 rounded-full bg-[var(--accent-sage-soft)] flex items-center justify-center mx-auto mb-5">
        <span className="text-4xl" aria-hidden="true">📱</span>
      </div>

      <h2 className="font-display text-[24px] font-semibold mb-3 leading-tight text-[var(--ink)]">
        {t('heading')}
      </h2>

      {bullets && bullets.length > 0 && (
        <ul className="text-left max-w-[320px] mx-auto mb-7 space-y-2.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] text-[var(--ink)]">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-[var(--accent-sage)] text-white text-[11px] flex items-center justify-center shrink-0">
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 max-w-[340px] mx-auto">
        <PrimaryButton
          tone="sage"
          href={virtualCareUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('virtual_care_click')}
        >
          {t('startVisit')}
        </PrimaryButton>
        <GhostButton
          onClick={() => {
            track('virtual_care_skip')
            onShowOther()
          }}
        >
          {t('showOther')}
        </GhostButton>
      </div>
    </div>
  )
}
