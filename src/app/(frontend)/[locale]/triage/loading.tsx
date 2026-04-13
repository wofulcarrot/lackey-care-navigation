export default function Loading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-2 bg-blue-100 rounded-full mb-6" />
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-100 rounded w-1/2 mb-8" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
