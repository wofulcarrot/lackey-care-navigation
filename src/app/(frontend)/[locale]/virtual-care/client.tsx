'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { VirtualCareInterstitial } from '@/components/VirtualCareInterstitial'

export function VirtualCarePageClient({ virtualCareUrl, bullets }: { virtualCareUrl: string; bullets: string[] }) {
  const router = useRouter()
  const locale = useLocale()
  return (
    <VirtualCareInterstitial
      virtualCareUrl={virtualCareUrl}
      bullets={bullets}
      onShowOther={() => router.push(`/${locale}/emergency`)}
    />
  )
}
