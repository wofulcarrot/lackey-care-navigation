'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { PrimaryButton } from '@/components/ui/Button'
import { Field, TextareaField } from '@/components/ui/FormField'

/**
 * Prayer request form. Validates email + message client-side, POSTs
 * to /api/spiritual-care/prayer-request which persists a row in the
 * SpiritualCareRequests collection. On success, replaces the form
 * with a confirmation screen — deliberately NOT redirecting to another
 * page so the patient stays in the Spiritual Care sub-flow.
 */
export function PrayerRequestClient({ locale }: { locale: string }) {
  const t = useTranslations('spiritualCare')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({})

  function validate(): boolean {
    const next: { email?: string; message?: string } = {}
    // Email is optional, but reject malformed entries so the team
    // doesn't end up trying to reply to a typo.
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = t('invalidEmail')
    }
    if (!message.trim()) next.message = t('requiredField')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setStatus('submitting')
    try {
      const res = await fetch('/api/spiritual-care/prayer-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim(),
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
            <span className="text-4xl" aria-hidden="true">🙏</span>
          </div>
          <h1 className="font-display text-[24px] font-semibold mb-3 text-[var(--ink)]">
            {t('prayerSuccessTitle')}
          </h1>
          <p className="text-[var(--ink-2)] text-[15px] mb-7 max-w-[320px]">
            {t('prayerSuccessBody')}
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
        {t('prayerFormHeading')}
      </h1>
      <p className="text-[var(--ink-2)] text-[14px] mb-5">{t('prayerFormBody')}</p>

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field
          label={t('prayerFieldName')}
          value={name}
          onChange={setName}
          autoComplete="name"
        />
        <Field
          type="email"
          label={t('prayerFieldEmail')}
          help={t('prayerFieldEmailHelp')}
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
        />
        <TextareaField
          label={t('prayerFieldMessage')}
          placeholder={t('prayerFieldMessagePlaceholder')}
          value={message}
          onChange={setMessage}
          error={errors.message}
          required
        />

        {status === 'error' && (
          <p className="text-[13px] text-[var(--urgent-red)] bg-[var(--urgent-red-soft)] rounded-xl px-3 py-2">
            {t('submitError')}
          </p>
        )}

        <PrimaryButton tone="sage" disabled={status === 'submitting'}>
          {status === 'submitting' ? t('prayerSubmitting') : t('prayerSubmit')}
        </PrimaryButton>
      </form>
    </div>
  )
}

