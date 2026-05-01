'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

export default function Footer() {
  const t = useTranslations('footer')
  const ts = useTranslations('sections')
  const locale = useLocale()

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
            <p className="text-sm leading-relaxed">{t('desc')}</p>
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
              <Link href={`/${locale}/pricing`} className="hover:text-white transition-colors">{t('packages')}</Link>
              <Link href={`/${locale}/verify`} className="hover:text-white transition-colors">{t('verify')}</Link>
              <Link href={`/${locale}/dashboard`} className="hover:text-white transition-colors">لوحة التحكم</Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">{t('support')}</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">{t('terms')}</Link>
              <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">{t('privacy')}</Link>
              <Link href={`/${locale}/contact`} className="hover:text-white transition-colors">{t('contact')}</Link>
              <Link href={`/${locale}/faq`} className="hover:text-white transition-colors">{t('faq')}</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-5 flex flex-col md:flex-row
                        items-center justify-between gap-3 text-xs">
          <span>© {new Date().getFullYear()} نوافذ — {t('copyright')}</span>
          <div className="flex gap-2">
            <span className="bg-white/10 px-3 py-1 rounded-md">🇸🇦 {t('saudi')}</span>
            <span className="bg-white/10 px-3 py-1 rounded-md">🔒 {t('secure')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
