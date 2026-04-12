import type { CollectionConfig } from 'payload'

export const RoutingRules: CollectionConfig = {
  slug: 'routing-rules',
  admin: {
    description: 'Maps (CareType + UrgencyLevel) to resources and actions.',
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
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
