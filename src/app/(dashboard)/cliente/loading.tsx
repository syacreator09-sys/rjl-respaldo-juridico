export default function ClienteLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* PageIntro skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-16 rounded-full bg-white/10" />
        <div className="h-7 w-48 rounded-lg bg-white/10" />
        <div className="h-4 w-96 rounded-lg bg-white/8" />
      </div>

      {/* Metrics row */}
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-24 rounded-3xl bg-white/6 border border-white/6" />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="h-40 rounded-3xl bg-white/6 border border-white/6" />
          <div className="h-64 rounded-3xl bg-white/6 border border-white/6" />
          <div className="h-48 rounded-3xl bg-white/6 border border-white/6" />
        </div>
        <div className="space-y-4">
          <div className="h-80 rounded-3xl bg-white/6 border border-white/6" />
          <div className="h-[560px] rounded-3xl bg-white/6 border border-white/6" />
        </div>
      </div>
    </div>
  )
}
