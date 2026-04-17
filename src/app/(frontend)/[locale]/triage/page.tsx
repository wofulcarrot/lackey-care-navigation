import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ErrorFallback } from '@/components/ErrorFallback'
import { TriageClient } from './client'

export default async function TriagePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ careType?: string }>
}) {
  const { locale } = await params
  const { careType: careTypeIdRaw } = await searchParams

  // Defensive: reject malformed care type IDs (e.g. "[object Object]" or "NaN"
  // from a bad client-side URL interpolation). Postgres numeric casts would
  // throw a 500 otherwise.
  const careTypeId = careTypeIdRaw?.match(/^[A-Za-z0-9_-]{1,64}$/) ? careTypeIdRaw : null
  if (!careTypeId) return <ErrorFallback />

  const payload = await getPayload({ config })

  const questionSets = await payload.find({
    collection: 'question-sets',
    where: {
      and: [
        { careType: { equals: careTypeId } },
        { isActive: { equals: true } },
      ],
    },
    depth: 2,
    locale: locale as 'en' | 'es',
    limit: 1,
  })

  const questionSet = questionSets.docs[0]

  if (!questionSet || !questionSet.questions?.length) {
    redirect(`/${locale}/results?fallback=true`)
  }

  // Extract the BH flag so the client can choose the right escalation screen
  // (CrisisAlert for Behavioral Health, EmergencyAlert for everything else).
  // With depth: 2, careType is populated as an object. Fall back to name
  // matching for legacy care types that predate the isBehavioralHealth boolean.
  const careTypeObj = questionSet.careType as { name?: string; isBehavioralHealth?: boolean } | undefined
  const isBehavioralHealth =
    typeof careTypeObj === 'object' &&
    (careTypeObj?.isBehavioralHealth === true ||
      careTypeObj?.name === 'Behavioral Health' ||
      careTypeObj?.name === 'Salud mental')

  return (
    <TriageClient
      careTypeId={careTypeId}
      isBehavioralHealth={isBehavioralHealth}
      questions={questionSet.questions as any}
      questionSetVersion={questionSet.version}
    />
  )
}
