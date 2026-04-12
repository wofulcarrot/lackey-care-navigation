interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
