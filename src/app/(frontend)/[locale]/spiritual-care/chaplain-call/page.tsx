import { ChaplainCallClient } from './client'

export default async function ChaplainCallPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <ChaplainCallClient locale={locale} />
}
