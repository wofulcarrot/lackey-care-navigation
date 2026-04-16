export default function Loading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-8 bg-green-100 dark:bg-green-950/40 rounded w-2/3 mb-6" />
      <div className="flex flex-col gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        ))}
      </div>
      <div className="h-14 bg-green-100 dark:bg-green-950/40 rounded-xl" />
    </div>
  )
}
