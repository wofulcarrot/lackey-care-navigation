'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { CareTypeCard } from '@/components/CareTypeCard'
import { track } from '@/lib/tracker'
import { SESSION_KEYS } from '@/lib/constants'

interface CareType {
  id: string
  name: string
  icon: string
  description: string
  isMeta: boolean
}

export function CareTypeSelectionClient({ careTypes }: { careTypes: CareType[] }) {
  const router = useRouter()
  const t = useTranslations('careType')
  const locale = useLocale()

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEYS.emergencyScreen)) {
      router.replace(`/${locale}/emergency`)
    }
  }, [router, locale])

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('title')}</h1>
      <div className="flex flex-col gap-3">
        {careTypes.map((ct) => (
          <CareTypeCard
            key={ct.id}
            icon={ct.icon}
            name={ct.name}
            description={ct.description}
            onClick={() => {
              track('care_type_selected', { careType: ct.name })
              router.push(`/${locale}/triage?careType=${ct.id}`)
            }}
          />
        ))}
      </div>
    </div>
  )
}
