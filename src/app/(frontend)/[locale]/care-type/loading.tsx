export default function Loading() {
  return (
    <div className="px-5 py-5 animate-pulse max-w-[440px] mx-auto">
      <div className="h-8 bg-[var(--surface-2)] rounded w-1/2 mb-3" />
      <div className="h-4 bg-[var(--surface-2)] rounded w-2/3 mb-6" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-20 bg-[var(--surface-2)] rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
