import type { CollectionConfig } from 'payload'

export const Questions: CollectionConfig = {
  slug: 'questions',
  labels: { singular: 'Question', plural: 'Questions' },
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['text', 'type', 'sortOrder'],
    group: 'Triage Logic',
    description: 'Individual triage questions. Questions are grouped into Question Sets per care type. Each answer has an urgency weight that contributes to the patient\'s overall score.',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: 'sortOrder',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'text', type: 'text', required: true, localized: true,
      admin: { description: 'The question shown to the patient. Keep under 15 words; target 5th-grade reading level.' } },
    { name: 'helpText', type: 'textarea', localized: true,
      admin: { description: 'Optional expandable "What does this mean?" clarification. Use plain language.' } },
    {
      name: 'type',
      type: 'select',
      required: true,
      admin: { description: 'Single Choice and Yes/No auto-advance on tap. Multiple Choice waits for a Submit button.' },
      options: [
        { label: '◯ Single Choice', value: 'single_choice' },
        { label: '☑ Multiple Choice', value: 'multi_choice' },
        { label: '✓✗ Yes / No', value: 'yes_no' },
      ],
    },
    { name: 'sortOrder', type: 'number', required: true, defaultValue: 0,
      admin: { description: 'Order within a Question Set. Lower numbers come first. Leave gaps (10, 20, 30) to ease reordering.' } },
    {
      name: 'answers',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Answer', plural: 'Answers' },
      admin: { description: 'Drag to reorder. Higher urgencyWeight = more urgent routing. Sum of all answers determines urgency level.' },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true,
          admin: { description: 'Patient-facing answer text (e.g., "Severe pain", "No")' } },
        { name: 'urgencyWeight', type: 'number', required: true, defaultValue: 0,
          admin: { description: 'Score added if this answer is picked. Typical range: 0 (no concern) to 10 (critical).' } },
        { name: 'escalateImmediately', type: 'checkbox', defaultValue: false,
          admin: { description: '⚠ Emergency override: skip scoring and route straight to 911/ER. Use for self-harm, allergic reactions, etc.' } },
        { name: 'nextQuestion', type: 'relationship', relationTo: 'questions',
          admin: { description: 'Branching: jump to this question instead of the next in sortOrder. Leave blank for default flow.' } },
        { name: 'redirectToCareType', type: 'relationship', relationTo: 'care-types',
          admin: { description: 'Meta-triage only: used by "Not Sure" to bounce a patient into a specific care type\'s flow.' } },
      ],
    },
  ],
}
