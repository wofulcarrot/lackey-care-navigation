import type { CollectionConfig } from 'payload'

export const CareTypes: CollectionConfig = {
  slug: 'care-types',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'icon', type: 'text', required: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'sortOrder', type: 'number', required: true, defaultValue: 0 },
    { name: 'isMeta', type: 'checkbox', defaultValue: false,
      admin: { description: 'If true, this care type routes to another care type (e.g., "Not Sure")' } },
  ],
}
