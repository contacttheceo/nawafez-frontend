/**
 * Route-level skeleton for /(locale)/listings.
 *
 * Next.js renders this instantly while page.tsx hydrates + the initial
 * listings fetch resolves. Replaces the white-flash the audit flagged as
 * the "unprofessional load transition".
 */

export default function ListingsLoading() {
  return (
    <div className="min-h-screen bg-slate-bg animate-pulse" aria-hidden="true">
      {/* Navbar spacer — matches real Navbar height so nothing jumps */}
      <div className="h-16 bg-white border-b border-slate-tint" />

      {/* Hero band */}
      <div className="bg-gradient-to-b from-slate-bg to-white border-b border-slate-tint px-4 py-10">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="h-7 bg-slate-tint rounded w-64 mx-auto" />
          <div className="h-4 bg-slate-tint rounded w-96 mx-auto opacity-70" />
          <div className="flex gap-2 max-w-2xl mx-auto pt-4">
            <div className="h-11 flex-1 bg-white border border-slate-tint rounded-xl" />
            <div className="h-11 w-24 bg-slate-tint rounded-xl" />
          </div>
        </div>
      </div>

      {/* Body — sidebar + grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Filter sidebar */}
        <aside className="hidden lg:block space-y-4">
          <div className="h-10 bg-white border border-slate-tint rounded-xl" />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-slate-tint rounded-xl p-4 space-y-3">
              <div className="h-4 bg-slate-tint rounded w-24" />
              <div className="h-8 bg-slate-tint rounded opacity-70" />
              <div className="h-8 bg-slate-tint rounded opacity-60" />
            </div>
          ))}
        </aside>

        {/* Card grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-slate-tint rounded w-28" />
            <div className="h-8 w-32 bg-white border border-slate-tint rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-tint overflow-hidden">
                <div className="h-44 bg-slate-tint" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-tint rounded w-16" />
                  <div className="h-4 bg-slate-tint rounded w-full" />
                  <div className="h-4 bg-slate-tint rounded w-2/3" />
                  <div className="h-5 bg-slate-tint rounded w-24 mt-3" />
                </div>
                <div className="px-4 py-3 border-t border-slate-tint flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-tint" />
                    <div className="h-3 bg-slate-tint rounded w-16" />
                  </div>
                  <div className="h-3 bg-slate-tint rounded w-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
