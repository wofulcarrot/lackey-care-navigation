import type { ReactNode } from 'react'

/**
 * Consistent top bar across every dashboard subpage — matches the
 * Overview page's header layout (Fraunces title + ink-2 subtitle +
 * optional trailing actions).
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="border-b border-[var(--stroke)] bg-[var(--surface-0)] px-6 lg:px-8 py-5 flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <div className="font-display text-[22px] font-semibold text-[var(--ink)] leading-tight">
          {title}
        </div>
        {subtitle && (
          <p className="text-[13px] text-[var(--ink-2)] mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </header>
  )
}
