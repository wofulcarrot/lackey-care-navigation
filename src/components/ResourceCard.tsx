'use client'

import { useTranslations } from 'next-intl'
import { track } from '@/lib/tracker'
import type { TriageResource } from '@/lib/types'

interface Props {
  resource: TriageResource
  distanceLabel?: string
}

/**
 * Individual resource card — provider name, distance chip, description,
 * cost tag (free / sliding / insurance), 24/7 tag, address, call button,
 * directions button, website button, and eligibility footnote.
 *
 * Design choices:
 *  - Distance chip in the top-right uses the coral accent so it pops.
 *  - Cost chip is color-coded: green for free, yellow for sliding scale,
 *    muted for insurance-required. This gives patients an instant
 *    affordability scan without reading the eligibility footnote.
 *  - Primary CTA is the phone number as a colored pill; directions is a
 *    muted secondary button. This emphasizes that patients should CALL
 *    AHEAD before driving to urgent care.
 */
export function ResourceCard({ resource, distanceLabel }: Props) {
  const t = useTranslations('results')
  const addr = resource.address
  const parts = addr
    ? [addr.street, addr.city, [addr.state, addr.zip].filter(Boolean).join(' ')].filter(Boolean)
    : []
  const addressStr = parts.join(', ')
  const mapsUrl = addressStr
    ? `https://maps.google.com/?q=${encodeURIComponent(addressStr)}`
    : null

  const costTone =
    resource.cost === 'free'
      ? 'bg-[var(--accent-sage-soft)] text-[var(--accent-sage-ink)]'
      : resource.cost === 'sliding_scale'
      ? 'bg-[var(--urgent-yellow-soft)] text-[var(--urgent-yellow-ink)]'
      : 'bg-[var(--surface-2)] text-[var(--ink-2)]'

  const costLabel =
    resource.cost === 'free'
      ? 'Free'
      : resource.cost === 'sliding_scale'
      ? 'Sliding Scale'
      : resource.cost
      ? 'Insurance'
      : null

  return (
    <div className="rounded-2xl border-2 border-[var(--stroke)] bg-[var(--surface-1)] p-4">
      {resource.temporaryNotice && (
        <div className="bg-[var(--urgent-yellow-soft)] border border-[var(--urgent-yellow)]/30 rounded-lg p-2 mb-3 text-sm font-medium text-[var(--urgent-yellow-ink)]">
          ⚠ {resource.temporaryNotice}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-display font-semibold text-[16px] text-[var(--ink)] leading-tight">
          {resource.name}
        </h3>
        {distanceLabel && (
          <span className="shrink-0 text-[12px] font-semibold text-[var(--accent-primary)] bg-[var(--accent-primary-soft)] px-2 py-0.5 rounded-full whitespace-nowrap">
            {distanceLabel}
          </span>
        )}
      </div>

      {resource.description && (
        <p className="text-[13px] text-[var(--ink-2)] mb-3 leading-snug">
          {resource.description}
        </p>
      )}

      {(costLabel || resource.is24_7) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {costLabel && (
            <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${costTone}`}>
              {costLabel}
            </span>
          )}
          {resource.is24_7 && (
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-[var(--accent-sage-soft)] text-[var(--accent-sage-ink)]">
              Open 24/7
            </span>
          )}
        </div>
      )}

      {addressStr && (
        <p className="text-[12px] text-[var(--ink-3)] mb-3">{addressStr}</p>
      )}

      <div className="flex gap-2">
        {resource.phone && (
          <a
            href={`tel:${resource.phone.replace(/\D/g, '')}`}
            onClick={() => track('resource_call', { resourceName: resource.name })}
            className="flex-1 flex items-center justify-center gap-2 bg-[var(--accent-primary)] text-white rounded-xl py-3 font-semibold text-[13px] min-h-[44px]"
          >
            📞 {t('call')}
          </a>
        )}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('resource_directions', { resourceName: resource.name })}
            className="flex-1 flex items-center justify-center gap-2 bg-[var(--surface-2)] text-[var(--ink)] rounded-xl py-3 font-semibold text-[13px] min-h-[44px]"
          >
            📍 {t('getDirections')}
          </a>
        )}
      </div>

      {resource.website && (
        <a
          href={resource.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('resource_website', { resourceName: resource.name })}
          className="mt-2 flex items-center justify-center gap-2 bg-[var(--surface-2)] text-[var(--ink)] rounded-xl py-2.5 font-semibold text-[12px] min-h-[40px]"
        >
          🌐 Website
        </a>
      )}

      {resource.eligibility && (
        <p className="text-[11px] text-[var(--ink-3)] mt-3 pt-3 border-t border-[var(--stroke)]">
          ℹ️ {resource.eligibility}
        </p>
      )}
    </div>
  )
}
