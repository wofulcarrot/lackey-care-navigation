import type { CollectionConfig } from 'payload'

/**
 * Comprehensive funnel tracking for the patient triage flow.
 *
 * Each row is a single behavioral event (page view, button click, question
 * answered, resource engaged). Events are tied together by a sessionId that
 * persists for the duration of a single browser session.
 *
 * Zero PII: no names, emails, IPs, or GPS coordinates are stored. The
 * sessionId is a random UUID generated client-side — it cannot be linked
 * back to a person.
 */
export const TriageEvents: CollectionConfig = {
  slug: 'triage-events',
  labels: { singular: 'Triage Event', plural: 'Triage Events' },
  // REST disabled for the same reason as TriageSessions — prevent
  // public analytics poisoning. Server-side writes use overrideAccess.
  admin: {
    group: 'Analytics',
    description: 'Comprehensive funnel events — every step a patient takes from landing to resource engagement. Zero PII.',
    defaultColumns: ['event', 'sessionId', 'locale', 'createdAt'],
    pagination: { defaultLimit: 50 },
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: () => false,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'sessionId',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Client-generated UUID that ties all events in a single triage flow together.' },
    },
    {
      name: 'event',
      type: 'select',
      required: true,
      index: true,
      options: [
        // Navigation
        { label: 'Landing page viewed', value: 'landing_view' },
        { label: 'Get Care Now clicked', value: 'get_care_click' },
        // Emergency screen
        { label: 'Emergency screen viewed', value: 'emergency_screen_view' },
        { label: 'No emergency symptoms', value: 'emergency_none' },
        { label: 'Emergency symptom checked', value: 'emergency_symptom' },
        // Care type
        { label: 'Care type selected', value: 'care_type_selected' },
        // Triage
        { label: 'Triage question answered', value: 'triage_question' },
        { label: 'Triage completed', value: 'triage_completed' },
        // Results
        { label: 'Results page viewed', value: 'results_view' },
        { label: 'Location shared', value: 'location_shared' },
        { label: 'Location skipped', value: 'location_skipped' },
        // Resource engagement
        { label: 'Resource phone tapped', value: 'resource_call' },
        { label: 'Resource directions tapped', value: 'resource_directions' },
        { label: 'Resource website tapped', value: 'resource_website' },
        // Virtual care
        { label: 'Virtual Care clicked', value: 'virtual_care_click' },
        { label: 'Virtual Care skipped', value: 'virtual_care_skip' },
        { label: 'Eligibility check clicked', value: 'eligibility_click' },
        // Crisis
        { label: 'Crisis screen viewed', value: 'crisis_screen_view' },
        { label: '988 call/text tapped', value: 'crisis_988_tap' },
        // Flow control
        { label: 'Start over', value: 'start_over' },
        { label: 'Language toggled', value: 'language_toggle' },
      ],
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Step-specific data: careType, questionIndex, totalQuestions, resourceName, etc.',
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
      name: 'device',
      type: 'select',
      options: [
        { label: 'Mobile', value: 'mobile' },
        { label: 'Tablet', value: 'tablet' },
        { label: 'Desktop', value: 'desktop' },
      ],
    },
  ],
}
