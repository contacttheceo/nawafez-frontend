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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q
      ? `/${locale}/listings?search=${encodeURIComponent(q)}`
      : `/${locale}/listings`
    )
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const handleAiSearch = async () => {
    if (!query.trim() || aiSearching) return
    setAiSearching(true)
    try {
      const res = await aiApi.extractListing({ text: query.trim() })
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

      router.push(`/${locale}/listings?${params.toString()}`)
    } catch {
      // Fallback: regular text search
      router.push(`/${locale}/listings?search=${encodeURIComponent(query.trim())}`)
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

        {/* Floating AI feature badges — Animation 1 */}
        {[
          { text: '✨ بحث ذكي',          delay: '0s',    x: '8%',  y: '20%' },
          { text: '✍️ كاتب إعلانات',     delay: '1.8s',  x: '82%', y: '15%' },
          { text: '📄 محلل العقود',       delay: '3.2s',  x: '5%',  y: '65%' },
          { text: '💬 ردود مقترحة',       delay: '0.9s',  x: '78%', y: '60%' },
          { text: '📊 مستشار الإعلانات',  delay: '2.5s',  x: '15%', y: '82%' },
          { text: '🔍 AI Search',          delay: '1.2s',  x: '72%', y: '80%' },
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

        {/* Trust line */}
        <p className="text-slate text-xs mb-3 tracking-widest uppercase font-medium">
          🇸🇦{' '}
          {isRTL
            ? 'الأول في السعودية للقطاع اللوجستي'
            : "Saudi Arabia's #1 Logistics B2B Platform"}
        </p>

        {/* Badge */}
        <div className="inline-block bg-emerald/20 border border-emerald/40
                        text-emerald-dark px-4 py-1.5 rounded-full text-sm mb-6">
          🚀 {t('badge')}
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-black leading-tight mb-4">
          {t('title')}{' '}
          <span className="text-emerald-dark">{t('title_highlight')}</span>
        </h1>

        {/* Description */}
        <p className="text-slate text-lg leading-relaxed mb-8 max-w-xl mx-auto">
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

          {/* ✨ AI Search */}
          <button
            type="button"
            onClick={handleAiSearch}
            disabled={!query.trim() || aiSearching}
            title={isRTL ? 'تحليل النص وضبط الفلاتر تلقائياً' : 'Analyse and set filters automatically'}
            className="px-4 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700
                       text-white text-sm font-bold flex items-center gap-1.5
                       transition-colors disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            {aiSearching
              ? <Loader2 size={16} className="animate-spin" />
              : <span className="text-base leading-none">✨</span>}
            <span className="hidden sm:inline">{isRTL ? 'بحث ذكي' : 'AI'}</span>
          </button>

          <button
            type="submit"
            className="bg-emerald hover:bg-emerald-dark text-white px-6 py-3.5
                       rounded-xl font-bold text-sm transition-colors whitespace-nowrap"
          >
            {isRTL ? 'بحث' : 'Search'}
          </button>
        </form>

        {/* AI hint */}
        <p className="text-slate-light text-xs text-center mb-8">
          {isRTL
            ? '✨ جرّب: "أريد شاحنة مبردة في جدة بأقل من 8000" ← يضبط الفلاتر تلقائياً'
            : '✨ Try: "refrigerated truck for rent in Jeddah under 8000" → filters set automatically'}
        </p>

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
        <div className="flex gap-3 justify-center flex-wrap mb-0">
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

        {/* Stats */}
        <div className="flex gap-10 justify-center mt-16 pt-10
                        border-t border-slate-tint flex-wrap">
          {statItems.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black text-emerald-dark">{stat.num}</div>
              <div className="text-slate text-xs mt-1">{stat.label}</div>
            </div>
          ))}
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
