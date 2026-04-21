'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { lookupZipAnywhere } from '@/lib/distance'

interface Props {
  onLocate: (loc: { lat: number; lon: number; source: 'gps' | 'zip' }) => void
}

/**
 * Geolocation prompt with a big "Find closest to me" GPS button AND a
 * ZIP-code fallback side by side. The design deliberately shows BOTH
 * options together rather than revealing ZIP only on denial — some
 * patients know their ZIP and don't want to grant location permission.
 */
export function LocationPrompt({ onLocate }: Props) {
  const t = useTranslations('location')
  const [mode, setMode] = useState<'idle' | 'requesting' | 'zipLookingUp' | 'error'>('idle')
  const [zip, setZip] = useState('')
  const [zipError, setZipError] = useState<string | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)

  function tryGeolocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError(t('locating'))
      return
    }
    setMode('requesting')
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMode('idle')
        onLocate({ lat: pos.coords.latitude, lon: pos.coords.longitude, source: 'gps' })
      },
      () => {
        setMode('idle')
        setGpsError(t('locating'))
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
    setMode('idle')
    if (!result) {
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
        className="rounded-2xl border-2 border-[var(--accent-primary)]/30 bg-[var(--accent-primary-soft)] p-5 text-center mb-3"
      >
        <div className="w-10 h-10 mx-auto mb-2 rounded-full border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] animate-spin" />
        <p className="text-[var(--ink)] font-medium">{t('locating')}</p>
      </div>
    )
  }

  if (mode === 'zipLookingUp') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border-2 border-[var(--accent-primary)]/30 bg-[var(--accent-primary-soft)] p-5 text-center mb-3"
      >
        <div className="w-10 h-10 mx-auto mb-2 rounded-full border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] animate-spin" />
        <p className="text-[var(--ink)] font-medium">{t('zipLookingUp')}</p>
      </div>
    )
  }

  return (
    <>
      {/* GPS option — primary, big, coral-tinted */}
      <button
        onClick={tryGeolocation}
        className="w-full rounded-2xl p-5 mb-3 bg-[var(--accent-primary-soft)] border-2 border-[var(--accent-primary)]/20 hover:border-[var(--accent-primary)] transition text-left flex items-center gap-4 min-h-[72px]"
      >
        <div
          className="w-12 h-12 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-xl shrink-0"
          aria-hidden="true"
        >
          📍
        </div>
        <div className="flex-1">
          <div className="font-semibold text-[17px] text-[var(--ink)]">
            {t('findClosest')}
          </div>
        </div>
      </button>

      {gpsError && (
        <div className="rounded-xl border border-[var(--urgent-red)]/30 bg-[var(--urgent-red-soft)] text-[var(--urgent-red)] text-[13px] px-3 py-2.5 mb-3">
          {gpsError}
        </div>
      )}

      {/* ZIP fallback — muted card below */}
      <form
        onSubmit={submitZip}
        className="rounded-2xl border-2 border-[var(--stroke)] bg-[var(--surface-1)] p-4 mb-3"
      >
        <label className="block text-[12px] font-semibold text-[var(--ink-2)] mb-2 uppercase tracking-wide">
          {t('zipPrompt')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
            placeholder="23510"
            aria-label={t('zipPrompt')}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--stroke)] bg-[var(--surface-0)] text-[var(--ink)] text-[17px] min-h-[48px] focus:outline-none focus:border-[var(--accent-primary)]"
          />
          <button
            type="submit"
            disabled={zip.length !== 5}
            className="px-5 rounded-xl bg-[var(--accent-primary)] text-white font-bold min-h-[48px] disabled:bg-[var(--stroke)] disabled:text-[var(--ink-3)]"
          >
            {t('zipSubmit')}
          </button>
        </div>
        {zipError && (
          <p className="text-[var(--urgent-red)] text-[13px] mt-2">{zipError}</p>
        )}
      </form>
    </>
  )
}
