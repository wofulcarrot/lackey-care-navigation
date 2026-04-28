/**
 * Shared helpers for triage API routes (evaluate + log-emergency).
 *
 * Extracts duplicated input validation and fire-and-forget session logging
 * so the two route handlers stay focused on their own business logic.
 */

import type { Payload } from 'payload'
import { recordSessionLogFailure } from '@/lib/observability'
import { safeLog } from '@/lib/safe-log'

// ─── Input validation ──────────────────────────────────────────────────────

const VALID_LOCALES = new Set(['en', 'es'] as const)
const VALID_DEVICES = new Set(['mobile', 'tablet', 'desktop'] as const)

type Locale = 'en' | 'es'
type Device = 'mobile' | 'tablet' | 'desktop'

export function safeLocale(value: unknown): Locale {
  return VALID_LOCALES.has(value as Locale) ? (value as Locale) : 'en'
}

export function safeDevice(value: unknown): Device {
  return VALID_DEVICES.has(value as Device) ? (value as Device) : 'mobile'
}

// ─── Awaited session logging (Vercel freezes runtime after response) ────────

export interface SessionData {
  careTypeSelected: number | null
  urgencyResult: number | null
  resourcesShown: number[]
  virtualCareOffered: boolean
  emergencyScreenTriggered: boolean
  isCrisis?: boolean
  completedFlow: boolean
  locale: Locale
  device: Device
  questionSetVersion: number | null
}

export async function logSession(payload: Payload, data: SessionData, label: string): Promise<void> {
  const sessionId = crypto.randomUUID()
  try {
    await payload.create({
      collection: 'triage-sessions',
      overrideAccess: true,
      data: { sessionId, ...data },
    })
  } catch (err) {
    safeLog.error(`[triage-session] Failed to log ${label}`, err)
    recordSessionLogFailure(err)
  }
}
