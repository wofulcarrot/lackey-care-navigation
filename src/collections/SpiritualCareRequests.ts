import type { CollectionConfig } from 'payload'
import { SPIRITUAL_REQUEST_TYPES } from '@/lib/spiritual-care-types'

/**
 * Every submission from the Spiritual Care sub-flows lands here —
 * prayer requests (email + message), chaplain callback requests
 * (phone + optional context), and any future spiritual-care channel.
 *
 * Rows are CREATED by the anonymous patient-side API routes
 * (overrideAccess), but READ/UPDATE/DELETE are locked to admin/editor
 * so the public REST endpoints can\'t be used to enumerate past
 * submissions (they contain contactable PII).
 */
export const SpiritualCareRequests: CollectionConfig = {
  slug: 'spiritual-care-requests',
  labels: { singular: 'Spiritual Care Request', plural: 'Spiritual Care Requests' },
  admin: {
    useAsTitle: 'requestType',
    defaultColumns: ['requestType', 'name', 'createdAt', 'contactedAt'],
    group: 'Spiritual Care',
    description:
      '⚠ Contains patient PII (email, phone, prayer text). Every row is a ' +
      'submission from the Spiritual Care flow — chaplain callbacks and prayer ' +
      'requests. When a caregiver responds, set contactedAt so the dashboard ' +
      'can show response-time metrics.',
    pagination: { defaultLimit: 25 },
  },
  defaultSort: '-createdAt',
  access: {
    // Patient-side API routes pass overrideAccess:true to bypass this for create.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'requestType',
      type: 'select',
      required: true,
      options: SPIRITUAL_REQUEST_TYPES.map((value) => ({
        label: value === 'prayer' ? 'Prayer request' : 'Chaplain callback',
        value,
      })),
      admin: { description: 'Which Spiritual Care sub-flow the patient used.' },
    },
    {
      name: 'name',
      type: 'text',
      admin: { description: 'Optional first name or how the patient wants to be addressed.' },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description:
          'Optional for both prayer requests and chaplain callbacks. ' +
          'Patients may submit anonymously. When present, staff can use it ' +
          'to reply to a prayer request.',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Required for chaplain callbacks. Not collected for prayer requests.',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      maxLength: 4000,
      admin: {
        description:
          'Prayer text or brief context for the chaplain callback. Not required.',
      },
    },
    {
      name: 'locale',
      type: 'select',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
      ],
    },
    {
      name: 'contactedAt',
      type: 'date',
      admin: {
        description:
          'Set this when a caregiver responds so we can track response time.',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'contactedBy',
      type: 'relationship',
      relationTo: 'spiritual-caregivers',
      admin: { description: 'Which caregiver took the call / sent the prayer response.' },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal notes — not visible to the patient.' },
    },
  ],
}
