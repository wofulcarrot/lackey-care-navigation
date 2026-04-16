import type { CollectionConfig } from 'payload'

export const EmergencySymptoms: CollectionConfig = {
  slug: 'emergency-symptoms',
  labels: { singular: 'Emergency Symptom', plural: 'Emergency Symptoms' },
  admin: {
    useAsTitle: 'symptom',
    defaultColumns: ['symptom', 'sortOrder', 'isActive'],
    group: 'Content',
    description: 'Life-threatening symptoms shown on the Emergency Screen. Checking any one triggers an immediate 911 alert.',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: 'sortOrder',
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'symptom', type: 'text', required: true, localized: true },
    { name: 'sortOrder', type: 'number', required: true, defaultValue: 0 },
    { name: 'isActive', type: 'checkbox', defaultValue: true, index: true },
  ],
}
