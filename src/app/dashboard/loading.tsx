export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-full rounded-md bg-white" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-lg bg-white" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-72 rounded-lg bg-white" />
        <div className="h-72 rounded-lg bg-white" />
      </div>
      <div className="h-96 rounded-lg bg-white" />
    </div>
  )
}
