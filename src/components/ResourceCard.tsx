'use client'

import { useTranslations } from 'next-intl'
import { track } from '@/lib/tracker'
import type { TriageResource } from '@/lib/types'

export function ResourceCard({ resource, distanceLabel }: { resource: TriageResource; distanceLabel?: string }) {
  const t = useTranslations('results')
  const addr = resource.address
  const addressStr = addr ? `${addr.street ?? ''}, ${addr.city ?? ''}, ${addr.state ?? ''} ${addr.zip ?? ''}`.trim() : ''
  const mapsUrl = addressStr
    ? `https://maps.google.com/?q=${encodeURIComponent(addressStr)}`
    : null

  return (
    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900">
      {resource.temporaryNotice && (
        <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-300 dark:border-yellow-700 rounded-lg p-2 mb-3 text-sm font-medium text-yellow-800 dark:text-yellow-200">
          ⚠ {resource.temporaryNotice}
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{resource.name}</h3>
        {distanceLabel && (
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded whitespace-nowrap">
            {distanceLabel}
          </span>
        )}
      </div>
      {resource.description && <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{resource.description}</p>}
      <div className="flex flex-col gap-2">
        {resource.phone && (
          <a href={`tel:${resource.phone}`} onClick={() => track('resource_call', { resourceName: resource.name })} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold min-h-[48px]">
            📞 {t('call')} {resource.phone}
          </a>
        )}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('resource_directions', { resourceName: resource.name })} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 min-h-[48px]">
            📍 {t('getDirections')}
          </a>
        )}
        {resource.website && (
          <a href={resource.website} target="_blank" rel="noopener noreferrer" onClick={() => track('resource_website', { resourceName: resource.name })} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 min-h-[48px]">
            🌐 Website
          </a>
        )}
        {resource.is24_7 && <span className="text-green-700 dark:text-green-400 font-medium">Open 24/7</span>}
        {resource.cost && (
          <span className="inline-block bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-sm px-2 py-1 rounded">
            {resource.cost === 'free' ? 'Free' : resource.cost === 'sliding_scale' ? 'Sliding Scale' : 'Insurance Required'}
          </span>
        )}
        {resource.eligibility && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {resource.eligibility}
          </p>
        )}
      </div>
    </div>
  )
}
