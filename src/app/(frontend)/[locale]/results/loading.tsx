export default function Loading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2" />
      <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-1/4 mb-6" />
      <div className="h-7 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-4" />
      <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-full mb-8" />
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
