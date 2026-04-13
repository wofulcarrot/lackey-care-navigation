import { getPayload } from 'payload'
import config from '@payload-config'

import { emergencySymptoms } from './emergency-symptoms'
import { careTypes } from './care-types'
import { urgencyLevels } from './urgency-levels'
import { careResources } from './care-resources'
import { createQuestionSets } from './question-sets'
import { createRoutingRules } from './routing-rules'

// NOTE: This script is NOT idempotent. Drop/reset the database before re-running.
async function seed() {
  const payload = await getPayload({ config })

  try {
    console.log('Seeding emergency symptoms...')
    for (const symptom of emergencySymptoms) {
      await payload.create({ collection: 'emergency-symptoms', data: symptom })
    }

    console.log('Seeding care types...')
    const createdCareTypes: Record<string, number | string> = {}
    for (const ct of careTypes) {
      const created = await payload.create({ collection: 'care-types', data: ct })
      createdCareTypes[ct.name] = created.id
    }

    console.log('Seeding urgency levels...')
    const createdLevels: Record<string, number | string> = {}
    for (const level of urgencyLevels) {
      const created = await payload.create({ collection: 'urgency-levels', data: level })
      createdLevels[level.name] = created.id
    }

    console.log('Seeding care resources...')
    const createdResources: Record<string, number | string> = {}
    for (const resource of careResources) {
      const created = await payload.create({ collection: 'care-resources', data: resource })
      createdResources[resource.name] = created.id
    }

    console.log('Seeding question sets...')
    await createQuestionSets(payload, createdCareTypes)

    console.log('Seeding routing rules...')
    await createRoutingRules(payload, createdCareTypes, createdLevels, createdResources)

    console.log('Seeding static content...')
    await payload.updateGlobal({
      slug: 'static-content',
      data: {
        heroTitle: 'Get the right care, right now',
        heroSubtitle: 'Free help finding the care you need — no insurance required',
        virtualCareUrl: 'https://www.lackeyhealthcare.org/virtual-care',
        virtualCareHeading: 'You may be able to get free care right now',
        virtualCareBullets: [
          { text: 'Free for adults 18+' },
          { text: 'Available 24/7' },
          { text: 'No insurance needed' },
          { text: '95% handled fully online' },
          { text: 'Private and secure' },
        ],
        eligibilityIntakeUrl: 'https://form.jotform.com/lackey-eligibility',
        clinicPhone: '(757) 547-7484',
        privacyNote: 'We don\'t collect personal information.',
        footerText: 'Powered by Lackey Clinic',
      },
    })

    console.log('Seed complete!')
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

seed()
