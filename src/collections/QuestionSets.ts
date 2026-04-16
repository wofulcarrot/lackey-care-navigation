import type { CollectionConfig } from 'payload'

export const QuestionSets: CollectionConfig = {
  slug: 'question-sets',
  labels: { singular: 'Question Set', plural: 'Question Sets' },
  admin: {
    defaultColumns: ['careType', 'version', 'isActive'],
    group: 'Triage Logic',
    description: 'Versioned bundles of questions per care type. Create a new version to test clinical changes without touching the live flow; toggle "isActive" when ready to ship.',
    pagination: { defaultLimit: 25 },
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'careType', type: 'relationship', relationTo: 'care-types', required: true, index: true },
    { name: 'questions', type: 'relationship', relationTo: 'questions', hasMany: true, required: true },
    { name: 'version', type: 'number', required: true, defaultValue: 1 },
    { name: 'isActive', type: 'checkbox', defaultValue: false, index: true,
      admin: { description: 'Only one set per care type should be active' } },
  ],
}
