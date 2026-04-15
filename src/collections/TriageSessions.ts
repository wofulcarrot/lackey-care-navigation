import type { CollectionConfig } from 'payload'

export const TriageSessions: CollectionConfig = {
  slug: 'triage-sessions',
  labels: { singular: 'Triage Session', plural: 'Triage Sessions' },
  admin: {
    useAsTitle: 'sessionId',
    defaultColumns: ['sessionId', 'careTypeSelected', 'urgencyResult', 'completedFlow', 'locale', 'device', 'createdAt'],
    group: 'Analytics',
    description: '⚠ Read-only. Anonymous analytics — zero PII. Rows are created automatically when patients complete triage.',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: '-createdAt',
  access: {
    // SECURITY: ALL operations require an authenticated admin/editor. The
    // legitimate server-side payload.create() calls from /api/triage/evaluate
    // and /api/triage/log-emergency pass `overrideAccess: true` to bypass
    // this check (they're server-trusted paths with their own rate limiting
    // and input validation). Public REST POST to /api/triage-sessions will
    // now return 403 — closing the analytics-poisoning hole where an
    // attacker could otherwise flood the table and skew dashboard metrics.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: () => false,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'sessionId', type: 'text', required: true, unique: true, index: true },
    { name: 'careTypeSelected', type: 'relationship', relationTo: 'care-types' },
    { name: 'urgencyResult', type: 'relationship', relationTo: 'urgency-levels' },
    { name: 'resourcesShown', type: 'relationship', relationTo: 'care-resources', hasMany: true },
    { name: 'virtualCareOffered', type: 'checkbox', defaultValue: false },
    { name: 'emergencyScreenTriggered', type: 'checkbox', defaultValue: false },
    { name: 'completedFlow', type: 'checkbox', defaultValue: false },
    { name: 'locale', type: 'select', options: [
      { label: 'English', value: 'en' },
      { label: 'Spanish', value: 'es' },
    ]},
    { name: 'device', type: 'select', options: [
      { label: 'Mobile', value: 'mobile' },
      { label: 'Tablet', value: 'tablet' },
      { label: 'Desktop', value: 'desktop' },
    ]},
    { name: 'questionSetVersion', type: 'number' },
  ],
}
