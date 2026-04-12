import { getPayload } from 'payload'
import config from '@payload-config'
import { EmergencyScreenClient } from './client'

interface EmergencySymptomDoc {
  id: string
  symptom: string
}

export default async function EmergencyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const payload = await getPayload({ config })
  const symptoms = await payload.find({
    collection: 'emergency-symptoms',
    where: { isActive: { equals: true } },
    sort: 'sortOrder',
    limit: 100,
    locale,
  })

  return (
    <EmergencyScreenClient
      symptoms={symptoms.docs as unknown as EmergencySymptomDoc[]}
    />
  )
}
