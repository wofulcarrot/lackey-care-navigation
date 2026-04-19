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
    <div className="px-5 py-5 max-w-[440px] mx-auto">
      <h1 className="font-display text-[24px] leading-tight font-semibold mb-2 text-[var(--ink)]">
        {t('title')}
      </h1>
      <p className="text-[var(--ink-2)] text-[14px] mb-4">{t('subtitle')}</p>
      <div className="flex flex-col gap-2">
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
