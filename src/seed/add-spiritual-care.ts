/**
 * One-shot seed — adds the Spiritual Care care type + a placeholder
 * spiritual caregiver row so the feature works end-to-end the moment
 * the PR deploys. Idempotent: safe to re-run.
 *
 *   set -a && source .env.production.local && set +a
 *   npx tsx src/seed/add-spiritual-care.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })

  // ── Care type (upsert) ────────────────────────────────────────────
  const existing = await payload.find({
    collection: 'care-types',
    where: { name: { equals: 'Spiritual Care' } },
    limit: 1,
    overrideAccess: true,
  })

  const spiritualData = {
    name: 'Spiritual Care',
    icon: '🙏',
    description: 'Prayer, find a local church, or talk with a chaplain',
    sortOrder: 7,
    isMeta: false,
    customRoute: '/spiritual-care',
  }

  if (existing.docs.length === 0) {
    const created = await payload.create({
      collection: 'care-types',
      data: spiritualData,
      overrideAccess: true,
    })
    console.log(`Created care type: Spiritual Care (id=${created.id})`)

    // Spanish translation for the Not Sure meta-triage flow. Every
    // care type label on that screen needs EN + ES.
    await payload.update({
      collection: 'care-types',
      id: created.id,
      locale: 'es',
      data: {
        name: 'Cuidado espiritual',
        description: 'Oración, encontrar una iglesia local, o hablar con un capellán',
      },
      overrideAccess: true,
    })
    console.log('  + Spanish translation added')
  } else {
    const id = existing.docs[0].id
    await payload.update({
      collection: 'care-types',
      id,
      data: spiritualData,
      overrideAccess: true,
    })
    console.log(`Updated care type: Spiritual Care (id=${id})`)

    await payload.update({
      collection: 'care-types',
      id,
      locale: 'es',
      data: {
        name: 'Cuidado espiritual',
        description: 'Oración, encontrar una iglesia local, o hablar con un capellán',
      },
      overrideAccess: true,
    })
    console.log('  + Spanish translation refreshed')
  }

  // ── Placeholder caregiver — Pedro will fill in the real rotation ──
  const existingCaregivers = await payload.find({
    collection: 'spiritual-caregivers',
    limit: 1,
    overrideAccess: true,
  })
  if (existingCaregivers.docs.length === 0) {
    await (payload.create as any)({
      collection: 'spiritual-caregivers',
      data: {
        name: 'Lackey Clinic Spiritual Care Team (placeholder)',
        role: 'Replace with real caregivers before launch',
        phone: '(757) 547-7484',
        email: 'spiritual-care@lackeyclinic.org',
        isActive: true,
        languages: ['en'],
        notes:
          'Placeholder row inserted by add-spiritual-care.ts. Pedro will populate ' +
          'the real rotation before go-live. Chaplain callback requests fall back to ' +
          'the main clinic phone until replaced.',
      },
      overrideAccess: true,
    })
    console.log('Created placeholder spiritual caregiver (Pedro: replace before launch)')
  } else {
    console.log(`Spiritual caregivers already seeded (${existingCaregivers.totalDocs} rows); skipping placeholder.`)
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
