'use client'

import { useTranslations } from 'next-intl'

interface Resource {
  name: string
  type: string
  address?: { street?: string; city?: string; state?: string; zip?: string }
  phone?: string
  is24_7?: boolean
  hours?: { day: string; open: string; close: string }[]
  cost?: string
  description?: string
  temporaryNotice?: string
}

export function ResourceCard({ resource }: { resource: Resource }) {
  const t = useTranslations('results')
  const addr = resource.address
  const addressStr = addr ? `${addr.street ?? ''}, ${addr.city ?? ''}, ${addr.state ?? ''} ${addr.zip ?? ''}`.trim() : ''
  const mapsUrl = addressStr
    ? `https://maps.google.com/?q=${encodeURIComponent(addressStr)}`
    : null

  return (
    <div className="border-2 border-gray-200 rounded-xl p-4 bg-white">
      {resource.temporaryNotice && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2 mb-3 text-sm font-medium text-yellow-800">
          ⚠ {resource.temporaryNotice}
        </div>
      )}
      <h3 className="font-bold text-lg mb-1">{resource.name}</h3>
      {resource.description && <p className="text-gray-600 text-sm mb-3">{resource.description}</p>}
      <div className="flex flex-col gap-2">
        {resource.phone && (
          <a href={`tel:${resource.phone}`} className="flex items-center gap-2 text-blue-600 font-bold min-h-[48px]">
            📞 {t('call')} {resource.phone}
          </a>
        )}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 min-h-[48px]">
            📍 {t('getDirections')}
          </a>
        )}
        {resource.is24_7 && <span className="text-green-700 font-medium">Open 24/7</span>}
        {resource.cost && (
          <span className="inline-block bg-green-100 text-green-800 text-sm px-2 py-1 rounded">
            {resource.cost === 'free' ? 'Free' : resource.cost === 'sliding_scale' ? 'Sliding Scale' : 'Insurance Required'}
          </span>
        )}
      </div>
    </div>
  )
}
