'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

export default function HeroSection() {
  const t = useTranslations('hero')
  const locale = useLocale()

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
        <p className="text-white/80 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          {t('desc')}
        </p>

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
            href={`#how`}
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
          {[
            { num: '+1,240', label: t('stat_listings') },
            { num: '+380',   label: t('stat_businesses') },
            { num: '+95M',   label: t('stat_deals') },
            { num: '21',     label: t('stat_cities') },
          ].map((stat) => (
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
