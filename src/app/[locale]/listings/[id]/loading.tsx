/**
 * Route-level skeleton for /(locale)/listings/[id].
 *
 * Rendered by Next.js while the layout runs its (server) listing fetch
 * and the client page mounts. Mirrors the two-column detail layout so
 * the layout doesn't shift when the real content lands.
 */

export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-bg animate-pulse" aria-hidden="true">
      {/* Navbar spacer */}
      <div className="h-16 bg-white border-b border-slate-tint" />

      <div className="max-w-5xl mx-auto px-4 pt-6 pb-24 lg:pb-10">
        {/* Breadcrumb */}
        <div className="flex gap-2 mb-6">
          <div className="h-3 bg-slate-tint rounded w-14" />
          <div className="h-3 bg-slate-tint rounded w-16" />
          <div className="h-3 bg-slate-tint rounded w-20" />
          <div className="h-3 bg-slate-tint rounded w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image */}
            <div className="aspect-video bg-slate-tint rounded-2xl" />
            {/* Thumbnails */}
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="w-20 h-14 bg-slate-tint rounded-lg" />
              ))}
            </div>

            {/* Title + meta */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-20 bg-slate-tint rounded-full" />
                <div className="h-5 w-16 bg-slate-tint rounded-full" />
              </div>
              <div className="h-7 bg-slate-tint rounded w-3/4" />
              <div className="flex gap-4">
                <div className="h-3 bg-slate-tint rounded w-20" />
                <div className="h-3 bg-slate-tint rounded w-16" />
                <div className="h-3 bg-slate-tint rounded w-24" />
              </div>
            </div>

            {/* Description card */}
            <div className="bg-white border border-slate-tint rounded-2xl p-5 space-y-2">
              <div className="h-4 bg-slate-tint rounded w-32 mb-3" />
              <div className="h-3 bg-slate-tint rounded w-full" />
              <div className="h-3 bg-slate-tint rounded w-full" />
              <div className="h-3 bg-slate-tint rounded w-2/3" />
            </div>

            {/* Spec grid */}
            <div className="bg-white border border-slate-tint rounded-2xl p-5">
              <div className="h-4 bg-slate-tint rounded w-32 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-slate-bg rounded-xl px-3 py-2.5 space-y-1.5">
                    <div className="h-2 bg-slate-tint rounded w-12" />
                    <div className="h-3.5 bg-slate-tint rounded w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white border-2 border-slate-tint rounded-xl p-5 space-y-3">
              <div className="h-3 bg-slate-tint rounded w-12" />
              <div className="h-9 bg-slate-tint rounded w-32" />
              <div className="h-11 bg-slate-tint rounded-xl mt-4" />
              <div className="h-10 bg-slate-tint rounded-xl opacity-70" />
              <div className="h-4 bg-slate-tint rounded w-28 mx-auto" />
            </div>
            <div className="bg-white border border-slate-tint rounded-xl p-4">
              <div className="h-3 bg-slate-tint rounded w-20 mb-3" />
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-tint" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-tint rounded w-24" />
                  <div className="h-2 bg-slate-tint rounded w-16" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
