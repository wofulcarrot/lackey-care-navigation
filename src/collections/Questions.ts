import type { CollectionConfig } from 'payload'

export const Questions: CollectionConfig = {
  slug: 'questions',
  admin: { useAsTitle: 'text' },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'text', type: 'text', required: true, localized: true },
    { name: 'helpText', type: 'textarea', localized: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Single Choice', value: 'single_choice' },
        { label: 'Multiple Choice', value: 'multi_choice' },
        { label: 'Yes / No', value: 'yes_no' },
      ],
    },
    { name: 'sortOrder', type: 'number', required: true, defaultValue: 0 },
    {
      name: 'answers',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'urgencyWeight', type: 'number', required: true, defaultValue: 0 },
        { name: 'escalateImmediately', type: 'checkbox', defaultValue: false,
          admin: { description: 'If true, immediately route to 911/ER' } },
        { name: 'nextQuestion', type: 'relationship', relationTo: 'questions',
          admin: { description: 'Optional: jump to this question instead of following sortOrder' } },
        { name: 'redirectToCareType', type: 'relationship', relationTo: 'care-types',
          admin: { description: 'For "Not Sure" meta-triage: route into this care type\'s questions' } },
      ],
    },
  ],
}
