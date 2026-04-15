'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { lookupZipAnywhere } from '@/lib/distance'

interface Props {
  onLocate: (loc: { lat: number; lon: number; source: 'gps' | 'zip' }) => void
}

export function LocationPrompt({ onLocate }: Props) {
  const t = useTranslations('location')
  const [mode, setMode] = useState<'idle' | 'requesting' | 'zip' | 'zipLookingUp' | 'error'>('idle')
  const [zip, setZip] = useState('')
  const [zipError, setZipError] = useState<string | null>(null)

  function tryGeolocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setMode('zip')
      return
    }
    setMode('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocate({ lat: pos.coords.latitude, lon: pos.coords.longitude, source: 'gps' })
      },
      () => {
        // permission denied or error → fall back to ZIP
        setMode('zip')
      },
      { timeout: 8000, maximumAge: 60000 },
    )
  }

  async function submitZip(e: React.FormEvent) {
    e.preventDefault()
    setZipError(null)
    if (!/^\d{5}$/.test(zip)) {
      setZipError(t('zipInvalid'))
      return
    }
    setMode('zipLookingUp')
    const result = await lookupZipAnywhere(zip)
    if (!result) {
      setMode('zip')
      setZipError(t('zipNotFound'))
      return
    }
    onLocate({ lat: result.lat, lon: result.lon, source: 'zip' })
  }

  if (mode === 'requesting') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 text-sm text-blue-900 dark:text-blue-100"
      >
        {t('locating')}
      </div>
    )
  }

  if (mode === 'zipLookingUp') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 text-sm text-blue-900 dark:text-blue-100"
      >
        {t('zipLookingUp')}
      </div>
    )
  }

  if (mode === 'zip') {
    return (
      <form onSubmit={submitZip} className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
        <label className="block font-medium mb-2 text-sm text-blue-900 dark:text-blue-100">{t('zipPrompt')}</label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
            placeholder="23510"
            className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-lg min-h-[48px]"
            aria-label={t('zipPrompt')}
          />
          <button
            type="submit"
            disabled={zip.length !== 5}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg font-bold min-h-[48px] disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {t('zipSubmit')}
          </button>
        </div>
        {zipError && <p className="text-red-700 dark:text-red-300 text-sm mt-2">{zipError}</p>}
      </form>
    )
  }

  return (
    <button
      onClick={tryGeolocation}
      className="w-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl p-3 mb-4 text-blue-900 dark:text-blue-100 font-medium text-sm min-h-[48px] flex items-center justify-center gap-2"
    >
      📍 {t('findClosest')}
    </button>
  )
}
