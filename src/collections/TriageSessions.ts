import type { CollectionConfig } from 'payload'

export const TriageSessions: CollectionConfig = {
  slug: 'triage-sessions',
  labels: { singular: 'Triage Session', plural: 'Triage Sessions' },
  admin: {
    useAsTitle: 'sessionId',
    defaultColumns: ['sessionId', 'careTypeSelected', 'urgencyResult', 'completedFlow', 'locale', 'device', 'createdAt'],
    group: 'Analytics',
    description: '⚠ Read-only. Anonymous analytics — zero PII. Rows are created automatically when patients complete triage.',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true,
    update: () => false,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'sessionId', type: 'text', required: true, unique: true, index: true },
    { name: 'careTypeSelected', type: 'relationship', relationTo: 'care-types' },
    { name: 'urgencyResult', type: 'relationship', relationTo: 'urgency-levels' },
    { name: 'resourcesShown', type: 'relationship', relationTo: 'care-resources', hasMany: true },
    { name: 'virtualCareOffered', type: 'checkbox', defaultValue: false },
    { name: 'emergencyScreenTriggered', type: 'checkbox', defaultValue: false },
    { name: 'completedFlow', type: 'checkbox', defaultValue: false },
    { name: 'locale', type: 'select', options: [
      { label: 'English', value: 'en' },
      { label: 'Spanish', value: 'es' },
    ]},
    { name: 'device', type: 'select', options: [
      { label: 'Mobile', value: 'mobile' },
      { label: 'Tablet', value: 'tablet' },
      { label: 'Desktop', value: 'desktop' },
    ]},
    { name: 'questionSetVersion', type: 'number' },
  ],
}
