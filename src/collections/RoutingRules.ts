import type { CollectionConfig } from 'payload'

export const RoutingRules: CollectionConfig = {
  slug: 'routing-rules',
  admin: {
    description: 'Maps (CareType + UrgencyLevel) to resources and actions.',
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
    { name: 'careType', type: 'relationship', relationTo: 'care-types', required: true, index: true },
    { name: 'urgencyLevel', type: 'relationship', relationTo: 'urgency-levels', required: true, index: true },
    { name: 'resources', type: 'relationship', relationTo: 'care-resources', hasMany: true, required: true },
    { name: 'virtualCareEligible', type: 'checkbox', defaultValue: false },
    { name: 'actionText', type: 'text', required: true, localized: true,
      admin: { description: 'Primary CTA text, e.g., "Call 911", "Start a Free Virtual Visit"' } },
    { name: 'nextSteps', type: 'richText', localized: true },
  ],
}
