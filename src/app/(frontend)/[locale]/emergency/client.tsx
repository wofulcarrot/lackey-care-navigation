'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { EmergencyAlert } from '@/components/EmergencyAlert'

interface Symptom {
  id: string
  symptom: string
}

export function EmergencyScreenClient({ symptoms }: { symptoms: Symptom[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [showAlert, setShowAlert] = useState(false)
  const t = useTranslations('emergency')
  const router = useRouter()

  function toggle(id: string) {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
  }

  function handleSubmit() {
    if (checked.size > 0) {
      setShowAlert(true)
    } else {
      router.push('care-type')
    }
  }

  if (showAlert) return <EmergencyAlert />

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-red-700">{t('title')}</h1>
      <div className="flex flex-col gap-3 mb-8">
        {symptoms.map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`w-full text-left p-4 rounded-xl border-2 text-lg min-h-[48px] transition ${
              checked.has(s.id)
                ? 'border-red-600 bg-red-50 font-bold'
                : 'border-gray-200 bg-white'
            }`}
          >
            {s.symptom}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="block w-full bg-gray-100 text-gray-700 text-center py-4 rounded-xl text-lg font-medium min-h-[48px]"
      >
        {checked.size > 0 ? t('alert') : t('noneOfThese')}
      </button>
    </div>
  )
}
