'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { EmergencyAlert } from '@/components/EmergencyAlert'
import { track } from '@/lib/tracker'

interface Symptom {
  id: string
  symptom: string
}

export function EmergencyScreenClient({ symptoms }: { symptoms: Symptom[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [showAlert, setShowAlert] = useState(false)
  const t = useTranslations('emergency')
  const locale = useLocale()
  const router = useRouter()

  useEffect(() => {
    track('emergency_screen_view')
  }, [])

  function toggle(id: string) {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
  }

  function handleSubmit() {
    if (checked.size > 0) {
      track('emergency_symptom')
      // Fire-and-forget analytics log so the CEO dashboard's emergencyCount
      // metric reflects real events (not just seeded data). Never await —
      // the full-screen 911 alert must render immediately.
      try {
        const width = typeof window !== 'undefined' ? window.innerWidth : 0
        const device = width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
        const payload = JSON.stringify({ locale, device })

        // Prefer sendBeacon where available — it's designed to survive
        // page navigation. Fall back to fetch with keepalive for the same
        // guarantee when sendBeacon isn't present.
        const beacon =
          typeof navigator !== 'undefined' &&
          typeof navigator.sendBeacon === 'function'
            ? navigator.sendBeacon(
                '/api/triage/log-emergency',
                new Blob([payload], { type: 'application/json' }),
              )
            : false

        if (!beacon) {
          void fetch('/api/triage/log-emergency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {
            /* swallow — never block the patient flow */
          })
        }
      } catch {
        /* swallow — never block the patient flow */
      }

      setShowAlert(true)
    } else {
      track('emergency_none')
      sessionStorage.setItem('emergencyScreenCompleted', 'true')
      router.push(`/${locale}/care-type`)
    }
  }

  if (showAlert) return <EmergencyAlert onDismiss={() => setShowAlert(false)} />

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-red-700 dark:text-red-400">{t('title')}</h1>
      <div className="flex flex-col gap-3 mb-8">
        {symptoms.map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            aria-pressed={checked.has(s.id)}
            className={`w-full text-left p-4 rounded-xl border-2 text-lg min-h-[48px] transition ${
              checked.has(s.id)
                ? 'border-red-600 bg-red-50 dark:bg-red-950/40 dark:border-red-500 dark:text-red-100 font-bold'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
            }`}
          >
            {s.symptom}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="block w-full bg-gray-100 dark:bg-gray-800 dark:text-gray-100 text-gray-700 text-center py-4 rounded-xl text-lg font-medium min-h-[48px]"
      >
        {checked.size > 0 ? t('alert') : t('noneOfThese')}
      </button>
    </div>
  )
}
