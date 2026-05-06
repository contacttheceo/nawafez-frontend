'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { statsApi } from '@/lib/api'

export default function HeroSection() {
  const t      = useTranslations('hero')
  const locale = useLocale()
  const router = useRouter()

  const [query,  setQuery]  = useState('')
  const [stats,  setStats]  = useState<{ total_listings: number; total_users: number } | null>(null)

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

  const fmt = (n: number) =>
    `+${n.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`

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
    <section className="relative bg-gradient-to-br from-navy-dark via-navy to-[#1E3A8A]
                        text-white py-20 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 start-1/4 w-96 h-96 bg-emerald/10
                        rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 end-1/4 w-64 h-64 bg-white/5
                        rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-block bg-emerald/20 border border-emerald/40
                        text-emerald-light px-4 py-1.5 rounded-full text-sm mb-6">
          🚀 {t('badge')}
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-black leading-tight mb-4">
          {t('title')}{' '}
          <span className="text-emerald-light">{t('title_highlight')}</span>
        </h1>

        {/* Description */}
        <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          {t('desc')}
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch}
              className="flex gap-2 max-w-xl mx-auto mb-8">
          <div className="relative flex-1">
            <Search size={18}
                    className="absolute start-3 top-1/2 -translate-y-1/2
                               text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                locale === 'ar'
                  ? 'ابحث عن شاحنة، عقد، وظيفة...'
                  : 'Search trucks, contracts, jobs...'
              }
              className="w-full ps-10 pe-4 py-3.5 rounded-xl bg-white text-gray-900
                         placeholder-gray-400 text-sm focus:outline-none
                         focus:ring-2 focus:ring-emerald"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald hover:bg-emerald-dark text-white px-6 py-3.5
                       rounded-xl font-bold text-sm transition-colors whitespace-nowrap"
          >
            {locale === 'ar' ? 'بحث' : 'Search'}
          </button>
        </form>

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
            className="bg-white/10 hover:bg-white/15 border border-white/30
                       text-white px-8 py-3.5 rounded-xl font-semibold text-base
                       transition-all duration-200"
          >
            {t('cta_secondary')}
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-10 justify-center mt-16 pt-10
                        border-t border-white/10 flex-wrap">
          {statItems.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black text-emerald-light">{stat.num}</div>
              <div className="text-white/60 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
