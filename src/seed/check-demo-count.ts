/**
 * Quick count of demo-prefixed rows in Neon so we can tell if an
 * earlier seed run partially succeeded.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })
  const sessions = await payload.find({
    collection: 'triage-sessions',
    where: { sessionId: { like: 'demo-%' } },
    limit: 0,
    overrideAccess: true,
  })
  const events = await (payload.find as any)({
    collection: 'triage-events',
    where: { sessionId: { like: 'demo-%' } },
    limit: 0,
    overrideAccess: true,
  })
  console.log(`demo sessions: ${sessions.totalDocs}, demo events: ${events.totalDocs}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
