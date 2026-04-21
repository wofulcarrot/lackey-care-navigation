/**
 * Quick diagnostic — print the Payload users so we can recover a
 * forgotten admin email. Reads DATABASE_URI from env.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })
  const users = await payload.find({
    collection: 'users',
    limit: 20,
    overrideAccess: true,
  })
  console.log(`\nUsers (${users.totalDocs}):`)
  for (const u of users.docs) {
    const user = u as { email?: string; role?: string; createdAt?: string }
    console.log(`  ${user.email}  role=${user.role}  created=${user.createdAt}`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
