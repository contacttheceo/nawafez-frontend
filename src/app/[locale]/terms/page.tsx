'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-black text-navy mb-2">
          {isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          {isRTL ? 'آخر تحديث: مايو 2025' : 'Last updated: May 2025'}
        </p>

        <div className="card p-8 space-y-6 text-gray-700 leading-relaxed text-sm">

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '١. قبول الشروط' : '1. Acceptance of Terms'}
            </h2>
            <p>
              {isRTL
                ? 'باستخدامك منصة نوافذ فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي بند، يُرجى التوقف عن استخدام المنصة.'
                : 'By using the Nwafiz platform you agree to be bound by these terms. If you do not agree, please stop using the platform.'}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '٢. وصف الخدمة' : '2. Service Description'}
            </h2>
            <p>
              {isRTL
                ? 'نوافذ منصة B2B متخصصة في السوق اللوجستي السعودي، تتيح تداول الأصول والعقود والوظائف اللوجستية بين الشركات.'
                : 'Nwafiz is a B2B marketplace specializing in the Saudi logistics sector, enabling the trading of assets, contracts, and logistics jobs between companies.'}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '٣. التسجيل والحساب' : '3. Registration & Account'}
            </h2>
            <p>
              {isRTL
                ? 'يجب أن تكون جهة تجارية مسجلة لإنشاء حساب. أنت مسؤول عن سرية بياناتك وعن جميع الأنشطة التي تتم عبر حسابك.'
                : 'You must be a registered business entity to create an account. You are responsible for the confidentiality of your credentials and all activities under your account.'}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '٤. المحتوى المنشور' : '4. Published Content'}
            </h2>
            <p>
              {isRTL
                ? 'أنت مسؤول عن دقة وقانونية المحتوى الذي تنشره. تحتفظ نوافذ بالحق في إزالة أي محتوى يخالف هذه الشروط أو الأنظمة المعمول بها.'
                : 'You are responsible for the accuracy and legality of content you publish. Nwafiz reserves the right to remove any content that violates these terms or applicable regulations.'}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '٥. المدفوعات والإعلانات المميزة' : '5. Payments & Featured Listings'}
            </h2>
            <p>
              {isRTL
                ? 'تُعدّ رسوم الإعلانات المميزة غير قابلة للاسترداد بعد النشر. يتم معالجة المدفوعات بشكل آمن.'
                : 'Featured listing fees are non-refundable once published. Payments are processed securely.'}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '٦. التواصل معنا' : '6. Contact Us'}
            </h2>
            <p>
              {isRTL ? 'لأي استفسار: ' : 'For enquiries: '}
              <a href="mailto:support@nwafizlogi.com" className="text-emerald hover:underline">
                support@nwafizlogi.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-6 text-center">
          <Link href={`/${locale}/listings`} className="text-sm text-emerald hover:underline">
            {isRTL ? '← العودة للإعلانات' : 'Back to Listings →'}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
