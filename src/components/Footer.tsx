'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
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
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-emerald rounded-xl flex items-center justify-center
                              text-white font-black text-lg">ن</div>
              <span className="text-white font-black text-xl">نوافذ</span>
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
                  href="mailto:info@creativealphat.com"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Mail size={11} className="text-emerald shrink-0" />
                  info@creativealphat.com
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

          {/* Sections */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">{t('sections')}</h4>
            <div className="flex flex-col gap-2 text-sm">
              {['ma', 'fleet', 'contracts', 'jobs', 'forum'].map((sec) => (
                <Link key={sec} href={`/${locale}/listings?section=${sec}`}
                  className="hover:text-white transition-colors">
                  {ts(`${sec}_title` as Parameters<typeof ts>[0])}
                </Link>
              ))}
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
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">{t('support')}</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">{t('terms')}</Link>
              <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">{t('privacy')}</Link>
              <a href="mailto:info@creativealphat.com" className="hover:text-white transition-colors">
                {t('contact')}
              </a>
              <Link href={`/${locale}/faq`} className="hover:text-white transition-colors">{t('faq')}</Link>
            </div>
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
