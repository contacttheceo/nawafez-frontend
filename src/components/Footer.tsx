'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, Globe } from 'lucide-react'

export default function Footer() {
  const t = useTranslations('footer')
  const ts = useTranslations('sections')
  const locale = useLocale()
  const isRTL = locale === 'ar'

  return (
    <footer className="bg-navy-dark text-white/70">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <Image
                src="/logo-white.png"
                alt="نوافذ — Nwafiz"
                width={140}
                height={110}
                priority
                className="h-12 w-auto"
              />
            </div>
            <p className="text-sm leading-relaxed mb-5">{t('desc')}</p>

            {/* Operating company */}
            <div className="border-t border-white/10 pt-4 space-y-2.5">
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">
                {isRTL ? 'تحت إدارة' : 'Operated by'}
              </p>
              <p className="text-white/80 text-xs font-semibold leading-snug">
                {isRTL ? 'شركة كريتيف ألفا التجارية' : 'Creative Alpha Commercial'}
              </p>
              <div className="flex flex-col gap-2 text-xs">
                <a
                  href="tel:+966556716705"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Phone size={11} className="text-emerald shrink-0" />
                  <span dir="ltr">+966 55 671 6705</span>
                </a>
                <a
                  href="mailto:info@nwafizlogi.com"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Mail size={11} className="text-emerald shrink-0" />
                  info@nwafizlogi.com
                </a>
                <a
                  href="https://www.nwafizlogi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Globe size={11} className="text-emerald shrink-0" />
                  nwafizlogi.com
                </a>
              </div>
            </div>
          </div>

          {/* Sections — deep-linked sub-categories so Googlebot finds
              every filter view, not just the top-level section page */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">{t('sections')}</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href={`/${locale}/listings?section=fleet&type=sale`} className="hover:text-white transition-colors">
                {isRTL ? 'أساطيل للبيع' : 'Fleet for sale'}
              </Link>
              <Link href={`/${locale}/listings?section=fleet&type=rent`} className="hover:text-white transition-colors">
                {isRTL ? 'أساطيل للتأجير' : 'Fleet for rent'}
              </Link>
              <Link href={`/${locale}/listings?section=contracts&type=offer`} className="hover:text-white transition-colors">
                {isRTL ? 'عقود تشغيلية' : 'Operational contracts'}
              </Link>
              <Link href={`/${locale}/listings?section=ma`} className="hover:text-white transition-colors">
                {isRTL ? 'بيع شركات (M&A)' : 'Business acquisitions'}
              </Link>
              <Link href={`/${locale}/listings?section=jobs`} className="hover:text-white transition-colors">
                {isRTL ? 'وظائف لوجستية' : 'Logistics jobs'}
              </Link>
              <Link href={`/${locale}/listings?section=forum`} className="hover:text-white transition-colors">
                {isRTL ? 'منتدى الاستشارات' : 'Forum'}
              </Link>
            </div>
          </div>

          {/* For Business */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">{t('for_business')}</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href={`/${locale}/listings/create`} className="hover:text-white transition-colors">{t('packages')}</Link>
              <Link href={`/${locale}/profile`} className="hover:text-white transition-colors">{t('verify')}</Link>
              <Link href={`/${locale}/dashboard`} className="hover:text-white transition-colors">
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
              <Link href={`/${locale}/tools/rental-calculator`} className="hover:text-white transition-colors">
                {isRTL ? 'حاسبة الإيجار' : 'Rental Calculator'}
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">
              {isRTL ? 'مصادر' : 'Resources'}
            </h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href={`/${locale}/articles`} className="hover:text-white transition-colors">
                {isRTL ? 'دليل اللوجستيك' : 'Logistics Guide'}
              </Link>
              <Link href={`/${locale}/cities`} className="hover:text-white transition-colors">
                {isRTL ? 'تصفّح حسب المدينة' : 'Browse by City'}
              </Link>
              <Link href={`/${locale}/sitemap`} className="hover:text-white transition-colors">
                {isRTL ? 'خريطة الموقع' : 'Sitemap'}
              </Link>
              <Link href={`/${locale}/faq`} className="hover:text-white transition-colors">{t('faq')}</Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">{t('support')}</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">{t('terms')}</Link>
              <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">{t('privacy')}</Link>
              <a href="mailto:info@nwafizlogi.com" className="hover:text-white transition-colors">
                {t('contact')}
              </a>
            </div>
          </div>
        </div>

        {/* Popular searches by city — deep links Googlebot can follow.
            Each link is a real query that returns results, never a 404. */}
        <div className="border-t border-white/10 pt-6 mb-6">
          <h5 className="text-white/60 text-[11px] uppercase tracking-wider font-bold mb-3">
            {isRTL ? 'بحث شائع حسب المدينة' : 'Popular searches by city'}
          </h5>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
            {['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الخبر', 'الطائف', 'تبوك', 'بريدة', 'الأحساء'].map((city) => (
              <Link
                key={city}
                href={`/${locale}/listings?city=${encodeURIComponent(city)}`}
                className="hover:text-white transition-colors"
              >
                {isRTL ? `لوجستيات ${city}` : `Logistics ${city}`}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-5 flex flex-col md:flex-row
                        items-center justify-between gap-3 text-xs">
          <div className="flex flex-col md:flex-row items-center gap-2 text-center md:text-start">
            <span>© {new Date().getFullYear()} نوافذ — {t('copyright')}</span>
            <span className="hidden md:inline text-white/20">|</span>
            <span className="text-white/40">
              {isRTL ? 'شركة كريتيف ألفا التجارية' : 'Creative Alpha Commercial'}
              {' · '}
              {isRTL ? 'ر.و:' : 'CR:'} 7042559364
            </span>
          </div>
          <div className="flex gap-2">
            <span className="bg-white/10 px-3 py-1 rounded-md">🇸🇦 {t('saudi')}</span>
            <span className="bg-white/10 px-3 py-1 rounded-md">🔒 {t('secure')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
