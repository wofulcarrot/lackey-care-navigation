/**
 * Cleanup — remove every TriageSession + TriageEvent created by
 * dashboard-demo-data.ts. Matches on sessionId prefix `demo-` so it
 * can't touch real pilot traffic (those have UUID sessionIds).
 *
 * Run with:
 *   set -a && source .env.production.local && set +a
 *   npx tsx src/seed/clean-dashboard-demo-data.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })

  console.log('Deleting demo sessions…')
  const sessionsDel = await (payload.delete as any)({
    collection: 'triage-sessions',
    where: { sessionId: { like: 'demo-%' } },
    overrideAccess: true,
  })
  console.log(`  ${sessionsDel.docs?.length ?? 0} sessions deleted`)

  console.log('Deleting demo events…')
  const eventsDel = await (payload.delete as any)({
    collection: 'triage-events',
    where: { sessionId: { like: 'demo-%' } },
    overrideAccess: true,
  })
  console.log(`  ${eventsDel.docs?.length ?? 0} events deleted`)

  console.log('\nDone.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
