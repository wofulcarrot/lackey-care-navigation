import type { GlobalConfig } from 'payload'

export const StaticContent: GlobalConfig = {
  slug: 'static-content',
  label: 'Site Content',
  admin: {
    group: 'Content',
    description: 'Site-wide configuration: Virtual Care interstitial, clinic phone, and eligibility intake URL. Hero, footer, and disclaimer copy now lives in src/i18n/messages/*.json.',
  },
  access: {
    read: () => true,
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Virtual Care',
          description: 'Zipnosis (LUCA) intake link and interstitial bullets',
          fields: [
            { name: 'virtualCareUrl', type: 'text', required: true,
              admin: { description: 'Zipnosis/LUCA guest visit URL (currently https://luca.zipnosis.com/guest_visits/new?l=en)' } },
            {
              name: 'virtualCareBullets', type: 'array',
              labels: { singular: 'Bullet', plural: 'Bullets' },
              admin: { description: 'Short benefit bullets shown on the Virtual Care interstitial (drag to reorder).' },
              fields: [
                { name: 'text', type: 'text', required: true, localized: true,
                  admin: { placeholder: 'Free for adults 18+' } },
              ],
            },
          ],
        },
        {
          label: 'Clinic Contact',
          description: 'Phone numbers and external integrations',
          fields: [
            { name: 'clinicPhone', type: 'text', required: true,
              admin: { description: 'Lackey Clinic main phone — used as a fallback on the error page and in results cards' } },
            { name: 'eligibilityIntakeUrl', type: 'text', required: true,
              admin: { description: 'Where patients go to check if they qualify for free care (currently JotForm; will migrate to DataCare 2.0)' } },
          ],
        },
      ],
    },
  ],
}
