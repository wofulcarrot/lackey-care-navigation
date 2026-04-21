'use client'

import type { MouseEventHandler, ReactNode } from 'react'

type Variant = 'default' | 'red'

interface OptionRowProps {
  icon?: ReactNode
  title: ReactNode
  desc?: ReactNode
  selected?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  variant?: Variant
  ariaLabel?: string
}

/**
 * Tappable option card with an icon, title, optional description, and a
 * check mark in the corner when selected. Used for care-type cards,
 * emergency-symptom checklist, and triage answers.
 */
export function OptionRow({
  icon,
  title,
  desc,
  selected = false,
  onClick,
  variant = 'default',
  ariaLabel,
}: OptionRowProps) {
  const base =
    'w-full text-left rounded-2xl p-4 min-h-[64px] transition flex items-start gap-3 border-2'
  const selectedCls: Record<Variant, string> = {
    default: 'border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--ink)]',
    red:     'border-[var(--urgent-red)] bg-[var(--urgent-red-soft)] text-[var(--ink)]',
  }
  const idle =
    'border-[var(--stroke)] bg-[var(--surface-1)] text-[var(--ink)] hover:border-[var(--ink-3)]'
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`${base} ${selected ? selectedCls[variant] : idle}`}
    >
      {icon && (
        <span className="text-2xl leading-none shrink-0 mt-0.5" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="flex-1">
        <span className="block font-semibold text-[17px] leading-snug">{title}</span>
        {desc && <span className="block text-[14px] text-[var(--ink-2)] mt-0.5">{desc}</span>}
      </span>
      {selected && (
        <span className="shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white text-xs flex items-center justify-center">
          ✓
        </span>
      )}
    </button>
  )
}
