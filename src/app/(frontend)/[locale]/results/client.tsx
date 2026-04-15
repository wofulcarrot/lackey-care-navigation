'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import DOMPurify from 'dompurify'
import { ResourceCard } from '@/components/ResourceCard'
import { VirtualCareInterstitial } from '@/components/VirtualCareInterstitial'
import { ErrorFallback } from '@/components/ErrorFallback'
import { LocationPrompt } from '@/components/LocationPrompt'
import { distanceMiles, formatDistance } from '@/lib/distance'

/**
 * Hardened DOMPurify config for admin-authored nextSteps rich text.
 *
 * Allows ONLY: paragraphs, line breaks, basic emphasis, lists, h3/h4 headings, links.
 * Forbids ALL inline styles, scripts, iframes, embeds, forms, and event handler attributes.
 * URI scheme allowlist blocks `javascript:`, `data:`, `vbscript:` URLs on links.
 *
 * Manual QA test cases (should all be neutralized):
 *   <script>alert(1)</script>                  -> stripped (FORBID_TAGS + default)
 *   <a href="javascript:alert(1)">click</a>    -> href stripped (ALLOWED_URI_REGEXP)
 *   <img src=x onerror=alert(1)>               -> tag stripped (not in ALLOWED_TAGS)
 *   <iframe src="evil">                        -> stripped (FORBID_TAGS)
 *   <p onclick="alert(1)">hi</p>               -> onclick stripped (FORBID_ATTR)
 */
const CLEAN_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'h3', 'h4', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  // Reject all JavaScript URLs explicitly
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
  KEEP_CONTENT: true,
  ALLOW_DATA_ATTR: false,
}

// Link hardening: force target="_blank" and rel="noopener noreferrer" on every
// sanitized <a>. DOMPurify.addHook is global state; guard with a module-level
// flag so repeated imports/HMR don't register duplicate hooks.
let __lackeyDomPurifyHookRegistered = false
if (typeof window !== 'undefined' && !__lackeyDomPurifyHookRegistered) {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if ((node as Element).tagName === 'A') {
      ;(node as Element).setAttribute('target', '_blank')
      ;(node as Element).setAttribute('rel', 'noopener noreferrer')
    }
  })
  __lackeyDomPurifyHookRegistered = true
}

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
  hours?: { day: string; open: string; close: string }[]
  cost?: string
  eligibility?: string
  temporaryNotice?: string
  description?: string
  is24_7?: boolean
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
  nextSteps?: string
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
    try {
      const stored = sessionStorage.getItem('triageResult')
      if (stored) {
        setData(JSON.parse(stored) as TriageResult)
        // NOTE: we intentionally do NOT removeItem here. The component
        // remounts when the user toggles locale (EN ↔ ES), and losing the
        // stored result would dump them into the ErrorFallback. The item
        // is cleared explicitly on Start Over and by landing page.
      }
    } catch {
      // fall through to ErrorFallback below
    }
    setHydrated(true)
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
        onShowOther={() => setShowResources(true)}
      />
    )
  }

  const rawResources = Array.isArray(data.resources) ? data.resources : []

  // Compute distances if user shared location, then sort nearest first.
  // Resources without coordinates (e.g., virtual care, crisis lines) sort last.
  const resources = userLoc
    ? [...rawResources]
        .map((r) => {
          const lat = r.address?.latitude
          const lon = r.address?.longitude
          const d = typeof lat === 'number' && typeof lon === 'number'
            ? distanceMiles(userLoc.lat, userLoc.lon, lat, lon)
            : undefined
          return { ...r, distanceMiles: d }
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

      {data.nextSteps && (
        <div className="prose dark:prose-invert mb-8 text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.nextSteps, CLEAN_CONFIG) }} />
      )}

      <div className="flex flex-col gap-4">
        <a
          href={`${eligibilityUrl}?utm_source=triage&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]"
        >
          {t('eligibility')}
        </a>
        <button
          onClick={() => {
            // Clear stored triage data and the emergency-screen flow flag
            // so the next run starts clean from the landing page.
            try {
              sessionStorage.removeItem('triageResult')
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
