import type { GlobalConfig } from 'payload'

export const StaticContent: GlobalConfig = {
  slug: 'static-content',
  access: {
    read: () => true,
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
  },
  fields: [
    { name: 'heroTitle', type: 'text', required: true, localized: true },
    { name: 'heroSubtitle', type: 'text', localized: true },
    { name: 'virtualCareUrl', type: 'text', required: true,
      admin: { description: 'Virtual Care intake URL (configured by Traverse)' } },
    { name: 'virtualCareHeading', type: 'text', localized: true },
    { name: 'virtualCareBullets', type: 'array', fields: [
      { name: 'text', type: 'text', required: true, localized: true },
    ]},
    { name: 'eligibilityIntakeUrl', type: 'text', required: true,
      admin: { description: 'JotForm URL now; swap to DataCare 2.0 later' } },
    { name: 'clinicPhone', type: 'text', required: true,
      admin: { description: 'Lackey Clinic main phone number for fallback' } },
    { name: 'disclaimers', type: 'array', fields: [
      { name: 'text', type: 'textarea', required: true, localized: true },
    ]},
    { name: 'privacyNote', type: 'text', localized: true },
    { name: 'footerText', type: 'text', localized: true },
  ],
}
