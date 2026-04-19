'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { track } from '@/lib/tracker'

export function Header() {
  const locale = useLocale()
  const t = useTranslations('landing')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function switchLocale(newLocale: string) {
    track('language_toggle', { from: locale, to: newLocale })
    const segments = pathname.split('/')
    segments[1] = newLocale
    // Preserve query params (e.g., ?careType=1 on the triage page)
    const qs = searchParams.toString()
    const newUrl = segments.join('/') + (qs ? `?${qs}` : '')
    router.replace(newUrl)
  }

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--stroke)] bg-[var(--surface-0)] transition-colors">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] text-white flex items-center justify-center font-bold text-sm"
          aria-hidden="true"
        >
          L
        </div>
        <div className="font-display font-semibold text-[var(--ink)] text-[15px]">
          Lackey Clinic
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="tel:911"
          aria-label={t('call911')}
          className="h-10 px-3 rounded-full border-2 border-[var(--urgent-red)] text-[var(--urgent-red)] font-bold text-[13px] hover:bg-[var(--urgent-red)] hover:text-white transition min-w-[48px] flex items-center justify-center"
        >
          911
        </a>
        <ThemeToggle />
        <button
          onClick={() => switchLocale(locale === 'en' ? 'es' : 'en')}
          className="h-10 px-3 rounded-full bg-[var(--surface-2)] text-[var(--ink)] font-semibold text-[13px] hover:bg-[var(--surface-3)] transition min-w-[48px] flex items-center justify-center"
        >
          {locale === 'en' ? 'ES' : 'EN'}
        </button>
      </div>
    </header>
  )
}
