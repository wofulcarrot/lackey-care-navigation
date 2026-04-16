export default function Loading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-7 bg-yellow-100 dark:bg-yellow-950/40 rounded-full w-24 mb-6" />
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3" />
      <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-5/6 mb-6" />
      <div className="h-14 bg-blue-100 dark:bg-blue-950/40 rounded-xl" />
    </div>
  )
}
