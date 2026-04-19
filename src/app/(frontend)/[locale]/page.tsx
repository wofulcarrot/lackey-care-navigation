import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('landing')

  const trust = [
    { title: t('trustPrivate'), body: t('trustPrivateBody') },
    { title: t('trustFree'), body: t('trustFreeBody') },
    { title: t('trustSpanish'), body: t('trustSpanishBody') },
  ]

  return (
    <div className="px-6 py-8 flex flex-col items-center text-center max-w-[440px] mx-auto">
      {/* Hero emoji circle — handshake signals "someone here will help you" */}
      <div className="w-24 h-24 rounded-full bg-[var(--accent-primary-soft)] flex items-center justify-center mb-5">
        <span className="text-5xl" aria-hidden="true">🤝</span>
      </div>
      <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--accent-primary)] mb-2">
        {t('heroKicker')}
      </div>
      <h1 className="font-display text-[30px] leading-[1.1] font-semibold mb-3 text-[var(--ink)]">
        {t('hero')}
      </h1>
      <p className="text-[var(--ink-2)] text-[16px] mb-7 max-w-[320px]">{t('subtitle')}</p>

      {/* Primary CTA → emergency screener (the spec requires a safety check
          before any patient reaches the triage flow). */}
      <div className="flex flex-col gap-3 w-full max-w-[340px]">
        <Link
          href={`/${locale}/emergency`}
          className="w-full rounded-2xl bg-[var(--accent-primary)] text-white text-center py-4 text-lg font-semibold min-h-[52px] px-5 hover:brightness-105 transition"
        >
          {t('getCareNow')}
        </Link>
        <p className="text-[13px] text-[var(--ink-3)] -mt-1">{t('getCareNowSub')}</p>
      </div>

      {/* Trust signals — reassures patients that this isn't a marketing lead form */}
      <div className="mt-7 grid grid-cols-1 gap-2.5 w-full max-w-[340px]">
        {trust.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-2.5 text-left rounded-xl bg-[var(--surface-2)] px-3.5 py-2.5"
          >
            <span className="mt-0.5 w-5 h-5 rounded-full bg-[var(--accent-sage)] text-white text-[11px] flex items-center justify-center shrink-0">
              ✓
            </span>
            <div>
              <div className="text-[14px] font-semibold text-[var(--ink)]">{item.title}</div>
              <div className="text-[13px] text-[var(--ink-2)] leading-snug">{item.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Separate crisis path — shown below primary CTA so suicidal patients
          don't have to complete triage to reach 988. Links to the BH care type
          which routes to the 988 CrisisAlert via the existing triage engine. */}
      <div className="mt-6 pt-5 border-t border-[var(--stroke)] w-full max-w-[340px]">
        <p className="text-[13px] text-[var(--ink-3)] mb-2">{t('crisis')}</p>
        <Link
          href={`/${locale}/emergency`}
          className="text-[var(--accent-primary)] text-[14px] font-semibold underline underline-offset-2"
        >
          {t('crisisCta')} →
        </Link>
      </div>
    </div>
  )
}
