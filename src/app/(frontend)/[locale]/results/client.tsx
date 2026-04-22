'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ResourceCard } from '@/components/ResourceCard'
import { VirtualCareInterstitial } from '@/components/VirtualCareInterstitial'
import { ErrorFallback } from '@/components/ErrorFallback'
import { LocationPrompt } from '@/components/LocationPrompt'
import { TrafficLight } from '@/components/TrafficLight'
import { PrimaryButton, GhostButton } from '@/components/ui/Button'
import { attachMilesFromFsq, formatDistance } from '@/lib/distance'
import { track } from '@/lib/tracker'
import type { TriageResult, TriageResource } from '@/lib/types'
import { SESSION_KEYS } from '@/lib/constants'

interface Props {
  clinicPhone: string
  virtualCareUrl: string
  virtualCareBullets: string[]
  eligibilityUrl: string
}

export function ResultsClient({
  clinicPhone,
  virtualCareUrl,
  virtualCareBullets,
  eligibilityUrl,
}: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('results')
  const [showResources, setShowResources] = useState(false)
  const [data, setData] = useState<TriageResult | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number; source: 'gps' | 'zip' } | null>(null)

  const isFallback = searchParams.get('fallback') === 'true'

  useEffect(() => {
    if (isFallback) {
      setHydrated(true)
      return
    }

    async function loadResult() {
      try {
        const storedInputs = sessionStorage.getItem('triageInputs')
        const stored = sessionStorage.getItem(SESSION_KEYS.triageResult)
        const wentThroughLocationFlow = !!sessionStorage.getItem(SESSION_KEYS.userLocation)

        if (storedInputs) {
          const inputs = JSON.parse(storedInputs)
          const previousResult = stored ? (JSON.parse(stored) as TriageResult) : null
          const res = await fetch('/api/triage/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...inputs, locale }),
          })
          if (res.ok) {
            const freshData = (await res.json()) as TriageResult
            if (wentThroughLocationFlow && previousResult) {
              freshData.resources = previousResult.resources
              freshData.virtualCareEligible = previousResult.virtualCareEligible
            }
            setData(freshData)
            sessionStorage.setItem(SESSION_KEYS.triageResult, JSON.stringify(freshData))
          } else if (stored) {
            setData(JSON.parse(stored) as TriageResult)
          }
        } else if (stored) {
          setData(JSON.parse(stored) as TriageResult)
        }
      } catch {
        // fall through to ErrorFallback below
      }
    }
    loadResult()

    try {
      const storedLoc = sessionStorage.getItem(SESSION_KEYS.userLocation)
      if (storedLoc) {
        const loc = JSON.parse(storedLoc)
        if (typeof loc.lat === 'number' && typeof loc.lon === 'number') {
          setUserLoc({ lat: loc.lat, lon: loc.lon, source: 'gps' })
        }
      }
    } catch {
      // non-fatal
    }

    setHydrated(true)
    track('results_view')
  }, [isFallback])

  if (!hydrated) {
    return (
      <div className="px-5 py-6 animate-pulse max-w-[440px] mx-auto">
        <div className="h-3 bg-[var(--surface-2)] rounded w-full mb-4" />
        <div className="h-20 bg-[var(--surface-2)] rounded-2xl mb-5" />
        <div className="h-6 bg-[var(--surface-2)] rounded w-2/3 mb-4" />
        <div className="h-32 bg-[var(--surface-2)] rounded-2xl" />
      </div>
    )
  }

  if (isFallback || !data) {
    return <ErrorFallback clinicPhone={clinicPhone} virtualCareUrl={virtualCareUrl} />
  }

  // Show Virtual Care interstitial first if eligible
  if (data.virtualCareEligible && !showResources) {
    return (
      <VirtualCareInterstitial
        virtualCareUrl={virtualCareUrl}
        bullets={virtualCareBullets}
        onShowOther={() => {
          track('virtual_care_skip')
          setShowResources(true)
        }}
      />
    )
  }

  const rawResources = Array.isArray(data.resources) ? data.resources : []

  const resources = userLoc
    ? attachMilesFromFsq<TriageResource>(rawResources, userLoc, { sort: true })
    : rawResources

  // Subtitle under the traffic light — explains how results are ordered.
  const sortSubtitle = userLoc
    ? locale === 'es'
      ? 'Ordenado por cercanía a su ubicación.'
      : 'Sorted by how close to you.'
    : locale === 'es'
    ? 'Comparta su ubicación para ver los más cercanos.'
    : 'Share your location to see the closest.'

  return (
    <div className="px-5 py-5 max-w-[440px] mx-auto">
      <TrafficLight
        urgencyLevel={data.urgencyLevel}
        subtitle={data.urgencyLevel?.timeToCare}
      />

      <h1 className="font-display text-[20px] font-semibold mb-1 text-[var(--ink)] leading-tight">
        {data.actionText || t('heading')}
      </h1>
      <p className="text-[13px] text-[var(--ink-3)] mb-4">{sortSubtitle}</p>

      {!userLoc && resources.some((r) => r.address?.latitude && r.address?.longitude) && (
        <div className="mb-4">
          <LocationPrompt onLocate={setUserLoc} />
        </div>
      )}

      <div className="flex flex-col gap-2.5 mb-5">
        {resources.map((r, i) => (
          <ResourceCard
            key={r.id ?? i}
            resource={r}
            distanceLabel={
              'distanceMiles' in r && typeof r.distanceMiles === 'number'
                ? formatDistance(r.distanceMiles)
                : undefined
            }
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <PrimaryButton
          tone="coral"
          href={`${eligibilityUrl}?utm_source=triage&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('eligibility_click')}
        >
          {t('eligibility')}
        </PrimaryButton>
        <GhostButton
          onClick={() => {
            track('start_over')
            try {
              sessionStorage.removeItem(SESSION_KEYS.triageResult)
              sessionStorage.removeItem('triageInputs')
              sessionStorage.removeItem(SESSION_KEYS.userLocation)
              sessionStorage.removeItem(SESSION_KEYS.emergencyScreen)
            } catch {
              // non-fatal
            }
            router.push(`/${locale}`)
          }}
        >
          {t('startOver')}
        </GhostButton>
      </div>
    </div>
  )
}
