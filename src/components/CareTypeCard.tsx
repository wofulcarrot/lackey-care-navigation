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
      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white text-left min-h-[48px] hover:border-blue-400 transition"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="font-bold text-lg">{name}</div>
        <div className="text-gray-600 text-sm">{description}</div>
      </div>
    </button>
  )
}
