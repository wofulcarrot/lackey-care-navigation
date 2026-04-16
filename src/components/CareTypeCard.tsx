interface CareTypeCardProps {
  icon: string
  name: string
  description: string
  onClick: () => void
}

export function CareTypeCard({ icon, name, description, onClick }: CareTypeCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-left min-h-[48px] hover:border-blue-400 dark:hover:border-blue-500 transition"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{name}</div>
        <div className="text-gray-600 dark:text-gray-400 text-sm">{description}</div>
      </div>
    </button>
  )
}
