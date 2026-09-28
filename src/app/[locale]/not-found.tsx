import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Search, ArrowRight } from 'lucide-react'

/**
 * Custom 404 page for the [locale] segment.
 *
 * Triggered by any `notFound()` call inside /(locale)/*, most importantly
 * the listing-detail layout when a stale URL is followed. Replaces Next's
 * generic 404 text with a branded landing that keeps the visitor inside
 * the funnel: search box + category quick-links.
 *
 * **Kept fully static on purpose.** No async, no dynamic APIs (headers,
 * cookies, getLocale, params). Under Next 14 App Router, `notFound()`
 * only propagates the HTTP 404 status when the not-found boundary can
 * be rendered as a static Server Component; any await or dynamic-only
 * API silently downgrades the response to 200 (soft 404), which Google
 * penalises.
 *
 * The page is bilingual by default (Arabic first, English mirror below)
 * so we don't need to read the segment locale here. Category links
 * default to /ar; a small language toggle lets English visitors reroute.
 */

const SECTIONS = [
  { value: 'fleet',     ar: 'الأسطول',       en: 'Fleet',     emoji: '🚛' },
  { value: 'contracts', ar: 'العقود',        en: 'Contracts', emoji: '📄' },
  { value: 'jobs',      ar: 'الوظائف',      en: 'Jobs',      emoji: '💼' },
  { value: 'ma',        ar: 'استحواذ ودمج', en: 'M&A',       emoji: '🏢' },
  { value: 'forum',     ar: 'المنتدى',       en: 'Forum',     emoji: '💬' },
]

export default function LocaleNotFound() {
  return (
    <div className="min-h-screen bg-slate-bg flex flex-col" dir="rtl">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="max-w-2xl w-full text-center">

          {/* Number */}
          <p className="text-8xl sm:text-9xl font-black text-emerald-dark/20 leading-none
                        tabular-nums mb-4 select-none">
            404
          </p>

          {/* Message (Arabic primary) */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-dark mb-2 text-balance">
            الصفحة التي تبحث عنها غير موجودة
          </h1>
          <p className="text-slate text-sm sm:text-base leading-relaxed mb-4 max-w-lg mx-auto text-balance">
            قد يكون الإعلان انتهت مدته أو غيّر البائع رابطه. جرّب البحث أدناه، أو استعرض أحد الأقسام.
          </p>

          {/* English mirror — smaller, quieter */}
          <p className="text-slate-light text-xs sm:text-sm leading-relaxed mb-8 max-w-lg mx-auto text-balance" dir="ltr">
            We couldn't find that page. The listing may have expired or the URL may be wrong. Try the search or browse a category.
          </p>

          {/* Search box → dumps into /ar/listings?search=... */}
          <form
            action="/ar/listings"
            method="get"
            className="flex gap-2 max-w-md mx-auto mb-10"
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                name="search"
                type="text"
                placeholder="ابحث في السوق…"
                className="w-full ps-10 pe-4 py-3 rounded-xl bg-white border border-slate-tint
                           text-sm text-slate-dark placeholder-gray-400 focus:outline-none
                           focus:ring-2 focus:ring-emerald"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald hover:bg-emerald-dark text-white px-5 py-3
                         rounded-xl font-bold text-sm whitespace-nowrap transition-colors"
            >
              بحث
            </button>
          </form>

          {/* Category quick-links (Arabic — 95%+ of our traffic) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {SECTIONS.map(s => (
              <Link
                key={s.value}
                href={`/ar/listings?section=${s.value}`}
                className="bg-white border border-slate-tint hover:border-emerald
                           hover:shadow-sm text-slate-dark rounded-xl px-4 py-3
                           text-sm font-medium transition-all
                           flex items-center gap-2 justify-center"
              >
                <span className="text-lg" aria-hidden>{s.emoji}</span>
                {s.ar}
              </Link>
            ))}
          </div>

          {/* Nav row: home + language switch */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link
              href="/ar"
              className="inline-flex items-center gap-1.5 text-emerald-dark
                         hover:text-emerald font-bold transition-colors"
            >
              العودة إلى الرئيسية
              <ArrowRight size={14} className="rotate-180" />
            </Link>
            <Link
              href="/en"
              className="text-slate hover:text-slate-dark transition-colors"
            >
              English version →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
