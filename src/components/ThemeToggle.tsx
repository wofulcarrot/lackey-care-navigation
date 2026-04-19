'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type Theme = 'light' | 'dark'

/**
 * Header theme toggle. Reads the active theme from the <html> element on
 * mount (which was set by ThemeScript before hydration) so we stay in sync
 * with whatever the no-flash script applied. Persists the choice to
 * localStorage so it carries across visits.
 */
export function ThemeToggle() {
  const t = useTranslations('common')
  // Default to 'light' for the first server render; corrected on mount.
  const [theme, setTheme] = useState<Theme>('light')
  // `mounted` avoids an icon flash: on the first client paint we render a
  // neutral placeholder until we can read the real theme from <html>.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    setMounted(true)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('lackey-theme', next)
    } catch {
      /* private browsing → ignore */
    }
  }

  const label = theme === 'dark' ? t('switchToLight') : t('switchToDark')

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="h-10 w-10 rounded-full bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--surface-3)] flex items-center justify-center transition-colors"
    >
      {mounted ? (
        theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )
      ) : (
        <span className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  )
}
