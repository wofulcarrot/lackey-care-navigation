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
import { GhostButton } from '@/components/ui/Button'
import { track } from '@/lib/tracker'
import type { TriageResult } from '@/lib/types'
import { SESSION_KEYS, isUrgentLevel } from '@/lib/constants'

interface Props {
  locale: string
}

export function LocationScreenClient({ locale }: Props) {
  const router = useRouter()
  const t = useTranslations('locationScreen')
  const [status, setStatus] = useState<'idle' | 'searching' | 'error'>('idle')
  const [result, setResult] = useState<TriageResult | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEYS.triageResult)
      if (!stored) {
        router.replace(`/${locale}/results?fallback=true`)
        return
      }
      const parsed = JSON.parse(stored) as TriageResult
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

    try {
      sessionStorage.setItem(
        SESSION_KEYS.userLocation,
        JSON.stringify({ lat: loc.lat, lon: loc.lon }),
      )
    } catch { /* non-fatal */ }

    try {
      const res = await fetch('/api/triage/nearby-urgent-cares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: loc.lat, lon: loc.lon, radiusMiles: 10 }),
      })
      const data = await res.json().catch(() => ({}))

      const baseResult: TriageResult = { ...result, virtualCareEligible: false }

      let nextResult = baseResult
      if (Array.isArray(data.resources) && data.resources.length > 0 && !data.fallback) {
        const preservedNonUrgent = result.resources.filter(
          (r) => r.type && r.type !== 'urgent_care',
        )
        nextResult = {
          ...baseResult,
          resources: [...data.resources, ...preservedNonUrgent],
        }
      }
      sessionStorage.setItem(SESSION_KEYS.triageResult, JSON.stringify(nextResult))
      router.push(`/${locale}/results`)
    } catch {
      const fallbackResult: TriageResult = { ...result, virtualCareEligible: false }
      sessionStorage.setItem(SESSION_KEYS.triageResult, JSON.stringify(fallbackResult))
      router.push(`/${locale}/results`)
    }
  }

  function handleSkip() {
    track('location_skipped')
    if (result) {
      const nextResult: TriageResult = { ...result, virtualCareEligible: false }
      sessionStorage.setItem(SESSION_KEYS.triageResult, JSON.stringify(nextResult))
    }
    router.push(`/${locale}/results`)
  }

  if (!hydrated) {
    return (
      <div className="px-5 py-5 animate-pulse max-w-[440px] mx-auto">
        <div className="h-6 bg-[var(--surface-2)] rounded w-2/3 mb-4" />
        <div className="h-4 bg-[var(--surface-2)] rounded w-5/6 mb-8" />
        <div className="h-14 bg-[var(--accent-primary-soft)] rounded-xl" />
      </div>
    )
  }

  if (!result) return <ErrorFallback />

  return (
    <div className="px-5 py-5 max-w-[440px] mx-auto">
      <div className="mb-4">
        <span
          className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide mb-3 bg-[var(--urgent-yellow-soft)] text-[var(--urgent-yellow-ink)]"
        >
          {result.urgencyLevel?.name}
        </span>
        <h1 className="font-display text-[24px] leading-tight font-semibold mb-2 text-[var(--ink)]">
          {t('heading')}
        </h1>
        <p className="text-[14px] text-[var(--ink-2)]">{t('body')}</p>
      </div>

      {status === 'searching' ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border-2 border-[var(--accent-primary)]/30 bg-[var(--accent-primary-soft)] p-5 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] animate-spin" />
          <p className="text-[var(--ink)] font-medium">{t('searching')}</p>
        </div>
      ) : (
        <>
          <LocationPrompt onLocate={handleLocate} />
          <GhostButton onClick={handleSkip}>{t('skip')}</GhostButton>
          <p className="text-[11px] text-[var(--ink-3)] mt-4 leading-relaxed">
            {t('privacyNote')}
          </p>
        </>
      )}
    </div>
  )
}
