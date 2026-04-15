export default function Loading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4" />
      <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-8" />
      <div className="h-14 bg-blue-100 dark:bg-blue-950/40 rounded-xl mb-4" />
      <div className="h-14 bg-green-100 dark:bg-green-950/40 rounded-xl" />
    </div>
  )
}
