import { getPayload } from 'payload'
import config from '@payload-config'
import { ResultsClient } from './client'

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const payload = await getPayload({ config })
  const content = await payload.findGlobal({ slug: 'static-content', locale: locale as 'en' | 'es' })

  return (
    <ResultsClient
      clinicPhone={content.clinicPhone}
      virtualCareUrl={content.virtualCareUrl}
      virtualCareBullets={content.virtualCareBullets?.map((b: any) => b.text).filter(Boolean) ?? []}
      eligibilityUrl={content.eligibilityIntakeUrl}
    />
  )
}
