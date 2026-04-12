'use client'

import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { CareTypeCard } from '@/components/CareTypeCard'

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

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <div className="flex flex-col gap-3">
        {careTypes.map((ct) => (
          <CareTypeCard
            key={ct.id}
            icon={ct.icon}
            name={ct.name}
            description={ct.description}
            onClick={() => router.push(`/${locale}/triage?careType=${ct.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
