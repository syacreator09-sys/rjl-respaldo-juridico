export default function AsesorLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-16 rounded-full bg-white/10" />
        <div className="h-7 w-56 rounded-lg bg-white/10" />
        <div className="h-4 w-80 rounded-lg bg-white/8" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-64 rounded-3xl bg-white/6 border border-white/6" />
        ))}
      </div>
    </div>
  )
}
