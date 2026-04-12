import { useTranslations } from 'next-intl'

export function EmergencyBanner() {
  const t = useTranslations('landing')
  return (
    <a
      href="tel:911"
      className="block w-full bg-red-600 text-white text-center py-3 font-bold text-lg"
    >
      🚨 {t('call911')}
    </a>
  )
}
