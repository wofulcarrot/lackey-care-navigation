import type { CollectionConfig } from 'payload'

export const UrgencyLevels: CollectionConfig = {
  slug: 'urgency-levels',
  admin: { useAsTitle: 'name' },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'color', type: 'text', required: true,
      admin: { description: 'Hex color for UI badge (e.g., #FEE2E2)' } },
    { name: 'scoreThreshold', type: 'number', required: true,
      admin: { description: 'Minimum cumulative score. Evaluated highest-first; first match wins.' } },
    { name: 'timeToCare', type: 'text', required: true,
      admin: { description: 'e.g., "Immediate", "Same Day", "1-3 Days"' } },
    { name: 'description', type: 'textarea', localized: true },
  ],
}
