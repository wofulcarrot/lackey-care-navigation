import type { CollectionConfig } from 'payload'

export const QuestionSets: CollectionConfig = {
  slug: 'question-sets',
  admin: {
    useAsTitle: 'careType',
    description: 'Versioned groups of triage questions. Only one active set per care type.',
  },
  fields: [
    { name: 'careType', type: 'relationship', relationTo: 'care-types', required: true },
    { name: 'questions', type: 'relationship', relationTo: 'questions', hasMany: true, required: true },
    { name: 'version', type: 'number', required: true, defaultValue: 1 },
    { name: 'isActive', type: 'checkbox', defaultValue: false,
      admin: { description: 'Only one set per care type should be active' } },
  ],
}
