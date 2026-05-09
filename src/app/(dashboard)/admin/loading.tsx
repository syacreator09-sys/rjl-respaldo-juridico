export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-12 rounded-full bg-white/10" />
        <div className="h-7 w-52 rounded-lg bg-white/10" />
        <div className="h-4 w-72 rounded-lg bg-white/8" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-3xl bg-white/6 border border-white/6" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-56 rounded-3xl bg-white/6 border border-white/6" />
        <div className="h-56 rounded-3xl bg-white/6 border border-white/6" />
      </div>
    </div>
  )
}
