/**
 * Create a Payload admin user for CMS access.
 *
 * Usage:
 *   PAYLOAD_SECRET=... DATABASE_URI=... npx tsx src/seed/create-admin.ts [email] [password]
 *
 * Defaults: admin@lackey.local / admin123
 */

import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const email = process.argv[2] || 'admin@lackey.local'
  const password = process.argv[3] || 'admin123'

  const payload = await getPayload({ config })

  // Check if user already exists
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    // Update password
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: { password, role: 'admin' },
    })
    console.log(`Updated password for existing admin: ${email}`)
  } else {
    await payload.create({
      collection: 'users',
      data: { email, password, role: 'admin' },
    })
    console.log(`Created new admin: ${email}`)
  }

  console.log(`\nLogin at http://localhost:3000/admin`)
  console.log(`Email:    ${email}`)
  console.log(`Password: ${password}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
