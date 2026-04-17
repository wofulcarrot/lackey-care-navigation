'use client'

/**
 * Intermediate screen between triage and results when the urgency level is
 * Urgent. Collects the patient's location (GPS or ZIP), calls the
 * /api/triage/nearby-urgent-cares endpoint to search Foursquare, and
 * replaces the resources in the stored triage result with real-world
 * nearby urgent cares within 10 miles.
 *
 * Falls back to the seeded resources if:
 *   - No result is in sessionStorage (deep link)
 *   - The urgency is not Urgent (user arrived here directly)
 *   - Patient skips the location prompt
 *   - The Foursquare proxy returns fallback=true
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LocationPrompt } from '@/components/LocationPrompt'
import { ErrorFallback } from '@/components/ErrorFallback'
import { track } from '@/lib/tracker'
import type { TriageResult } from '@/lib/types'
import { SESSION_KEYS, isUrgentLevel } from '@/lib/constants'

interface Props {
  locale: string
}

export function LocationScreenClient({ locale }: Props) {
  const router = useRouter()
  const t = useTranslations('locationScreen')
  const tLoc = useTranslations('location')
  const [status, setStatus] = useState<'idle' | 'searching' | 'error'>('idle')
  const [result, setResult] = useState<TriageResult | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Load the cached triage result. If missing or not Urgent, gracefully
  // redirect to results so the patient isn't stuck.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEYS.triageResult)
      if (!stored) {
        router.replace(`/${locale}/results?fallback=true`)
        return
      }
      const parsed = JSON.parse(stored) as TriageResult
      // Only the Urgent tier triggers this flow; everything else passes
      // through to normal results. Match on the urgency level name rather
      // than a hardcoded scoreThreshold so admins can tune thresholds in
      // the CMS without breaking the Foursquare routing flow. The API
      // returns the localized name, so we accept both English ("Urgent")
      // and Spanish ("Urgente").
      const urgencyName = parsed.urgencyLevel?.name
      if (!isUrgentLevel(urgencyName)) {
        router.replace(`/${locale}/results`)
        return
      }
      setResult(parsed)
      setHydrated(true)
    } catch {
      router.replace(`/${locale}/results?fallback=true`)
    }
  }, [locale, router])

  async function handleLocate(loc: { lat: number; lon: number; source: 'gps' | 'zip' }) {
    if (!result) return
    track('location_shared')
    setStatus('searching')

    // Persist the patient's coordinates so the results page can display
    // distances immediately without asking for location a second time.
    try {
      sessionStorage.setItem(SESSION_KEYS.userLocation, JSON.stringify({ lat: loc.lat, lon: loc.lon }))
    } catch { /* non-fatal */ }

    try {
      const res = await fetch('/api/triage/nearby-urgent-cares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: loc.lat, lon: loc.lon, radiusMiles: 10 }),
      })
      const data = await res.json().catch(() => ({}))

      // The patient went out of their way to share their location for in-
      // person urgent care, so skip the Virtual Care interstitial on the
      // results page — they want a clinic, not a video visit. Lackey Virtual
      // Care is still preserved at the bottom of the resource list as a
      // backup option.
      const baseResult: TriageResult = { ...result, virtualCareEligible: false }

      // If we got real Foursquare results, replace the seeded urgent cares.
      // Otherwise fall through with the existing seeded list.
      let nextResult = baseResult
      if (Array.isArray(data.resources) && data.resources.length > 0 && !data.fallback) {
        // Preserve any virtual-care / phone-only resources from the original
        // result (Lackey Virtual Care, Crisis Line) and put them after the
        // nearby urgent cares.
        const preservedNonUrgent = result.resources.filter(
          (r) => r.type && r.type !== 'urgent_care',
        )
        nextResult = {
          ...baseResult,
          resources: [...data.resources, ...preservedNonUrgent],
        }
      }
      sessionStorage.setItem(SESSION_KEYS.triageResult, JSON.stringify(nextResult))

      // In all paths (success, empty, or fallback) we proceed to results
      // with a non-empty list — either the freshly fetched or the seeded one.
      router.push(`/${locale}/results`)
    } catch {
      // Network failure → save the result with virtualCareEligible=false so
      // the patient still lands on the resource list (not the interstitial),
      // even though we couldn't swap in Foursquare data. Seeded urgent cares
      // are kept.
      const fallbackResult: TriageResult = { ...result, virtualCareEligible: false }
      sessionStorage.setItem(SESSION_KEYS.triageResult, JSON.stringify(fallbackResult))
      router.push(`/${locale}/results`)
    }
  }

  function handleSkip() {
    track('location_skipped')
    // Patient declined to share location but they're still in the Urgent
    // flow — they need to see the urgent-care resource list directly, not
    // the Virtual Care interstitial. Keep the seeded urgent cares; just
    // disable the interstitial gate.
    if (result) {
      const nextResult: TriageResult = { ...result, virtualCareEligible: false }
      sessionStorage.setItem(SESSION_KEYS.triageResult, JSON.stringify(nextResult))
    }
    router.push(`/${locale}/results`)
  }

  if (!hydrated) {
    return (
      <div className="px-4 py-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-4" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6 mb-8" />
        <div className="h-14 bg-blue-100 dark:bg-blue-950/40 rounded-xl" />
      </div>
    )
  }

  if (!result) {
    return <ErrorFallback />
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <span
          className="inline-block px-3 py-1 rounded-full text-sm font-bold mb-2 text-gray-900"
          style={{ backgroundColor: result.urgencyLevel?.color ?? '#FEF9C3' }}
        >
          {result.urgencyLevel?.name}
        </span>
        {result.urgencyLevel?.timeToCare && (
          <p className="text-gray-600 dark:text-gray-400">Expected: {result.urgencyLevel.timeToCare}</p>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-3 leading-tight text-gray-900 dark:text-gray-100">{t('heading')}</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-6">{t('body')}</p>

      {status === 'searching' ? (
        <div
          role="status"
          aria-live="polite"
          className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 text-sm text-blue-900 dark:text-blue-100"
        >
          {t('searching')}
        </div>
      ) : (
        <>
          <LocationPrompt onLocate={handleLocate} />

          <button
            onClick={handleSkip}
            className="w-full bg-gray-100 dark:bg-gray-800 dark:text-gray-100 text-gray-700 py-3 rounded-xl text-sm font-medium min-h-[48px] mt-2"
          >
            {t('skip')}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
            {t('privacyNote')}
          </p>
        </>
      )}

      {/* Include the tLoc hook so it's flagged as used for i18n tooling */}
      <span className="sr-only">{tLoc('findClosest')}</span>
    </div>
  )
}
