import { PrayerRequestClient } from './client'

export default async function PrayerRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <PrayerRequestClient locale={locale} />
}
