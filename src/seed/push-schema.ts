/**
 * Force Payload to push schema to the database.
 * Use this when a new collection has been added but the production DB
 * hasn't been updated (Vercel production builds don't auto-push schema).
 */
import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  console.log('Initializing Payload (this pushes schema)...')
  const payload = await getPayload({ config })
  console.log('Schema pushed successfully.')

  // Verify new collections are accessible
  try {
    const result = await (payload.find as any)({ collection: 'triage-events', limit: 1 })
    console.log('triage-events collection: OK (' + result.totalDocs + ' docs)')
  } catch (err: any) {
    console.error('triage-events collection: FAILED -', err.message)
  }

  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
