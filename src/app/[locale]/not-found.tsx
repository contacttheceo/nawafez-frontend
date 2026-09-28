import Link from 'next/link'
import { headers } from 'next/headers'
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
 * Locale is read from the referer (the URL that produced the 404); the
 * `params` prop is not available inside not-found.tsx.
 */

const SECTIONS = [
  { value: 'fleet',     ar: 'الأسطول',       en: 'Fleet',     emoji: '🚛' },
  { value: 'contracts', ar: 'العقود',        en: 'Contracts', emoji: '📄' },
  { value: 'jobs',      ar: 'الوظائف',      en: 'Jobs',      emoji: '💼' },
  { value: 'ma',        ar: 'استحواذ ودمج', en: 'M&A',       emoji: '🏢' },
  { value: 'forum',     ar: 'المنتدى',       en: 'Forum',     emoji: '💬' },
]

export default async function LocaleNotFound() {
  // Best-effort locale detection from the referer path. This runs on the
  // server so we can inspect request headers directly.
  const h = await headers()
  const referer = h.get('referer') ?? ''
  const match   = referer.match(/\/(ar|en)(?:\/|$)/)
  const locale: 'ar' | 'en' = match?.[1] === 'en' ? 'en' : 'ar'
  const isRTL  = locale === 'ar'

  return (
    <div className="min-h-screen bg-slate-bg flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="max-w-2xl w-full text-center">

          {/* Number */}
          <p className="text-8xl sm:text-9xl font-black text-emerald-dark/20 leading-none
                        tabular-nums mb-4 select-none">
            404
          </p>

          {/* Message */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-dark mb-3 text-balance">
            {isRTL
              ? 'الصفحة التي تبحث عنها غير موجودة'
              : "We couldn't find that page"}
          </h1>
          <p className="text-slate text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto text-balance">
            {isRTL
              ? 'قد يكون الإعلان انتهت مدته أو غيّر البائع رابطه. جرّب البحث أدناه، أو استعرض أحد الأقسام.'
              : 'The listing may have expired or the URL may be wrong. Try the search below, or browse a category.'}
          </p>

          {/* Search box → dumps into /listings?search=... */}
          <form
            action={`/${locale}/listings`}
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
                placeholder={isRTL ? 'ابحث في السوق…' : 'Search the marketplace…'}
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
              {isRTL ? 'بحث' : 'Search'}
            </button>
          </form>

          {/* Category quick-links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {SECTIONS.map(s => (
              <Link
                key={s.value}
                href={`/${locale}/listings?section=${s.value}`}
                className="bg-white border border-slate-tint hover:border-emerald
                           hover:shadow-sm text-slate-dark rounded-xl px-4 py-3
                           text-sm font-medium transition-all
                           flex items-center gap-2 justify-center"
              >
                <span className="text-lg" aria-hidden>{s.emoji}</span>
                {isRTL ? s.ar : s.en}
              </Link>
            ))}
          </div>

          {/* Home link */}
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-emerald-dark
                       hover:text-emerald text-sm font-bold transition-colors"
          >
            {isRTL ? 'العودة إلى الرئيسية' : 'Back to home'}
            <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
