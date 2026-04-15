'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Answer {
  id?: string
  label: string
  urgencyWeight: number
  escalateImmediately: boolean
  nextQuestion?: string | null
  redirectToCareType?: string | null
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
      // Single choice / yes-no: submit immediately
      onSubmit([answers[index]])
    }
  }

  function handleMultiSubmit() {
    onSubmit(Array.from(selected).map((i) => answers[i]))
  }

  return (
    <div className="px-4 py-6">
      <h2 id="question-text" className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{text}</h2>
      {helpText && (
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-blue-600 dark:text-blue-400 text-sm mb-4 underline min-h-[48px]"
        >
          {t('helpText')}
        </button>
      )}
      {showHelp && helpText && (
        <p className="text-gray-600 dark:text-gray-300 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {helpText}
        </p>
      )}
      <div className="flex flex-col gap-3" role={type === 'multi_choice' ? 'group' : 'radiogroup'} aria-labelledby="question-text">
        {answers.map((a, i) => (
          <button
            key={i}
            role={type === 'multi_choice' ? 'checkbox' : 'radio'}
            aria-checked={selected.has(i)}
            onClick={() => handleSelect(i)}
            className={`w-full text-left p-4 rounded-xl border-2 text-lg min-h-[48px] transition ${
              selected.has(i)
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-100 font-bold'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      {type === 'multi_choice' && selected.size > 0 && (
        <button
          onClick={handleMultiSubmit}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-4 rounded-xl text-lg font-bold min-h-[48px]"
        >
          {t('next')}
        </button>
      )}
    </div>
  )
}
