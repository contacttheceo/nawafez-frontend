'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { statsApi, aiApi } from '@/lib/api'

export default function HeroSection() {
  const t      = useTranslations('hero')
  const locale = useLocale()
  const router = useRouter()
  const isRTL  = locale === 'ar'

  const [query,      setQuery]      = useState('')
  const [stats,      setStats]      = useState<{ total_listings: number; total_users: number } | null>(null)
  const [aiSearching, setAiSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const SAUDI_CITIES = ['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','نجران','حائل','القصيم','بريدة','ينبع']
  const SECTION_TYPES: Record<string, string[]> = {
    fleet: ['sale', 'rent', 'wanted'],
    contracts: ['offer', 'wanted'],
    ma: [], jobs: [], forum: [],
  }

  useEffect(() => {
    statsApi.get()
      .then((data) => setStats(data))
      .catch(() => {})
  }, [])

  const runTextSearch = (q: string) => {
    router.push(q
      ? `/${locale}/listings?search=${encodeURIComponent(q)}`
      : `/${locale}/listings`
    )
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  /**
   * Single search entry point. Empty query → jump straight to the listings
   * page (no AI call needed). Otherwise try the AI extractor first — it
   * parses free-form Arabic/English into structured filters. If it fails
   * or times out, fall back to a plain full-text search so the user always
   * gets a result set.
   */
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) { runTextSearch(''); return }
    if (aiSearching)  return

    setAiSearching(true)
    try {
      const res = await aiApi.extractListing({ text: q })
      const params = new URLSearchParams()

      if (res.section && res.section !== 'forum') params.set('section', res.section)

      if (res.listing_type && (SECTION_TYPES[res.section ?? ''] ?? []).includes(res.listing_type)) {
        params.append('listing_type', res.listing_type)
      }

      if (res.fields?.city) {
        const c = res.fields.city.replace(/^(منطقة|مدينة|محافظة)\s+/u, '').trim()
        if (SAUDI_CITIES.includes(c)) params.set('city', c)
      }

      if (res.fields?.price)      params.set('price_max', res.fields.price)
      if (res.fields?.salary_max) params.set('price_max', res.fields.salary_max)
      if (res.fields?.salary_min) params.set('price_min', res.fields.salary_min)

      const qs = params.toString()
      router.push(qs
        ? `/${locale}/listings?${qs}`
        : `/${locale}/listings?search=${encodeURIComponent(q)}`)
    } catch {
      runTextSearch(q)
    } finally {
      setAiSearching(false)
    }
  }

  const fmt = (n: number) =>
    `+${n.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}`

  const statItems = [
    {
      num:   stats ? fmt(stats.total_listings) : '…',
      label: t('stat_listings'),
    },
    {
      num:   stats ? fmt(stats.total_users) : '…',
      label: t('stat_businesses'),
    },
    { num: '+95M', label: t('stat_deals') },
    { num: '21',   label: t('stat_cities') },
  ]

  return (
    <section className="relative bg-gradient-to-b from-slate-bg via-white to-white
                        text-slate-dark pt-20 pb-32 px-6 overflow-hidden
                        border-b border-slate-tint">
      {/* Background glow blobs — soft emerald tint on light background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 start-1/4 w-96 h-96 bg-emerald/10
                        rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 end-1/4 w-64 h-64 bg-slate/5
                        rounded-full blur-2xl" />
        <div className="absolute top-1/2 start-0 w-48 h-48 bg-emerald/5
                        rounded-full blur-2xl" />

        {/* Floating AI feature badges — thinned from 6 to 3, pushed to the
            page edges so they no longer visually compete with the search
            bar. The full AI feature list lives in AIFeaturesSection below. */}
        {[
          { text: '✨ بحث ذكي',        delay: '0s',    x: '4%',  y: '18%' },
          { text: '✍️ كاتب إعلانات',   delay: '2s',    x: '86%', y: '78%' },
          { text: '📄 محلل العقود',    delay: '3.2s',  x: '4%',  y: '78%' },
        ].map((badge) => (
          <div
            key={badge.text}
            className="absolute hidden lg:flex items-center gap-1.5
                       bg-white backdrop-blur-sm border border-slate-tint
                       text-slate text-[11px] font-medium shadow-sm
                       px-3 py-1.5 rounded-full
                       animate-[floatBadge_6s_ease-in-out_infinite]"
            style={{
              left: badge.x,
              top:  badge.y,
              animationDelay: badge.delay,
            }}
          >
            {badge.text}
          </div>
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto text-center">

        {/* Single trust pill — merged the "🇸🇦 #1" line and the "🚀 badge"
            pill (two consecutive lines with overlapping meaning) into one
            restrained badge. Saves ~60px of vertical space above the H1. */}
        <div className="inline-flex items-center gap-2 bg-emerald/10 border
                        border-emerald/30 text-emerald-dark px-4 py-1.5
                        rounded-full text-xs sm:text-sm font-medium mb-6">
          <span>🇸🇦</span>
          <span>
            {isRTL
              ? 'المنصة B2B الأولى للنقل واللوجستيك في السعودية'
              : "Saudi Arabia's #1 B2B logistics marketplace"}
          </span>
        </div>

        {/* Heading — text-balance keeps the line breaks from splitting a
            single Arabic word ("اللوجستيك") across two lines. */}
        <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4 text-balance">
          {t('title')}{' '}
          <span className="text-emerald-dark">{t('title_highlight')}</span>
        </h1>

        {/* Description */}
        <p className="text-slate text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto text-balance">
          {t('desc')}
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch}
              className="flex gap-2 max-w-2xl mx-auto mb-2">
          <div className="relative flex-1">
            <Search size={18}
                    className="absolute start-3 top-1/2 -translate-y-1/2
                               text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isRTL
                  ? 'ابحث… أو اكتب وصفاً كاملاً واضغط ✨'
                  : 'Search… or describe what you need and press ✨'
              }
              className="w-full ps-10 pe-10 py-3.5 rounded-xl bg-white text-gray-900
                         placeholder-gray-400 text-sm focus:outline-none
                         focus:ring-2 focus:ring-emerald"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute end-3 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={isRTL ? 'مسح البحث' : 'Clear search'}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Single primary CTA — AI-first with graceful text-search
              fallback. Merged the previous dual "✨ AI" + "Search" buttons
              that caused decision-paralysis at the top of the page. */}
          <button
            type="submit"
            disabled={aiSearching}
            title={isRTL ? 'تحليل النص وضبط الفلاتر تلقائياً' : 'Analyse and set filters automatically'}
            className="bg-emerald hover:bg-emerald-dark disabled:opacity-60
                       text-white px-5 py-3.5 rounded-xl font-bold text-sm
                       flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            {aiSearching
              ? <Loader2 size={16} className="animate-spin" />
              : <span className="text-base leading-none">✨</span>}
            {isRTL ? 'بحث ذكي' : 'AI Search'}
          </button>
        </form>

        {/* AI hint */}
        <p className="text-slate-light text-xs text-center mb-6">
          {isRTL
            ? '✨ جرّب: "أريد شاحنة مبردة في جدة بأقل من 8000" ← يضبط الفلاتر تلقائياً'
            : '✨ Try: "refrigerated truck for rent in Jeddah under 8000" → filters set automatically'}
        </p>

        {/* Stats — pulled up above the fold. The four social-proof numbers
            were previously at the very bottom of the hero (below CTAs), so
            mobile users who didn't scroll never saw them. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl
                        mx-auto mb-8 border-y border-slate-tint py-4">
          {statItems.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl sm:text-2xl font-black text-emerald-dark
                              tabular-nums leading-tight">
                {stat.num}
              </div>
              <div className="text-slate text-[11px] sm:text-xs mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Section quick-filter pills — click redirects with section param */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {[
            { value: 'ma',        ar: '🏢 استحواذ',  en: '🏢 M&A'       },
            { value: 'fleet',     ar: '🚛 أسطول',    en: '🚛 Fleet'     },
            { value: 'contracts', ar: '📄 عقود',     en: '📄 Contracts' },
            { value: 'jobs',      ar: '💼 وظائف',    en: '💼 Jobs'      },
            { value: 'forum',     ar: '💬 منتدى',    en: '💬 Forum'     },
          ].map(sec => (
            <button
              key={sec.value}
              type="button"
              onClick={() =>
                router.push(`/${locale}/listings?section=${sec.value}`)
              }
              className="text-xs px-3.5 py-1.5 rounded-full border border-slate-tint
                         text-slate hover:text-slate-dark hover:border-slate-light
                         hover:bg-slate-bg transition-all duration-150 font-medium bg-white"
            >
              {isRTL ? sec.ar : sec.en}
            </button>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={`/${locale}/listings`}
            className="bg-emerald hover:bg-emerald-dark text-white px-8 py-3.5
                       rounded-xl font-bold text-base transition-all duration-200
                       hover:-translate-y-0.5 shadow-lg shadow-emerald/30"
          >
            {t('cta_primary')}
          </Link>
          <Link
            href="#how"
            className="bg-white hover:bg-slate-bg border border-slate-tint
                       text-slate-dark px-8 py-3.5 rounded-xl font-semibold text-base
                       transition-all duration-200"
          >
            {t('cta_secondary')}
          </Link>
        </div>

      </div>

      {/* Wave separator at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
        <svg viewBox="0 0 1440 50" className="w-full block fill-white">
          <path d="M0,50 C480,0 960,50 1440,0 L1440,50 L0,50 Z" />
        </svg>
      </div>
    </section>
  )
}
