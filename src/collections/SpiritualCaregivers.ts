import type { CollectionConfig } from 'payload'

/**
 * The rotation list Pedro is building — people in ministry who have
 * agreed to take Spiritual Care callbacks. Chaplain callback requests
 * are round-robin-routed to the next active caregiver (simple
 * createdAt-based rotation; see src/lib/spiritual-caregiver-rotation.ts).
 *
 * Kept strictly admin-only — no public read. The patient never sees
 * these names until a caregiver calls them back.
 */
export const SpiritualCaregivers: CollectionConfig = {
  slug: 'spiritual-caregivers',
  labels: { singular: 'Spiritual Caregiver', plural: 'Spiritual Caregivers' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'isActive', 'lastContactedAt'],
    group: 'Spiritual Care',
    description:
      'The rotation of ministry volunteers who take Spiritual Care callbacks. ' +
      'Toggle isActive off when someone is on vacation; the rotation auto-skips them. ' +
      'The lastContactedAt timestamp auto-updates when a request is assigned.',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: 'name',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true,
      admin: { description: 'Full name of the caregiver (e.g., "Pastor Jane Doe").' } },
    { name: 'role', type: 'text',
      admin: { description: 'Title/denomination, e.g., "Chaplain, First Baptist"; shown to Pedro in the admin only.' } },
    { name: 'phone', type: 'text', required: true,
      admin: { description: 'Mobile or office number. This is where callback requests get routed.' } },
    { name: 'email', type: 'email',
      admin: { description: 'Optional secondary contact for prayer-request email threads.' } },
    { name: 'isActive', type: 'checkbox', defaultValue: true,
      admin: { description: 'Uncheck when a caregiver is unavailable. The rotation skips inactive rows.' } },
    { name: 'languages', type: 'select', hasMany: true,
      options: [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
      ],
      defaultValue: ['en'],
      admin: { description: 'Which languages this caregiver can take calls in. Used to filter the rotation when a patient submits in Spanish.' } },
    { name: 'lastContactedAt', type: 'date',
      admin: {
        description: 'Auto-updated when the rotation assigns this caregiver a request. Used for round-robin fairness.',
        date: { pickerAppearance: 'dayAndTime' },
      } },
    { name: 'notes', type: 'textarea',
      admin: { description: 'Pedro\'s internal notes — availability windows, specialties, etc.' } },
  ],
}
