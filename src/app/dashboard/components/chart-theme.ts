/**
 * Shared chart styling for all Recharts components on the dashboard.
 *
 * Recharts doesn't read CSS variables — we have to pass literal hex/rgb
 * values to fill/stroke props. These constants mirror the oklch tokens
 * from globals.css as their sRGB equivalents, so the dashboard charts
 * stay visually on-brand with the front door even though they don't
 * live in the same color space.
 *
 * When a token in globals.css changes, update these too.
 */

export const CHART_COLORS = {
  // Core brand
  coral:    '#E07A5F', // --accent-primary
  sage:     '#6A9373', // --accent-sage
  lavender: '#AE9CC4', // --urgent-lavender

  // Urgency / routing tiers
  urgentRed:    '#D64545', // --urgent-red
  urgentOrange: '#E89049', // --urgent-orange
  urgentYellow: '#E3B84A', // --urgent-yellow
  urgentGreen:  '#4AA36B', // --urgent-green
  urgentBlue:   '#5A8ED8', // --urgent-blue

  // Neutrals
  ink:    '#3A2D22', // --ink
  ink2:   '#6B5A4C', // --ink-2
  ink3:   '#9A8976', // --ink-3
  stroke: '#DFD6C8', // --stroke
} as const

/** Recharts axis tick styling — muted, tabular numeric. */
export const CHART_TICK_STYLE = {
  fontSize: 11,
  fill: CHART_COLORS.ink3,
  fontVariantNumeric: 'tabular-nums' as const,
}

/** Recharts grid styling — subtle dashed horizontal lines only. */
export const CHART_GRID_STROKE = CHART_COLORS.stroke

/**
 * Shared tooltip panel style. Returns a plain object for inline-style
 * usage — Recharts' `contentStyle` prop doesn't accept Tailwind classes.
 */
export const CHART_TOOLTIP_STYLE = {
  background: '#FEFDFB',
  border: `1px solid ${CHART_COLORS.stroke}`,
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 13,
  boxShadow: '0 10px 24px rgba(60,30,15,0.12)',
  color: CHART_COLORS.ink,
}
