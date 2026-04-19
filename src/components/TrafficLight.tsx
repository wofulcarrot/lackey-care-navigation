'use client'

import type { TriageResult } from '@/lib/types'

/**
 * Visual urgency indicator — 6 pills (red → lavender) with the active tier
 * scaled up. Below the pills, a colored card describes the tier with a
 * human-readable label and a short explanation of what it means.
 *
 * The 6 tiers map to urgency levels by `scoreThreshold` in descending
 * order: [0] most urgent → [5] least urgent. We pick the index by finding
 * the position of the current urgency level in the sorted list. When we
 * can't determine a step (e.g. missing urgencyLevel), we default to the
 * muted tier (index 4) so the indicator stays informative but not alarming.
 */

const PALETTE = [
  'var(--urgent-red)',
  'var(--urgent-orange)',
  'var(--urgent-yellow)',
  'var(--urgent-green)',
  'var(--urgent-blue)',
  'var(--urgent-lavender)',
] as const

// Map level name → step. Matches the CMS seed data in src/seed/urgency-levels.ts.
// Supports both EN and ES so we can classify a localized response.
const NAME_TO_STEP: Record<string, number> = {
  'Emergent': 0,
  'Emergente': 0,
  'Urgent': 1,
  'Urgente': 1,
  'Semi-Urgent': 2,
  'Semi-Urgente': 2,
  'Routine': 3,
  'Rutina': 3,
  'Elective': 4,
  'Electiva': 4,
  'Behavioral Health': 5,
  'Salud mental': 5,
}

function stepForLevel(level: TriageResult['urgencyLevel']): number {
  if (!level?.name) return 4
  const step = NAME_TO_STEP[level.name]
  return typeof step === 'number' ? step : 4
}

interface Props {
  urgencyLevel: TriageResult['urgencyLevel']
  subtitle?: string
}

export function TrafficLight({ urgencyLevel, subtitle }: Props) {
  if (!urgencyLevel) return null
  const step = stepForLevel(urgencyLevel)

  return (
    <div className="mb-5">
      <div className="flex gap-1 mb-4">
        {PALETTE.map((c, i) => (
          <div
            key={i}
            className="h-3 flex-1 rounded-full transition-all"
            style={{
              background: c,
              opacity: i === step ? 1 : 0.22,
              transform: i === step ? 'scaleY(1.4)' : 'scaleY(1)',
            }}
          />
        ))}
      </div>

      <div
        className="rounded-2xl p-4 border-2"
        style={{
          background: `color-mix(in oklab, ${PALETTE[step]} 14%, var(--surface-0))`,
          borderColor: `color-mix(in oklab, ${PALETTE[step]} 45%, transparent)`,
        }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: PALETTE[step] }}
          />
          <div className="font-display font-bold text-[17px] text-[var(--ink)]">
            {urgencyLevel.name}
          </div>
        </div>
        {subtitle && <p className="text-[14px] text-[var(--ink)] leading-snug">{subtitle}</p>}
      </div>
    </div>
  )
}
