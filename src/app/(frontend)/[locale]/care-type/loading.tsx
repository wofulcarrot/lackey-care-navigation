export default function Loading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-6" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
