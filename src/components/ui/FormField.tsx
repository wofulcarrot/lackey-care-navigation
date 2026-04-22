'use client'

/**
 * Shared text input + textarea for the patient-facing forms. Lives in
 * components/ui so any future form (prayer request, chaplain callback,
 * clinic contact, etc.) uses the same label / error / help styling.
 *
 * Keep props intentionally narrow — the styling is already opinionated
 * (sage accent on focus, urgent-red on error) so there's nothing to
 * customize here. If a new form needs different styling, fork.
 */
import type { HTMLInputTypeAttribute } from 'react'

interface FieldProps {
  label: string
  help?: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: HTMLInputTypeAttribute
  required?: boolean
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'search' | 'decimal' | 'none'
  placeholder?: string
}

export function Field({
  label,
  help,
  value,
  onChange,
  error,
  type = 'text',
  required,
  autoComplete,
  inputMode,
  placeholder,
}: FieldProps) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-[var(--ink)] mb-1.5">
        {label}
        {required && <span className="text-[var(--urgent-red)] ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`w-full px-4 py-3 rounded-xl border-2 text-[16px] min-h-[48px] bg-[var(--surface-0)] text-[var(--ink)] focus:outline-none ${
          error
            ? 'border-[var(--urgent-red)]'
            : 'border-[var(--stroke)] focus:border-[var(--accent-sage)]'
        }`}
      />
      {help && !error && (
        <span className="block text-[12px] text-[var(--ink-3)] mt-1">{help}</span>
      )}
      {error && (
        <span className="block text-[12px] text-[var(--urgent-red)] mt-1">{error}</span>
      )}
    </label>
  )
}

interface TextareaFieldProps {
  label: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  error?: string
  required?: boolean
  rows?: number
}

export function TextareaField({
  label,
  placeholder,
  value,
  onChange,
  error,
  required,
  rows = 5,
}: TextareaFieldProps) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-[var(--ink)] mb-1.5">
        {label}
        {required && <span className="text-[var(--urgent-red)] ml-1">*</span>}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`w-full px-4 py-3 rounded-xl border-2 text-[16px] bg-[var(--surface-0)] text-[var(--ink)] focus:outline-none resize-none ${
          error
            ? 'border-[var(--urgent-red)]'
            : 'border-[var(--stroke)] focus:border-[var(--accent-sage)]'
        }`}
      />
      {error && (
        <span className="block text-[12px] text-[var(--urgent-red)] mt-1">{error}</span>
      )}
    </label>
  )
}
