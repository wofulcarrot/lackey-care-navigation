import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

/**
 * Prayer request — HIPAA-safe hand-off design.
 *
 * We intentionally do NOT collect or store the prayer text. Tapping
 * the email button opens the patient's own email client with a
 * message pre-addressed to Lackey's spiritual care team. The content
 * travels from the patient's device directly to Lackey's (HIPAA-
 * covered) inbox without ever passing through this site's servers,
 * logs, or database.
 *
 * A 988 crisis card is always visible above the fold so patients in
 * acute distress have a one-tap route to real crisis support (the
 * volunteer spiritual care team is not 24/7).
 *
 * LAUNCH TODO (Lackey compliance):
 *  - Confirm `spiritualcare@lackeyclinic.org` exists and is covered
 *    by a BAA (Google Workspace / Microsoft 365 Enterprise, etc.).
 *  - Confirm the inbox is monitored with an expected response SLA.
 */

// TODO(lackey): confirm this address has a signed BAA before launch.
const SPIRITUAL_CARE_EMAIL = 'spiritualcare@lackeyclinic.org'

export default async function PrayerRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('spiritualCare')

  // Pre-fill the subject so the team can triage replies. The body is
  // left empty so the patient writes freely in their own email app.
  const mailto = `mailto:${SPIRITUAL_CARE_EMAIL}?subject=${encodeURIComponent(t('prayerEmailSubject'))}`

  return (
    <div className="px-5 py-5 max-w-[440px] mx-auto">
      <Link
        href={`/${locale}/spiritual-care`}
        className="text-[13px] text-[var(--ink-2)] font-medium hover:text-[var(--ink)] inline-block mb-3 min-h-[32px]"
      >
        ← {t('back')}
      </Link>
      <h1 className="font-display text-[24px] leading-tight font-semibold mb-2 text-[var(--ink)]">
        {t('prayerHeading')}
      </h1>
      <p className="text-[var(--ink-2)] text-[14px] mb-5">{t('prayerBody')}</p>

      <a
        href={mailto}
        className="w-full rounded-2xl bg-[var(--accent-sage)] text-white text-center py-4 text-lg font-semibold min-h-[52px] px-5 hover:brightness-105 transition inline-flex items-center justify-center gap-2"
      >
        <span aria-hidden="true">📧</span> {t('prayerEmailCta')}
      </a>

      {/* Fallback: the mailto: link only works if the patient's device has a
          default email client registered (Outlook / Mail.app / Gmail / etc.).
          On desktop without one configured, the button silently does nothing.
          Always surfacing the plain address here lets them long-press (mobile)
          or right-click (desktop) to copy it into whichever email they use. */}
      <div className="rounded-2xl border-2 border-[var(--stroke)] bg-[var(--surface-1)] p-3 mt-3 text-center">
        <p className="text-[12px] text-[var(--ink-3)] mb-1">{t('prayerEmailFallback')}</p>
        <a
          href={mailto}
          className="text-[15px] font-semibold text-[var(--accent-sage-ink)] break-all select-all hover:underline"
        >
          {SPIRITUAL_CARE_EMAIL}
        </a>
      </div>

      <p className="text-[12px] text-[var(--ink-3)] mt-3 mb-6 text-center">
        {t('prayerPrivacyNote')}
      </p>

      <CrisisCard />
    </div>
  )
}

/**
 * Always-visible 988 crisis card. Shown on both prayer and chaplain
 * pages because the volunteer spiritual care team is not staffed 24/7
 * and patients in acute distress need a direct route to the Suicide
 * and Crisis Lifeline. Addresses P0-5 from docs/adversarial-review.md.
 */
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
