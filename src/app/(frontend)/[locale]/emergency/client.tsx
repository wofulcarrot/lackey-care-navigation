'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { EmergencyAlert } from '@/components/EmergencyAlert'
import { OptionRow } from '@/components/ui/OptionRow'
import { PrimaryButton } from '@/components/ui/Button'
import { track } from '@/lib/tracker'
import { SESSION_KEYS } from '@/lib/constants'
import { logEmergencyBeacon } from '@/lib/log-emergency-beacon'

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
      logEmergencyBeacon({ locale })
      setShowAlert(true)
    } else {
      track('emergency_none')
      sessionStorage.setItem(SESSION_KEYS.emergencyScreen, 'true')
      router.push(`/${locale}/care-type`)
    }
  }

  if (showAlert) return <EmergencyAlert onDismiss={() => setShowAlert(false)} />

  return (
    <div className="px-5 py-5 max-w-[440px] mx-auto">
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--urgent-red-soft)] text-[var(--urgent-red)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--urgent-red)]" />
          {t('kicker')}
        </div>
        <h1 className="font-display text-[24px] leading-tight font-semibold mb-2 text-[var(--ink)]">
          {t('title')}
        </h1>
        <p className="text-[var(--ink-2)] text-[14px]">{t('body')}</p>
      </div>

      <div className="flex flex-col gap-2 mb-5">
        {symptoms.map((s) => (
          <OptionRow
            key={s.id}
            title={s.symptom}
            selected={checked.has(s.id)}
            onClick={() => toggle(s.id)}
            variant="red"
          />
        ))}
      </div>

      <PrimaryButton
        tone={checked.size > 0 ? 'red' : 'coral'}
        onClick={handleSubmit}
      >
        {checked.size > 0 ? `📞 ${t('alert')}` : t('noneOfThese')}
      </PrimaryButton>
    </div>
  )
}
