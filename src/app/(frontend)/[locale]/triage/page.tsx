import { getPayload } from 'payload'
import config from '@payload-config'
import { TriageClient } from './client'

export default async function TriagePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ careType?: string }>
}) {
  const { locale } = await params
  const { careType: careTypeId } = await searchParams
  if (!careTypeId) return <div>Missing care type</div>

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
    return <div>Redirecting to results...</div>
  }

  return (
    <TriageClient
      careTypeId={careTypeId}
      questions={questionSet.questions as any}
      questionSetVersion={questionSet.version}
    />
  )
}
