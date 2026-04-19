'use client'

import type { ReactNode, MouseEventHandler } from 'react'

type Tone = 'coral' | 'sage' | 'red' | 'white'
type Size = 'lg' | 'md'

interface PrimaryButtonProps {
  tone?: Tone
  size?: Size
  onClick?: MouseEventHandler<HTMLElement>
  href?: string
  target?: string
  rel?: string
  disabled?: boolean
  children: ReactNode
  className?: string
}

const tones: Record<Tone, string> = {
  coral: 'bg-[var(--accent-primary)] text-white hover:brightness-105',
  sage:  'bg-[var(--accent-sage)] text-white hover:brightness-105',
  red:   'bg-[var(--urgent-red)] text-white hover:brightness-110',
  white: 'bg-white text-[var(--urgent-red)] hover:brightness-95',
}

const sizes: Record<Size, string> = {
  lg: 'py-4 text-lg',
  md: 'py-3 text-base',
}

/**
 * Filled CTA button. Renders as `<a>` if `href` is provided so screen
 * readers and browser behaviors (long-press on mobile, cmd-click, etc.)
 * work correctly for navigation links. `onClick` fires on both anchor
 * and button variants, which is useful for analytics tracking.
 */
export function PrimaryButton({
  tone = 'coral',
  size = 'lg',
  onClick,
  href,
  target,
  rel,
  disabled,
  children,
  className = '',
}: PrimaryButtonProps) {
  const cls = `w-full rounded-2xl font-semibold transition ${tones[tone]} ${sizes[size]} text-center min-h-[52px] px-5 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center ${className}`
  if (href) {
    return (
      <a href={href} target={target} rel={rel} onClick={onClick} className={cls}>
        {children}
      </a>
    )
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}

interface GhostButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>
  children: ReactNode
  className?: string
}

/** Secondary muted button for "skip" or "show other options" actions. */
export function GhostButton({ onClick, children, className = '' }: GhostButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl py-3.5 text-base font-medium min-h-[52px] bg-[var(--surface-2)] text-[var(--ink-2)] hover:bg-[var(--surface-3)] transition ${className}`}
    >
      {children}
    </button>
  )
}
