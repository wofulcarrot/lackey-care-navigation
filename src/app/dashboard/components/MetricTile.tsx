export function MetricTile({
  label,
  value,
  sublabel,
  tone = 'neutral',
}: {
  label: string
  value: string | number
  sublabel?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}) {
  const toneBg = {
    neutral: 'bg-white',
    success: 'bg-emerald-50',
    warning: 'bg-amber-50',
    danger: 'bg-red-50',
  }[tone]
  const toneText = {
    neutral: 'text-gray-900',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
  }[tone]
  return (
    <div className={`rounded-lg border border-gray-200 ${toneBg} p-5 shadow-sm`}>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold tabular-nums ${toneText}`}>{value}</div>
      {sublabel && <div className="mt-0.5 text-xs text-gray-500">{sublabel}</div>}
    </div>
  )
}
