import type { CollectionConfig } from 'payload'

export const UrgencyLevels: CollectionConfig = {
  slug: 'urgency-levels',
  labels: { singular: 'Urgency Level', plural: 'Urgency Levels' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'scoreThreshold', 'timeToCare', 'color'],
    group: 'Triage Logic',
    description: 'The 6 urgency tiers that patient scores map to. Thresholds are evaluated highest-first — the first match wins.',
  },
  defaultSort: '-scoreThreshold',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true,
      admin: { description: 'Patient-facing label (e.g., "Urgent", "Routine")' } },
    { name: 'color', type: 'text', required: true,
      admin: { description: 'Hex color for the badge on the results page (e.g., #FEE2E2 red, #DBEAFE blue, #EDE9FE purple)' } },
    { name: 'scoreThreshold', type: 'number', required: true,
      admin: { description: 'Minimum cumulative score to hit this level. Life-Threatening: 20, Emergent: 15, Urgent: 10, Semi-Urgent: 5, Routine: 2, Elective: 0' } },
    { name: 'timeToCare', type: 'text', required: true,
      admin: { description: 'Expected timeframe, e.g., "Immediate", "Same Day", "1-3 Days", "1-2 Weeks"' } },
    { name: 'description', type: 'textarea', localized: true,
      admin: { description: 'Optional longer explanation shown to patient' } },
  ],
}
