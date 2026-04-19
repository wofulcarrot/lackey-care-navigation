'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { OptionRow } from './ui/OptionRow'
import { PrimaryButton } from './ui/Button'

interface Answer {
  id?: string
  label: string
  urgencyWeight: number
  escalateImmediately: boolean
  // These relationship fields come from Payload with depth>0 and may be
  // objects, strings, or numbers. QuestionCard doesn't use them — they're
  // only here so the type is compatible with useTriage's Answer shape.
  nextQuestion?: string | number | { id: string | number } | null
  redirectToCareType?: string | number | { id: string | number } | null
}

interface QuestionCardProps {
  text: string
  helpText?: string
  type: 'single_choice' | 'multi_choice' | 'yes_no'
  answers: Answer[]
  onSubmit: (selected: Answer[]) => void
}

export function QuestionCard({
  text,
  helpText,
  type,
  answers,
  onSubmit,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showHelp, setShowHelp] = useState(false)
  const t = useTranslations('triage')

  function handleSelect(index: number) {
    if (type === 'multi_choice') {
      const next = new Set(selected)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      setSelected(next)
    } else {
      // Single choice / yes-no: submit immediately so patients don't
      // have to double-tap.
      onSubmit([answers[index]])
    }
  }

  function handleMultiSubmit() {
    onSubmit(Array.from(selected).map((i) => answers[i]))
  }

  return (
    <div>
      <h2
        id="question-text"
        className="font-display text-[23px] leading-tight font-semibold mb-2 text-[var(--ink)]"
      >
        {text}
      </h2>

      {helpText && (
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-[var(--accent-primary)] text-[14px] underline underline-offset-2 mb-3 min-h-[32px]"
        >
          {t('helpText')}
        </button>
      )}
      {showHelp && helpText && (
        <div className="bg-[var(--surface-2)] rounded-xl p-3.5 text-[14px] text-[var(--ink-2)] mb-4 leading-snug">
          {helpText}
        </div>
      )}

      <div
        className="flex flex-col gap-2 mt-3"
        role={type === 'multi_choice' ? 'group' : 'radiogroup'}
        aria-labelledby="question-text"
      >
        {answers.map((a, i) => (
          <OptionRow
            key={i}
            title={a.label}
            selected={selected.has(i)}
            onClick={() => handleSelect(i)}
          />
        ))}
      </div>

      {type === 'multi_choice' && selected.size > 0 && (
        <div className="mt-4">
          <PrimaryButton onClick={handleMultiSubmit}>{t('next')}</PrimaryButton>
        </div>
      )}
    </div>
  )
}
