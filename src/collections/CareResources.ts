import type { CollectionConfig } from 'payload'

export const CareResources: CollectionConfig = {
  slug: 'care-resources',
  admin: { useAsTitle: 'name' },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Emergency Room', value: 'er' },
        { label: 'Urgent Care', value: 'urgent_care' },
        { label: 'Primary Care', value: 'primary_care' },
        { label: 'Dental', value: 'dental' },
        { label: 'Virtual Care', value: 'virtual' },
        { label: 'Pharmacy', value: 'pharmacy' },
        { label: 'Social Services', value: 'social_services' },
        { label: 'Crisis Line', value: 'crisis_line' },
        { label: 'Behavioral Health', value: 'behavioral_health' },
        { label: 'Health Department', value: 'health_department' },
      ],
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'zip', type: 'text' },
        { name: 'latitude', type: 'number', admin: { step: 0.0001, description: 'Decimal degrees, e.g. 36.8468' } },
        { name: 'longitude', type: 'number', admin: { step: 0.0001, description: 'Decimal degrees, e.g. -76.2852' } },
      ],
    },
    { name: 'phone', type: 'text' },
    {
      name: 'hours',
      type: 'array',
      fields: [
        { name: 'day', type: 'text', required: true },
        { name: 'open', type: 'text', required: true },
        { name: 'close', type: 'text', required: true },
      ],
    },
    { name: 'is24_7', type: 'checkbox', defaultValue: false },
    { name: 'website', type: 'text' },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'cost',
      type: 'select',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Sliding Scale', value: 'sliding_scale' },
        { label: 'Insurance Required', value: 'insurance_required' },
      ],
    },
    { name: 'eligibility', type: 'textarea', localized: true },
    { name: 'isActive', type: 'checkbox', defaultValue: true, index: true },
    { name: 'temporaryNotice', type: 'text', localized: true,
      admin: { description: 'Alert banner shown on the resource card (e.g., "Closed for holiday until Jan 2")' } },
    { name: 'temporaryNoticeExpires', type: 'date',
      admin: { description: 'Auto-clears the temporary notice after this date' } },
  ],
}
