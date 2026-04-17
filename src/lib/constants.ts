/** SessionStorage keys used across the patient triage flow. */
export const SESSION_KEYS = {
  triageResult: 'triageResult',
  userLocation: 'triageUserLocation',
  emergencyScreen: 'emergencyScreenCompleted',
} as const

/** Urgency level names that trigger the Foursquare location screen.
 *  Checked in both English and Spanish to handle localized API responses. */
export const URGENT_LEVEL_NAMES = ['Urgent', 'Urgente'] as const

export function isUrgentLevel(name?: string): boolean {
  return URGENT_LEVEL_NAMES.some((n) => n === name)
}

/** Conversion factor for miles to meters. */
export const METERS_PER_MILE = 1609.34
