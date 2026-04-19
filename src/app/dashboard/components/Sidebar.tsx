'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  id: string
  label: string
  href: string
  badge?: number
  disabled?: boolean
}

/**
 * Staff console left rail. Every nav item links to a real page under
 * /dashboard/* — the pages themselves mix real DB data with design-
 * placeholder rows where we don't have a backing collection yet
 * (audit log, settings). The badge count on Crisis log pulls from the
 * current range's crisis-session count and is passed in as a prop.
 */
export function Sidebar({ crisisCount = 0 }: { crisisCount?: number }) {
  const pathname = usePathname() ?? '/dashboard'

  const items: NavItem[] = [
    { id: 'overview',  label: 'Overview',    href: '/dashboard' },
    { id: 'crisis',    label: 'Crisis log',  href: '/dashboard/crisis',    badge: crisisCount },
    { id: 'analytics', label: 'Analytics',   href: '/dashboard/analytics' },
    { id: 'resources', label: 'Resources',   href: '/dashboard/resources' },
    { id: 'audit',     label: 'Audit log',   href: '/dashboard/audit' },
    { id: 'users',     label: 'Users',       href: '/dashboard/users' },
    { id: 'settings',  label: 'Settings',    href: '/dashboard/settings' },
  ]

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-[232px] shrink-0 bg-[var(--sidebar)] text-[var(--sidebar-ink)] flex flex-col min-h-[100dvh] sticky top-0 hidden lg:flex print:hidden">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/5">
        <div
          className="w-9 h-9 rounded-xl bg-[var(--accent-primary)] text-white flex items-center justify-center font-bold text-[15px]"
          style={{ fontFamily: 'var(--font-display)' }}
          aria-hidden="true"
        >
          L
        </div>
        <div>
          <div className="font-display text-[14px] font-semibold leading-tight">Lackey</div>
          <div className="text-[10.5px] text-[var(--sidebar-ink-2)] uppercase tracking-wider">
            Staff Console
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5 overflow-auto">
        {items.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`h-9 px-2.5 rounded-lg flex items-center gap-2.5 text-[13.5px] font-medium transition ${
                active
                  ? 'bg-[var(--sidebar-active)] text-white'
                  : 'text-[var(--sidebar-ink-2)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-ink)]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <NavIcon id={item.id} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-bold num ${
                    active ? 'bg-white/20 text-white' : 'bg-[var(--urgent-red)] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 pt-3 pb-4 border-t border-white/5 text-[10.5px] text-[var(--sidebar-ink-2)] leading-snug">
        <div className="font-semibold text-[var(--sidebar-ink)]">Pilot environment</div>
        <div>Norfolk Healthcare Safety Net Collaborative</div>
      </div>
    </aside>
  )
}

function NavIcon({ id }: { id: string }) {
  const common = {
    className: 'w-4 h-4 shrink-0',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (id) {
    case 'overview':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'crisis':
      return (
        <svg {...common}>
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case 'analytics':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M7 15l4-4 4 2 5-7" />
        </svg>
      )
    case 'resources':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M9 4v16" />
        </svg>
      )
    case 'audit':
      return (
        <svg {...common}>
          <path d="M9 2h6a2 2 0 0 1 2 2v2H7V4a2 2 0 0 1 2-2z" />
          <path d="M5 6h14v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6z" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'settings':
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
  }
}
