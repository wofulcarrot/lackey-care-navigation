import { FindChurchClient } from './client'

export default async function FindChurchPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <FindChurchClient locale={locale} />
}
