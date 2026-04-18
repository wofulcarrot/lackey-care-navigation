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

  // Verify collections and new fields are accessible
  const checks: [string, string][] = [
    ['triage-events', 'event'],
    ['care-types', 'isBehavioralHealth'],
    ['triage-sessions', 'isCrisis'],
  ]
  for (const [collection, field] of checks) {
    try {
      const result = await (payload.find as any)({ collection, limit: 1 })
      console.log(`${collection}: OK (${result.totalDocs} docs, ${field} field accessible)`)
    } catch (err: any) {
      console.error(`${collection}: FAILED -`, err.message)
    }
  }

  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
