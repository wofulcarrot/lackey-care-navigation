'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export function Header() {
  const locale = useLocale()
  const t = useTranslations('landing')
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: string) {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.replace(segments.join('/'))
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <div className="font-bold text-lg">Lackey Clinic</div>
      <div className="flex items-center gap-3">
        <a
          href="tel:911"
          className="text-red-600 font-bold text-sm px-3 py-1 border border-red-600 rounded-full min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          {t('call911')}
        </a>
        <button
          onClick={() => switchLocale(locale === 'en' ? 'es' : 'en')}
          className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          {locale === 'en' ? 'ES' : 'EN'}
        </button>
      </div>
    </header>
  )
}
