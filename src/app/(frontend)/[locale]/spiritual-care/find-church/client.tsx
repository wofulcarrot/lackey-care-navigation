'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { GhostButton } from '@/components/ui/Button'
import { attachMilesFromFsq, formatDistance, lookupZipAnywhere } from '@/lib/distance'

interface ChurchResult {
  id: string
  name: string
  address?: { street?: string; city?: string; state?: string; zip?: string; latitude?: number; longitude?: number }
  phone?: string
  website?: string
  distanceMeters?: number
  distanceMiles?: number
}

// Status machine for the church search flow. The invalidZip state
// lets us show "please enter a 5-digit ZIP" without a separate `error`
// string — each terminal state uniquely determines what the user sees.
type SearchStatus =
  | 'idle'
  | 'invalidZip'
  | 'lookingUp'
  | 'searching'
  | 'results'
  | 'noResults'
  | 'error'

export function FindChurchClient({ locale }: { locale: string }) {
  const t = useTranslations('spiritualCare')
  const [zip, setZip] = useState('')
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [results, setResults] = useState<ChurchResult[]>([])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{5}$/.test(zip)) {
      setStatus('invalidZip')
      return
    }
    setStatus('lookingUp')
    const coords = await lookupZipAnywhere(zip)
    if (!coords) {
      setStatus('error')
      return
    }
    setStatus('searching')
    try {
      const res = await fetch('/api/spiritual-care/nearby-churches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: coords.lat, lon: coords.lon, radiusMiles: 10 }),
      })
      const data = await res.json().catch(() => ({}))
      const rows = Array.isArray(data.results) ? (data.results as ChurchResult[]) : []
      const withDist = attachMilesFromFsq(rows, coords, { sort: true })
      setResults(withDist)
      setStatus(withDist.length > 0 ? 'results' : 'noResults')
    } catch {
      setStatus('error')
    }
  }

  function resetSearch() {
    setZip('')
    setResults([])
    setStatus('idle')
  }

  const errorMessage =
    status === 'invalidZip' ? t('requiredField') : status === 'error' ? t('submitError') : null

  return (
    <div className="px-5 py-5 max-w-[440px] mx-auto">
      <Link
        href={`/${locale}/spiritual-care`}
        className="text-[13px] text-[var(--ink-2)] font-medium hover:text-[var(--ink)] inline-block mb-3 min-h-[32px]"
      >
        ← {t('back')}
      </Link>
      <h1 className="font-display text-[24px] leading-tight font-semibold mb-2 text-[var(--ink)]">
        {t('churchHeading')}
      </h1>
      <p className="text-[var(--ink-2)] text-[14px] mb-5">{t('churchBody')}</p>

      {/* ZIP input — always visible, including after results so the user
          can easily search another ZIP. */}
      <form onSubmit={submit} className="flex gap-2 mb-5" noValidate>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
          placeholder="23510"
          aria-label={t('churchZipLabel')}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--stroke)] text-[17px] min-h-[48px] bg-[var(--surface-0)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent-sage)]"
        />
        <button
          type="submit"
          disabled={zip.length !== 5 || status === 'lookingUp' || status === 'searching'}
          className="px-5 rounded-xl bg-[var(--accent-sage)] text-white font-bold min-h-[48px] disabled:bg-[var(--stroke)] disabled:text-[var(--ink-3)]"
        >
          {status === 'lookingUp' || status === 'searching' ? '…' : '→'}
        </button>
      </form>

      {errorMessage && (
        <p className="text-[13px] text-[var(--urgent-red)] bg-[var(--urgent-red-soft)] rounded-xl px-3 py-2 mb-4">
          {errorMessage}
        </p>
      )}

      {(status === 'lookingUp' || status === 'searching') && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border-2 border-[var(--accent-sage)]/30 bg-[var(--accent-sage-soft)] p-5 text-center"
        >
          <div className="w-10 h-10 mx-auto mb-2 rounded-full border-4 border-[var(--accent-sage)]/30 border-t-[var(--accent-sage)] animate-spin" />
          <p className="text-[var(--ink)] font-medium">{t('churchSearching')}</p>
        </div>
      )}

      {status === 'noResults' && (
        <div className="rounded-2xl border-2 border-[var(--stroke)] bg-[var(--surface-1)] p-5 text-center">
          <p className="text-[var(--ink-2)] text-[14px]">{t('churchNoResults')}</p>
          <div className="mt-4">
            <GhostButton onClick={resetSearch}>{t('churchNewSearch')}</GhostButton>
          </div>
        </div>
      )}

      {status === 'results' && (
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <ChurchCard key={r.id} church={r} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChurchCard({ church }: { church: ChurchResult }) {
  const addr = church.address
  const parts = addr
    ? [addr.street, addr.city, [addr.state, addr.zip].filter(Boolean).join(' ')].filter(Boolean)
    : []
  const addressStr = parts.join(', ')
  const mapsUrl = addressStr
    ? `https://maps.google.com/?q=${encodeURIComponent(addressStr)}`
    : null

  return (
    <div className="rounded-2xl border-2 border-[var(--stroke)] bg-[var(--surface-1)] p-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-display font-semibold text-[16px] text-[var(--ink)] leading-tight">
          {church.name}
        </h3>
        {typeof church.distanceMiles === 'number' && (
          <span className="shrink-0 text-[12px] font-semibold text-[var(--accent-sage-ink)] bg-[var(--accent-sage-soft)] px-2 py-0.5 rounded-full whitespace-nowrap">
            {formatDistance(church.distanceMiles)}
          </span>
        )}
      </div>
      {addressStr && <p className="text-[12px] text-[var(--ink-3)] mb-3">{addressStr}</p>}
      <div className="flex gap-2">
        {church.phone && (
          <a
            href={`tel:${church.phone.replace(/\D/g, '')}`}
            className="flex-1 flex items-center justify-center gap-2 bg-[var(--accent-sage)] text-white rounded-xl py-3 font-semibold text-[13px] min-h-[44px]"
          >
            📞 Call
          </a>
        )}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[var(--surface-2)] text-[var(--ink)] rounded-xl py-3 font-semibold text-[13px] min-h-[44px]"
          >
            📍 Directions
          </a>
        )}
      </div>
      {church.website && (
        <a
          href={church.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 bg-[var(--surface-2)] text-[var(--ink)] rounded-xl py-2.5 font-semibold text-[12px] min-h-[40px]"
        >
          🌐 Website
        </a>
      )}
    </div>
  )
}
