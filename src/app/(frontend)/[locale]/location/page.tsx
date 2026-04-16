import { LocationScreenClient } from './client'

export default async function LocationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <LocationScreenClient locale={locale} />
}
