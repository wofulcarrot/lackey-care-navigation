import type { CollectionConfig } from 'payload'

export const CareTypes: CollectionConfig = {
  slug: 'care-types',
  labels: { singular: 'Care Type', plural: 'Care Types' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['icon', 'name', 'sortOrder', 'isMeta'],
    group: 'Triage Logic',
    description: 'Top-level categories a patient can choose from on the Care Type screen (Medical, Dental, Vision, etc.). Order controls how they appear to patients.',
    pagination: { defaultLimit: 25 },
  },
  defaultSort: 'sortOrder',
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true,
      admin: { description: 'Patient-facing name (e.g., "Medical", "Dental")' } },
    { name: 'icon', type: 'text', required: true,
      admin: { description: 'Single emoji shown on the card, e.g. 🩺 🦷 👁️ 🧠 💊' } },
    { name: 'description', type: 'textarea', localized: true,
      admin: { description: 'Short subtitle shown below the name. Keep under 12 words.' } },
    { name: 'sortOrder', type: 'number', required: true, defaultValue: 0,
      admin: { description: 'Lower numbers appear first. Leave gaps (10, 20, 30) to make reordering easier.' } },
    { name: 'isMeta', type: 'checkbox', defaultValue: false,
      admin: { description: 'Meta care types ("Not Sure") use redirectToCareType answers to route into a real care type.' } },
    { name: 'isBehavioralHealth', type: 'checkbox', defaultValue: false,
      admin: { description: 'When true, triage escalation shows the 988 crisis screen' } },
  ],
}
