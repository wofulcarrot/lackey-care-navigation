import { getPayload } from 'payload'
import config from '@payload-config'
import { VirtualCarePageClient } from './client'

export default async function VirtualCarePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const payload = await getPayload({ config })
  const content = await payload.findGlobal({ slug: 'static-content', locale })

  return (
    <VirtualCarePageClient
      virtualCareUrl={content.virtualCareUrl}
      bullets={content.virtualCareBullets?.map((b: any) => b.text) ?? []}
    />
  )
}
