import { getPayload } from 'payload'
import config from '@payload-config'
import { CareTypeSelectionClient } from './client'

interface CareTypeDoc {
  id: string
  name: string
  icon: string
  description: string
  isMeta: boolean
}

export default async function CareTypePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const payload = await getPayload({ config })
  const careTypes = await payload.find({
    collection: 'care-types',
    sort: 'sortOrder',
    limit: 100,
    locale: locale as 'en' | 'es',
  })

  return (
    <CareTypeSelectionClient
      careTypes={careTypes.docs as unknown as CareTypeDoc[]}
    />
  )
}
