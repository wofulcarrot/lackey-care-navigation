import type { ReactNode } from 'react'
import { TopBar } from './TopBar'

/**
 * Thin alias over TopBar. Every dashboard subpage (crisis, analytics,
 * resources, users, audit, settings) was originally written to import
 * PageHeader — keeping the alias means those pages pick up the new
 * TopBar (with search, theme toggle, and user menu) automatically
 * without touching every page.tsx.
 *
 * New code should import TopBar directly; PageHeader stays for
 * backward compat with the subpages that already reference it.
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
  return <TopBar title={title} subtitle={subtitle} actions={actions} />
}
