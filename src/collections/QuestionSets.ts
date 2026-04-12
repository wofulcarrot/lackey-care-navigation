import type { CollectionConfig } from 'payload'

export const QuestionSets: CollectionConfig = {
  slug: 'question-sets',
  admin: {
    description: 'Versioned groups of triage questions. Only one active set per care type.',
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
