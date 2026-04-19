interface ProgressBarProps {
  current: number
  total: number
}

/**
 * Segmented progress bar — one pill per question. Filled pills use the
 * coral accent; unanswered are muted. This matches the design's "5 dots"
 * pattern rather than a single linear bar, which reads better for very
 * short triage flows (5–8 questions).
 */
export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div
      className="flex gap-1.5"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`flex-1 h-1.5 rounded-full transition-colors ${
            i < current ? 'bg-[var(--accent-primary)]' : 'bg-[var(--stroke)]'
          }`}
        />
      ))}
    </div>
  )
}
