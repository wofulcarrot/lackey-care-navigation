'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ResourceCard } from '@/components/ResourceCard'
import { VirtualCareInterstitial } from '@/components/VirtualCareInterstitial'
import { ErrorFallback } from '@/components/ErrorFallback'

interface Props {
  clinicPhone: string
  virtualCareUrl: string
  virtualCareBullets: string[]
  eligibilityUrl: string
}

export function ResultsClient({ clinicPhone, virtualCareUrl, virtualCareBullets, eligibilityUrl }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('results')
  const [showResources, setShowResources] = useState(false)

  const isFallback = searchParams.get('fallback') === 'true'

  if (isFallback) {
    return <ErrorFallback clinicPhone={clinicPhone} virtualCareUrl={virtualCareUrl} />
  }

  let data: any = null
  try {
    data = JSON.parse(decodeURIComponent(searchParams.get('data') ?? '{}'))
  } catch {
    return <ErrorFallback clinicPhone={clinicPhone} virtualCareUrl={virtualCareUrl} />
  }

  // Show Virtual Care interstitial first if eligible
  if (data.virtualCareEligible && !showResources) {
    return (
      <VirtualCareInterstitial
        virtualCareUrl={virtualCareUrl}
        bullets={virtualCareBullets}
        onShowOther={() => setShowResources(true)}
      />
    )
  }

  const resources = Array.isArray(data.resources) ? data.resources : []

  return (
    <div className="px-4 py-6">
      {data.urgencyLevel && (
        <div className="mb-6">
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-2"
            style={{ backgroundColor: data.urgencyLevel.color }}
          >
            {data.urgencyLevel.name}
          </span>
          {data.urgencyLevel.timeToCare && (
            <p className="text-gray-600">Expected: {data.urgencyLevel.timeToCare}</p>
          )}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">{t('heading')}</h1>

      {data.actionText && (
        <p className="text-lg font-medium mb-6">{data.actionText}</p>
      )}

      <div className="flex flex-col gap-4 mb-8">
        {resources.map((r: any, i: number) => (
          <ResourceCard key={r.id ?? i} resource={r} />
        ))}
      </div>

      {data.nextSteps && (
        <div className="prose mb-8" dangerouslySetInnerHTML={{ __html: data.nextSteps }} />
      )}

      <div className="flex flex-col gap-4">
        <a
          href={`${eligibilityUrl}?utm_source=triage&utm_medium=referral&utm_campaign=${data.careTypeName ?? ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]"
        >
          {t('eligibility')}
        </a>
        <button
          onClick={() => router.push(`/${locale}`)}
          className="block w-full bg-gray-100 text-gray-700 text-center py-4 rounded-xl text-lg font-medium min-h-[48px]"
        >
          {t('startOver')}
        </button>
      </div>
    </div>
  )
}
