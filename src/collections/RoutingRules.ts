import type { CollectionConfig } from 'payload'

export const RoutingRules: CollectionConfig = {
  slug: 'routing-rules',
  labels: { singular: 'Routing Rule', plural: 'Routing Rules' },
  admin: {
    useAsTitle: 'actionText',
    defaultColumns: ['careType', 'urgencyLevel', 'virtualCareEligible', 'actionText'],
    group: 'Triage Logic',
    description: 'The core routing table. Each row maps (Care Type + Urgency Level) to a list of resources and a CTA. Only one rule allowed per combination.',
    pagination: { defaultLimit: 50 },
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'create' || operation === 'update') {
          const careType = data?.careType
          const urgencyLevel = data?.urgencyLevel
          if (!careType || !urgencyLevel) return data

          const existing = await req.payload.find({
            collection: 'routing-rules',
            where: {
              and: [
                { careType: { equals: careType } },
                { urgencyLevel: { equals: urgencyLevel } },
              ],
            },
            limit: 1,
          })

          const isDuplicate = existing.docs.length > 0 &&
            (operation === 'create' || existing.docs[0].id !== originalDoc?.id)

          if (isDuplicate) {
            throw new Error('A routing rule for this Care Type and Urgency Level combination already exists.')
          }
        }
        return data
      },
    ],
  },
  fields: [
    { type: 'row', fields: [
      { name: 'careType', type: 'relationship', relationTo: 'care-types', required: true, index: true,
        admin: { width: '50%', description: 'Which care type this rule applies to' } },
      { name: 'urgencyLevel', type: 'relationship', relationTo: 'urgency-levels', required: true, index: true,
        admin: { width: '50%', description: 'Which urgency level this rule applies to' } },
    ]},
    { name: 'resources', type: 'relationship', relationTo: 'care-resources', hasMany: true, required: true,
      admin: { description: 'Resources shown to the patient (in order). Tip: put the highest-priority resource first.' } },
    { name: 'virtualCareEligible', type: 'checkbox', defaultValue: false,
      admin: { description: 'If true, patient sees the Virtual Care interstitial before the resources list.' } },
    { name: 'actionText', type: 'text', required: true, localized: true,
      admin: { description: 'Primary call-to-action at the top of results (e.g., "Call 911", "Start a Free Virtual Visit", "Visit Lackey Clinic")' } },
    { name: 'nextSteps', type: 'richText', localized: true,
      admin: { description: 'Optional extended instructions shown below the resources. Supports paragraphs, lists, and links.' } },
  ],
}
