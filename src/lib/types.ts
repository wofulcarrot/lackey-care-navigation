/** Shared address shape for care resources (seeded + Foursquare-sourced). */
export interface ResourceAddress {
  street?: string
  city?: string
  state?: string
  zip?: string
  latitude?: number
  longitude?: number
}

/** A care resource shown on the results page. */
export interface TriageResource {
  id: string | number
  name: string
  type: string
  address?: ResourceAddress
  phone?: string
  website?: string
  hours?: { day: string; open: string; close: string }[]
  cost?: string
  eligibility?: string
  description?: string
  temporaryNotice?: string
  is24_7?: boolean
  isActive?: boolean
  distanceMeters?: number
  [key: string]: unknown
}

/** Triage evaluation result stored in sessionStorage. */
export interface TriageResult {
  escalate?: boolean
  urgencyLevel?: {
    id: string
    name: string
    color: string
    scoreThreshold: number
    timeToCare?: string
  }
  resources: TriageResource[]
  virtualCareEligible?: boolean
  actionText?: string
  fallback?: boolean
}
