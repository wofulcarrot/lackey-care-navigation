import type { CollectionConfig } from 'payload'

export const EmergencySymptoms: CollectionConfig = {
  slug: 'emergency-symptoms',
  admin: { useAsTitle: 'symptom' },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'symptom', type: 'text', required: true, localized: true },
    { name: 'sortOrder', type: 'number', required: true, defaultValue: 0 },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
  ],
}
