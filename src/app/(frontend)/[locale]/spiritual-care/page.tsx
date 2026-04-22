import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

/**
 * Spiritual Care hub — reached when a patient taps the Spiritual Care
 * card on the care-type screen. Unlike clinical care types (Medical,
 * Dental, etc.) this one does NOT run through the triage engine. It
 * branches into three fixed sub-flows: prayer request, church finder,
 * chaplain callback.
 *
 * The hub is a pure server component. The only client interaction is
 * navigation — each card is a Link.
 */
export default async function SpiritualCareHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('spiritualCare')

  const options = [
    {
      href: `/${locale}/spiritual-care/prayer-request`,
      icon: '🙏',
      title: t('prayerTitle'),
      description: t('prayerDescription'),
    },
    {
      href: `/${locale}/spiritual-care/find-church`,
      icon: '⛪',
      title: t('churchTitle'),
      description: t('churchDescription'),
    },
    {
      href: `/${locale}/spiritual-care/chaplain-call`,
      icon: '📞',
      title: t('chaplainTitle'),
      description: t('chaplainDescription'),
    },
  ]

  return (
    <div className="px-5 py-5 max-w-[440px] mx-auto">
      <h1 className="font-display text-[24px] leading-tight font-semibold mb-2 text-[var(--ink)]">
        {t('hubTitle')}
      </h1>
      <p className="text-[var(--ink-2)] text-[14px] mb-4">{t('hubSubtitle')}</p>
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="w-full text-left rounded-2xl p-4 min-h-[64px] transition flex items-start gap-3 border-2 border-[var(--stroke)] bg-[var(--surface-1)] text-[var(--ink)] hover:border-[var(--ink-3)]"
          >
            <span className="text-2xl leading-none shrink-0 mt-0.5" aria-hidden="true">
              {o.icon}
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-[17px] leading-snug">{o.title}</span>
              <span className="block text-[14px] text-[var(--ink-2)] mt-0.5">{o.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
