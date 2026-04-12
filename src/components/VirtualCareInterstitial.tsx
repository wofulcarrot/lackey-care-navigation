'use client'

import { useTranslations } from 'next-intl'

interface Props {
  virtualCareUrl: string
  bullets?: string[]
  onShowOther: () => void
}

export function VirtualCareInterstitial({ virtualCareUrl, bullets, onShowOther }: Props) {
  const t = useTranslations('virtualCareInterstitial')
  return (
    <div className="px-4 py-8 text-center">
      <h2 className="text-2xl font-bold mb-6">{t('heading')}</h2>
      {bullets && (
        <ul className="text-left max-w-sm mx-auto mb-8 space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-lg">
              <span className="text-green-600 font-bold">✓</span> {b}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-4 max-w-sm mx-auto">
        <a
          href={virtualCareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-green-600 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]"
        >
          {t('startVisit')}
        </a>
        <button
          onClick={onShowOther}
          className="block w-full bg-gray-100 text-gray-700 text-center py-4 rounded-xl text-lg font-medium min-h-[48px]"
        >
          {t('showOther')}
        </button>
      </div>
    </div>
  )
}
