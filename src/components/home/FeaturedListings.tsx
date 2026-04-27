'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

// Placeholder cards shown before real data loads
const placeholders = [
  {
    id: 1, section: 'ma', title_ar: 'شركة توصيل وتخزين قائمة — 7 سنوات عمل',
    city: 'الرياض', price: 2400000, is_featured: true,
    is_financing_eligible: true, is_ready_to_operate: false,
    user: { name_ar: 'أرامكو لوجستيك', role: 'business', is_trusted_payer: false },
    views_count: 892, created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 2, section: 'fleet', title_ar: 'دبابة مياه مودل 2022 — لوحة بيضاء، كرت التشغيل ساري',
    city: 'جدة', price: 185000, is_featured: false,
    is_financing_eligible: false, is_ready_to_operate: true,
    user: { name_ar: 'محمد الغامدي', role: 'individual', is_trusted_payer: true },
    views_count: 234, created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 3, section: 'contracts', title_ar: 'عقد توصيل لتطبيق كبرى — منطقة الرياض',
    city: 'الرياض', price: 480000, is_featured: false,
    is_financing_eligible: false, is_ready_to_operate: false,
    user: { name_ar: 'كبرى للتوصيل', role: 'business', is_trusted_payer: false },
    views_count: 156, created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

const imgBg: Record<string, string> = {
  ma: 'from-green-100 to-green-200',
  fleet: 'from-blue-100 to-blue-200',
  contracts: 'from-amber-100 to-amber-200',
}

const sectionEmoji: Record<string, string> = {
  ma: '🏢', fleet: '🚛', contracts: '📄',
}

export default function FeaturedListings() {
  const t = useTranslations('listings')
  const tb = useTranslations('badges')
  const locale = useLocale()

  return (
    <section className="py-14 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-heading">{t('featured_title')}</h2>
            <p className="section-sub">{t('featured_sub')}</p>
          </div>
          <Link href={`/${locale}/listings`} className="btn-primary text-sm">
            {t('view_all')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {placeholders.map((item) => (
            <Link key={item.id} href={`/${locale}/listings/${item.id}`}>
              <article className={`card hover:border-emerald hover:shadow-card-lg
                                   transition-all duration-200 cursor-pointer overflow-hidden
                                   ${item.is_featured ? 'border-emerald' : ''}`}>
                <div className={`h-44 bg-gradient-to-br ${imgBg[item.section]}
                                 flex items-center justify-center text-5xl relative`}>
                  {sectionEmoji[item.section]}
                  {item.is_featured && (
                    <span className="absolute top-3 start-3 bg-navy text-white
                                     text-[10px] font-bold px-2 py-1 rounded-md">
                      ⭐ {tb('featured')}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {item.is_financing_eligible && (
                      <span className="badge-navy text-[10px]">💰 {tb('financing')}</span>
                    )}
                    {item.is_ready_to_operate && (
                      <span className="badge-green text-[10px]">🟢 {tb('ready')}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug mb-3 line-clamp-2">
                    {item.title_ar}
                  </h3>
                  <div className="flex gap-3 text-xs text-gray-400 mb-3">
                    <span>📍 {item.city}</span>
                    <span>👁️ {item.views_count}</span>
                  </div>
                  <div className="text-xl font-black text-navy">
                    {item.price.toLocaleString('ar-SA')}{' '}
                    <span className="text-xs font-normal text-gray-400">{t('sar')}</span>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100
                                flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-6 h-6 rounded-full bg-navy flex items-center
                                    justify-center text-white text-[10px] font-bold">
                      {item.user.name_ar.charAt(0)}
                    </div>
                    <span>{item.user.name_ar}</span>
                  </div>
                  <div className="flex gap-1">
                    {item.user.is_trusted_payer && (
                      <span className="badge-gold text-[10px]">🎖️</span>
                    )}
                    {item.user.role === 'business' && (
                      <span className="badge-emerald text-[10px]">✔ {tb('verified')}</span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
