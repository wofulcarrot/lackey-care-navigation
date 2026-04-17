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

if (process.env.NODE_ENV === 'production') {
  console.error('[seed] Refusing to run in production.')
  process.exit(1)
}

async function main() {
  const email = process.argv[2] || 'admin@lackey.local'
  const password = process.argv[3]

  // In production, require an explicit password argument — never use a default.
  // The NODE_ENV guard at the top already blocks production, but be explicit.
  if (process.env.NODE_ENV === 'production' && !password) {
    console.error('[create-admin] ERROR: Password argument is required in production.')
    console.error('  Usage: npx tsx src/seed/create-admin.ts admin@lackey.org YOUR_STRONG_PASSWORD')
    process.exit(1)
  }

  const safePassword = password || 'admin123' // dev-only default

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
      data: { password: safePassword, role: 'admin' },
    })
    console.log(`Updated password for existing admin: ${email}`)
  } else {
    await payload.create({
      collection: 'users',
      data: { email, password: safePassword, role: 'admin' },
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
