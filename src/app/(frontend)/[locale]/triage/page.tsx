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
    locale,
    limit: 1,
  })

  const questionSet = questionSets.docs[0]

  if (!questionSet || !questionSet.questions?.length) {
    redirect(`/${locale}/results?fallback=true`)
  }

  return (
    <TriageClient
      careTypeId={careTypeId}
      questions={questionSet.questions as any}
      questionSetVersion={questionSet.version}
    />
  )
}
