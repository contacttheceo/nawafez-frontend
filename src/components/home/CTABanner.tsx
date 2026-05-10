'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function CTABanner() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'

  return (
    <section className="bg-gradient-to-br from-emerald to-emerald-dark py-16 px-6">
      <div className="max-w-2xl mx-auto text-center text-white">
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-3xl font-black mb-3">
          {isRTL ? 'ابدأ نشر إعلانك اليوم' : 'Start Posting Today'}
        </h2>
        <p className="text-white/80 text-lg mb-8 leading-relaxed">
          {isRTL
            ? 'انضم لآلاف الشركات اللوجستية في السعودية — النشر مجاني'
            : 'Join thousands of Saudi logistics companies — Free to post'}
        </p>
        <Link
          href={`/${locale}/listings/create`}
          className="inline-block bg-white text-emerald-dark font-black
                     px-10 py-4 rounded-2xl text-lg shadow-xl
                     hover:shadow-2xl hover:scale-105 transition-all duration-200"
        >
          {isRTL ? 'أنشئ إعلانك مجاناً' : 'Post for Free'}
        </Link>
      </div>
    </section>
  )
}
