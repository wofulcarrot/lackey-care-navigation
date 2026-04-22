'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { PrimaryButton } from '@/components/ui/Button'
import { Field, TextareaField } from '@/components/ui/FormField'

/**
 * Chaplain callback form. Phone number is required; name and message
 * are optional. Posts to /api/spiritual-care/chaplain-request which
 * captures the request + routes it to the next caregiver in rotation
 * (the rotation picks the least-recently-contacted active caregiver
 * matching the patient's locale when possible).
 */
export function ChaplainCallClient({ locale }: { locale: string }) {
  const t = useTranslations('spiritualCare')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<{ phone?: string }>({})

  function validate(): boolean {
    const next: { phone?: string } = {}
    const digits = phone.replace(/\D/g, '')
    if (!digits) next.phone = t('requiredField')
    else if (digits.length < 10) next.phone = t('invalidPhone')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setStatus('submitting')
    try {
      const res = await fetch('/api/spiritual-care/chaplain-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim(),
          message: message.trim() || undefined,
          locale,
        }),
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="px-5 py-5 max-w-[440px] mx-auto">
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-20 h-20 rounded-full bg-[var(--accent-sage-soft)] flex items-center justify-center mb-5">
            <span className="text-4xl" aria-hidden="true">📞</span>
          </div>
          <h1 className="font-display text-[24px] font-semibold mb-3 text-[var(--ink)]">
            {t('chaplainSuccessTitle')}
          </h1>
          <p className="text-[var(--ink-2)] text-[15px] mb-7 max-w-[320px]">
            {t('chaplainSuccessBody')}
          </p>
          <Link
            href={`/${locale}`}
            className="w-full max-w-[340px] rounded-2xl bg-[var(--accent-primary)] text-white text-center py-4 text-lg font-semibold min-h-[52px] px-5 hover:brightness-105 transition inline-flex items-center justify-center"
          >
            {t('doneButton')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 py-5 max-w-[440px] mx-auto">
      <Link
        href={`/${locale}/spiritual-care`}
        className="text-[13px] text-[var(--ink-2)] font-medium hover:text-[var(--ink)] inline-block mb-3 min-h-[32px]"
      >
        ← {t('back')}
      </Link>
      <h1 className="font-display text-[24px] leading-tight font-semibold mb-2 text-[var(--ink)]">
        {t('chaplainFormHeading')}
      </h1>
      <p className="text-[var(--ink-2)] text-[14px] mb-5">{t('chaplainFormBody')}</p>

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field
          label={t('chaplainFieldName')}
          value={name}
          onChange={setName}
          autoComplete="name"
        />
        <Field
          type="tel"
          label={t('chaplainFieldPhone')}
          value={phone}
          onChange={setPhone}
          error={errors.phone}
          autoComplete="tel"
          inputMode="tel"
          required
        />
        <TextareaField
          label={t('chaplainFieldMessage')}
          placeholder={t('chaplainFieldMessagePlaceholder')}
          value={message}
          onChange={setMessage}
          rows={3}
        />

        {status === 'error' && (
          <p className="text-[13px] text-[var(--urgent-red)] bg-[var(--urgent-red-soft)] rounded-xl px-3 py-2">
            {t('submitError')}
          </p>
        )}

        <PrimaryButton tone="sage" disabled={status === 'submitting'}>
          {status === 'submitting' ? t('prayerSubmitting') : t('chaplainSubmit')}
        </PrimaryButton>
      </form>
    </div>
  )
}
