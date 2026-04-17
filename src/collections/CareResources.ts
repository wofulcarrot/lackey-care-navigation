import type { CollectionConfig } from 'payload'

export const CareResources: CollectionConfig = {
  slug: 'care-resources',
  labels: { singular: 'Care Resource', plural: 'Care Resources' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'cost', 'isActive', 'temporaryNotice'],
    listSearchableFields: ['name', 'address.city', 'address.zip', 'phone'],
    group: 'Content',
    description: 'Providers shown to patients (hospitals, urgent cares, Lackey Clinic, crisis lines, etc.). Editors can update hours, phone, and notices.',
    pagination: { defaultLimit: 25 },
  },
  defaultSort: 'name',
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (doc.temporaryNoticeExpires && new Date(doc.temporaryNoticeExpires) < new Date()) {
          return { ...doc, temporaryNotice: null }
        }
        return doc
      },
    ],
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basics',
          description: 'Core identity and contact info',
          fields: [
            { name: 'name', type: 'text', required: true,
              admin: { description: 'Provider name as it appears to patients (e.g., "Lackey Clinic", "Sentara Norfolk General")' } },
            {
              name: 'type',
              type: 'select',
              required: true,
              admin: { description: 'Determines which category this resource falls under in routing rules' },
              options: [
                { label: '🚨 Emergency Room', value: 'er' },
                { label: '🏥 Urgent Care', value: 'urgent_care' },
                { label: '🩺 Primary Care', value: 'primary_care' },
                { label: '🦷 Dental', value: 'dental' },
                { label: '💻 Virtual Care', value: 'virtual' },
                { label: '💊 Pharmacy', value: 'pharmacy' },
                { label: '🤝 Social Services', value: 'social_services' },
                { label: '📞 Crisis Line', value: 'crisis_line' },
                { label: '🧠 Behavioral Health', value: 'behavioral_health' },
                { label: '🏛️ Health Department', value: 'health_department' },
              ],
            },
            { name: 'phone', type: 'text',
              admin: { description: 'Format: (757) 547-7484 — shown as click-to-call on mobile' } },
            { name: 'website', type: 'text',
              admin: { description: 'Full URL including https://' } },
            { name: 'description', type: 'textarea', localized: true,
              admin: { description: 'One-sentence description shown on the resource card' } },
          ],
        },
        {
          label: 'Location',
          description: 'Address and coordinates (coordinates enable "closest to me" distance sorting and dashboard map)',
          fields: [
            {
              name: 'address',
              type: 'group',
              fields: [
                { type: 'row', fields: [
                  { name: 'street', type: 'text', admin: { width: '100%' } },
                ]},
                { type: 'row', fields: [
                  { name: 'city', type: 'text', admin: { width: '60%' } },
                  { name: 'state', type: 'text', admin: { width: '20%' } },
                  { name: 'zip', type: 'text', admin: { width: '20%' } },
                ]},
                { type: 'row', fields: [
                  { name: 'latitude', type: 'number', admin: { step: 0.0001, width: '50%', description: 'Decimal degrees, e.g. 36.8468 (use maps.google.com — right-click → coordinates)' } },
                  { name: 'longitude', type: 'number', admin: { step: 0.0001, width: '50%', description: 'Decimal degrees, e.g. -76.2852' } },
                ]},
              ],
            },
          ],
        },
        {
          label: 'Hours',
          description: 'Weekly schedule (or check "Open 24/7" for hospitals and crisis lines)',
          fields: [
            { name: 'is24_7', type: 'checkbox', defaultValue: false,
              admin: { description: 'If checked, hours below are ignored and a "Open 24/7" badge displays.' } },
            {
              name: 'hours',
              type: 'array',
              admin: { description: 'Add one row per day the provider is open. Skip days they are closed.' },
              fields: [
                { type: 'row', fields: [
                  { name: 'day', type: 'text', required: true, admin: { width: '34%', placeholder: 'Monday' } },
                  { name: 'open', type: 'text', required: true, admin: { width: '33%', placeholder: '8:00 AM' } },
                  { name: 'close', type: 'text', required: true, admin: { width: '33%', placeholder: '5:00 PM' } },
                ]},
              ],
            },
          ],
        },
        {
          label: 'Eligibility & Cost',
          description: 'Who can use this resource and at what cost',
          fields: [
            {
              name: 'cost',
              type: 'select',
              admin: { description: 'Shown as a colored badge on the resource card' },
              options: [
                { label: '💚 Free', value: 'free' },
                { label: '💛 Sliding Scale', value: 'sliding_scale' },
                { label: '💰 Insurance Required', value: 'insurance_required' },
              ],
            },
            { name: 'eligibility', type: 'textarea', localized: true,
              admin: { description: 'Plain-language eligibility notes, e.g., "Uninsured adults 18+ in Hampton Roads"' } },
          ],
        },
        {
          label: 'Status & Notices',
          description: 'Activate/deactivate and post temporary banners',
          fields: [
            { name: 'isActive', type: 'checkbox', defaultValue: true, index: true,
              admin: { description: 'Uncheck to hide this resource from triage results without deleting it.' } },
            { name: 'temporaryNotice', type: 'text', localized: true,
              admin: { description: 'Yellow alert banner on the resource card, e.g., "Closed for holiday until Jan 2"' } },
            { name: 'temporaryNoticeExpires', type: 'date',
              admin: { description: 'Auto-clears the temporary notice after this date. Leave blank for no expiration.' } },
          ],
        },
      ],
    },
  ],
}
