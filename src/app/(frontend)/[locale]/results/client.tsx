'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ResourceCard } from '@/components/ResourceCard'
import { VirtualCareInterstitial } from '@/components/VirtualCareInterstitial'
import { ErrorFallback } from '@/components/ErrorFallback'
import { LocationPrompt } from '@/components/LocationPrompt'
import { distanceMiles, formatDistance } from '@/lib/distance'
import { track } from '@/lib/tracker'

interface ResourceAddress {
  street?: string
  city?: string
  state?: string
  zip?: string
  latitude?: number
  longitude?: number
}

interface TriageResource {
  id: string
  name: string
  type: string
  address?: ResourceAddress
  phone?: string
  website?: string
  hours?: { day: string; open: string; close: string }[]
  cost?: string
  eligibility?: string
  temporaryNotice?: string
  description?: string
  is24_7?: boolean
  distanceMiles?: number
  distanceMeters?: number
}

interface TriageResult {
  escalate: boolean
  urgencyLevel?: {
    id: string
    name: string
    color: string
    scoreThreshold: number
    timeToCare?: string
  }
  resources: TriageResource[]
  virtualCareEligible?: boolean
  actionText?: string
  fallback?: boolean
}

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
  const [data, setData] = useState<TriageResult | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number; source: 'gps' | 'zip' } | null>(null)

  const isFallback = searchParams.get('fallback') === 'true'

  useEffect(() => {
    if (isFallback) {
      setHydrated(true)
      return
    }

    // If the patient completed triage in one locale and then toggled to
    // another, the stored result has localized data in the wrong language.
    // Re-fetch from the API with the current locale to fix the mismatch.
    async function loadResult() {
      try {
        const storedInputs = sessionStorage.getItem('triageInputs')
        const stored = sessionStorage.getItem('triageResult')

        if (storedInputs) {
          // Re-evaluate with the current page locale so all content
          // (urgency names, action text, resource descriptions) matches.
          const inputs = JSON.parse(storedInputs)
          const res = await fetch('/api/triage/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...inputs, locale }),
          })
          if (res.ok) {
            const freshData = await res.json()
            setData(freshData as TriageResult)
            sessionStorage.setItem('triageResult', JSON.stringify(freshData))
          } else if (stored) {
            // API failed — fall back to cached result
            setData(JSON.parse(stored) as TriageResult)
          }
        } else if (stored) {
          // No inputs saved (older session) — use cached result as-is
          setData(JSON.parse(stored) as TriageResult)
        }
      } catch {
        // fall through to ErrorFallback below
      }
    }
    loadResult()

    // Auto-populate location from the /location screen. If the patient
    // already shared their GPS/ZIP there, distances show immediately on
    // the results page without asking again.
    try {
      const storedLoc = sessionStorage.getItem('triageUserLocation')
      if (storedLoc) {
        const loc = JSON.parse(storedLoc)
        if (typeof loc.lat === 'number' && typeof loc.lon === 'number') {
          setUserLoc({ lat: loc.lat, lon: loc.lon, source: 'gps' })
        }
      }
    } catch {
      // non-fatal — user just won't see distances auto-populated
    }

    setHydrated(true)
    track('results_view')
  }, [isFallback])

  if (!hydrated) {
    return (
      <div className="px-4 py-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-5 bg-gray-100 rounded w-1/4 mb-6" />
        <div className="h-7 bg-gray-200 rounded w-2/3 mb-4" />
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

  // Compute distances if user shared location, then sort nearest first.
  // For Foursquare-sourced resources, prefer the API's pre-computed
  // distanceMeters (more accurate). For seeded resources, compute via
  // Haversine. Resources without coordinates sort last.
  const resources = userLoc
    ? [...rawResources]
        .map((r) => {
          // Use Foursquare's pre-computed distance if available
          const fsqDist = typeof (r as any).distanceMeters === 'number'
            ? (r as any).distanceMeters / 1609.34 // meters → miles
            : undefined
          const lat = r.address?.latitude
          const lon = r.address?.longitude
          const haversineDist = typeof lat === 'number' && typeof lon === 'number'
            ? distanceMiles(userLoc.lat, userLoc.lon, lat, lon)
            : undefined
          return { ...r, distanceMiles: fsqDist ?? haversineDist }
        })
        .sort((a, b) => {
          if (a.distanceMiles == null && b.distanceMiles == null) return 0
          if (a.distanceMiles == null) return 1
          if (b.distanceMiles == null) return -1
          return a.distanceMiles - b.distanceMiles
        })
    : rawResources

  return (
    <div className="px-4 py-6">
      {data.urgencyLevel && (
        <div className="mb-6">
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-2 text-gray-900"
            style={{ backgroundColor: data.urgencyLevel.color }}
          >
            {data.urgencyLevel.name}
          </span>
          {data.urgencyLevel.timeToCare && (
            <p className="text-gray-600 dark:text-gray-400">Expected: {data.urgencyLevel.timeToCare}</p>
          )}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t('heading')}</h1>

      {data.actionText && (
        <p className="text-lg font-medium mb-6 text-gray-800 dark:text-gray-200">{data.actionText}</p>
      )}

      {!userLoc && resources.some((r) => r.address?.latitude && r.address?.longitude) && (
        <LocationPrompt onLocate={setUserLoc} />
      )}

      <div className="flex flex-col gap-4 mb-8">
        {resources.map((r, i) => (
          <ResourceCard
            key={r.id ?? i}
            resource={r}
            distanceLabel={r.distanceMiles != null ? formatDistance(r.distanceMiles) : undefined}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <a
          href={`${eligibilityUrl}?utm_source=triage&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('eligibility_click')}
          className="block w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]"
        >
          {t('eligibility')}
        </a>
        <button
          onClick={() => {
            track('start_over')
            // Clear stored triage data and the emergency-screen flow flag
            // so the next run starts clean from the landing page.
            try {
              sessionStorage.removeItem('triageResult')
              sessionStorage.removeItem('triageInputs')
              sessionStorage.removeItem('triageUserLocation')
              sessionStorage.removeItem('emergencyScreenCompleted')
            } catch {
              // non-fatal
            }
            router.push(`/${locale}`)
          }}
          className="block w-full bg-gray-100 dark:bg-gray-800 dark:text-gray-100 text-gray-700 text-center py-4 rounded-xl text-lg font-medium min-h-[48px]"
        >
          {t('startOver')}
        </button>
      </div>
    </div>
  )
}
