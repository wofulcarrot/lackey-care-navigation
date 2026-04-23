import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

/**
 * Chaplain callback — HIPAA-safe hand-off design.
 *
 * We do NOT capture the patient's phone number. The "Call now"
 * button is a `tel:` link that dials directly from the patient's
 * device to Lackey's chaplain phone line. The call audio travels
 * over the patient's carrier + Lackey's phone system — never through
 * this site's servers or logs.
 *
 * A 988 crisis card is always visible so patients in acute distress
 * have a one-tap route to real 24/7 crisis support (the volunteer
 * chaplain line runs business hours only).
 *
 * LAUNCH TODO (Lackey compliance):
 *  - Replace placeholder phone with the dedicated chaplain line
 *    (currently the main clinic line).
 *  - Confirm the phone system (RingCentral HIPAA / Zoom Phone HIPAA /
 *    direct landline via BAA-covered carrier) is HIPAA-compliant.
 *  - Confirm chaplain coverage matches the published hours.
 */

// TODO(lackey): replace with the dedicated chaplain line once
// established. Placeholder is Lackey's main clinic line.
const CHAPLAIN_PHONE_DISPLAY = '(757) 547-7484'
const CHAPLAIN_PHONE_TEL = '7575477484'

export default async function ChaplainCallPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('spiritualCare')

  return (
    <div className="px-5 py-5 max-w-[440px] mx-auto">
      <Link
        href={`/${locale}/spiritual-care`}
        className="text-[13px] text-[var(--ink-2)] font-medium hover:text-[var(--ink)] inline-block mb-3 min-h-[32px]"
      >
        ← {t('back')}
      </Link>
      <h1 className="font-display text-[24px] leading-tight font-semibold mb-2 text-[var(--ink)]">
        {t('chaplainHeading')}
      </h1>
      <p className="text-[var(--ink-2)] text-[14px] mb-3">{t('chaplainBody')}</p>

      <div className="rounded-2xl border-2 border-[var(--stroke)] bg-[var(--surface-1)] p-4 mb-4">
        <p className="text-[13px] text-[var(--ink-2)] mb-1 font-medium">
          {t('chaplainHoursLabel')}
        </p>
        <p className="text-[15px] text-[var(--ink)] font-semibold">{t('chaplainHours')}</p>
      </div>

      <a
        href={`tel:${CHAPLAIN_PHONE_TEL}`}
        className="w-full rounded-2xl bg-[var(--accent-sage)] text-white text-center py-4 text-lg font-semibold min-h-[52px] px-5 hover:brightness-105 transition inline-flex items-center justify-center gap-2"
      >
        <span aria-hidden="true">📞</span> {t('chaplainCallCta')} {CHAPLAIN_PHONE_DISPLAY}
      </a>

      <p className="text-[12px] text-[var(--ink-3)] mt-3 mb-6 text-center">
        {t('chaplainPrivacyNote')}
      </p>

      <CrisisCard />
    </div>
  )
}

async function CrisisCard() {
  const t = await getTranslations('spiritualCare')
  return (
    <div className="rounded-2xl border-2 border-[var(--urgent-red)]/30 bg-[var(--urgent-red-soft)] p-4">
      <h2 className="font-display font-semibold text-[15px] text-[var(--urgent-red)] mb-1">
        {t('crisisLineTitle')}
      </h2>
      <p className="text-[13px] text-[var(--ink)] mb-3">{t('crisisLineBody')}</p>
      <div className="flex gap-2">
        <a
          href="tel:988"
          className="flex-1 flex items-center justify-center gap-2 bg-[var(--urgent-red)] text-white rounded-xl py-3 font-semibold text-[13px] min-h-[44px]"
        >
          📞 {t('crisisCall988')}
        </a>
        <a
          href="sms:988"
          className="flex-1 flex items-center justify-center gap-2 bg-[var(--surface-2)] text-[var(--ink)] rounded-xl py-3 font-semibold text-[13px] min-h-[44px]"
        >
          💬 {t('crisisText988')}
        </a>
      </div>
    </div>
  )
}
