'use client'

import { OptionRow } from './ui/OptionRow'

interface CareTypeCardProps {
  icon: string
  name: string
  description: string
  onClick: () => void
}

/**
 * Thin wrapper around OptionRow for the Care Type selection grid.
 * Kept as a named component so the care-type client doesn't need to know
 * about the underlying shared primitive.
 */
export function CareTypeCard({ icon, name, description, onClick }: CareTypeCardProps) {
  return <OptionRow icon={icon} title={name} desc={description} onClick={onClick} />
}
