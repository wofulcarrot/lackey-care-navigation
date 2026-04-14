import type { GlobalConfig } from 'payload'

export const StaticContent: GlobalConfig = {
  slug: 'static-content',
  label: 'Site Content',
  admin: {
    group: 'Content',
    description: 'Site-wide copy: landing hero, Virtual Care interstitial, phone numbers, disclaimers, and footer. Shared across English and Spanish (toggle locale to translate).',
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
          label: 'Landing Page',
          description: 'Hero copy on the patient home screen',
          fields: [
            { name: 'heroTitle', type: 'text', required: true, localized: true,
              admin: { description: 'Main headline (e.g., "Get the right care, right now"). Keep under 8 words.' } },
            { name: 'heroSubtitle', type: 'text', localized: true,
              admin: { description: 'Supporting line below the headline' } },
          ],
        },
        {
          label: 'Virtual Care',
          description: 'Zipnosis (LUCA) intake link and interstitial content',
          fields: [
            { name: 'virtualCareUrl', type: 'text', required: true,
              admin: { description: 'Zipnosis/LUCA guest visit URL (currently https://luca.zipnosis.com/guest_visits/new?l=en)' } },
            { name: 'virtualCareHeading', type: 'text', localized: true,
              admin: { description: 'Headline on the "You may qualify for free care" interstitial' } },
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
        {
          label: 'Legal & Footer',
          description: 'Disclaimers and footer text required for compliance',
          fields: [
            {
              name: 'disclaimers', type: 'array',
              labels: { singular: 'Disclaimer', plural: 'Disclaimers' },
              admin: { description: 'Collapsed under "Important Information" in the footer. Reviewed by Lackey\'s compliance team.' },
              fields: [
                { name: 'text', type: 'textarea', required: true, localized: true },
              ],
            },
            { name: 'privacyNote', type: 'text', localized: true,
              admin: { description: 'Short privacy reminder in the footer (e.g., "We don\'t collect personal information.")' } },
            { name: 'footerText', type: 'text', localized: true,
              admin: { description: '"Powered by" line at the bottom of every page' } },
          ],
        },
      ],
    },
  ],
}
