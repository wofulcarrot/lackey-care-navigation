'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/**
 * Dashboard top bar — mirrors the Staff Dashboard.html design:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ [page title]        [search]   [⌘K]  [theme]  [user ▾]      │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * The bar is a client component so it can own:
 *  - theme toggle state (reads + writes `.dark` on <html>, persists to
 *    localStorage as 'lackey-dash-theme')
 *  - user menu open/close state + outside-click dismiss
 *  - keyboard ⌘K / Ctrl+K focus on the search box
 *
 * Search is a placeholder — we don't have a global search index yet,
 * so it's wired to no-op on submit. The UI affordance is there so the
 * design matches and we can drop in real search later without a redesign.
 */
export function TopBar({
  title,
  subtitle,
  userEmail = 'staff@lackey.local',
  actions,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  userEmail?: string
  actions?: React.ReactNode
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Pick up initial theme from <html class>, set by a pre-hydrate script
  // elsewhere so there's no flash of wrong theme on first paint.
  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    )
    setMounted(true)
  }, [])

  // ⌘K / Ctrl+K focuses search — matches the hint chip next to the input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Outside-click + Escape close for the user menu.
  useEffect(() => {
    if (!menuOpen) return
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [menuOpen])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    try {
      localStorage.setItem('lackey-dash-theme', next)
    } catch {
      /* private browsing */
    }
  }

  const avatar = initialsFor(userEmail)

  return (
    <header className="border-b border-[var(--stroke)] bg-[var(--surface-0)] px-6 lg:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <div className="font-display text-[22px] font-semibold text-[var(--ink)] leading-tight">
          {title}
        </div>
        {subtitle && (
          <p className="text-[13px] text-[var(--ink-2)] mt-1">{subtitle}</p>
        )}
      </div>

      <div ref={wrapRef} className="flex items-center gap-2 shrink-0">
        {/* Search + ⌘K chip */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="hidden md:flex items-center gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--surface-1)] px-2.5 h-9 w-64 focus-within:border-[var(--accent-primary)] transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--ink-3)] shrink-0"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search"
            aria-label="Search dashboard"
            className="flex-1 min-w-0 bg-transparent text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none"
          />
          <kbd className="text-[10.5px] font-mono font-semibold text-[var(--ink-3)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--stroke)] shrink-0">
            ⌘K
          </kbd>
        </form>

        {actions}

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          className="h-9 w-9 rounded-lg bg-[var(--surface-1)] border border-[var(--stroke)] text-[var(--ink-2)] hover:bg-[var(--surface-2)] flex items-center justify-center transition-colors"
        >
          {mounted ? (
            theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )
          ) : (
            <span className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="h-9 px-2 rounded-lg bg-[var(--surface-1)] border border-[var(--stroke)] hover:bg-[var(--surface-2)] flex items-center gap-2 transition-colors"
          >
            <span
              className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white font-bold text-[10.5px] flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              {avatar}
            </span>
            <span className="hidden sm:inline text-[12.5px] font-medium text-[var(--ink)] max-w-[160px] truncate">
              {userEmail}
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--ink-3)]"
              aria-hidden="true"
            >
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+4px)] z-50 w-[220px] rounded-xl border border-[var(--stroke)] bg-[var(--surface-0)] shadow-[var(--shadow-pop)] p-1"
            >
              <div className="px-3 py-2 border-b border-[var(--stroke)]">
                <div className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
                  Signed in as
                </div>
                <div className="text-[13px] font-medium text-[var(--ink)] truncate">
                  {userEmail}
                </div>
              </div>
              <Link
                href="/admin/account"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="block px-3 py-2 text-[13px] text-[var(--ink)] hover:bg-[var(--surface-2)] rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                Account settings
              </Link>
              <Link
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="block px-3 py-2 text-[13px] text-[var(--ink)] hover:bg-[var(--surface-2)] rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                Open CMS admin
              </Link>
              <Link
                href="/en"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="block px-3 py-2 text-[13px] text-[var(--ink)] hover:bg-[var(--surface-2)] rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                Preview patient flow
              </Link>
              <form action="/admin/logout" method="post" className="mt-1 pt-1 border-t border-[var(--stroke)]">
                <button
                  type="submit"
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-[13px] text-[var(--urgent-red)] hover:bg-[var(--urgent-red-soft)] rounded-md"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function initialsFor(email: string): string {
  const local = email.split('@')[0] ?? email
  const parts = local.split(/[._-]/).filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
  return letters || email.slice(0, 2).toUpperCase() || '?'
}
