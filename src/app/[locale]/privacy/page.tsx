'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-black text-navy mb-2">
          {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          {isRTL ? 'آخر تحديث: مايو 2025' : 'Last updated: May 2025'}
        </p>

        <div className="card p-8 space-y-6 text-gray-700 leading-relaxed text-sm">

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '١. المعلومات التي نجمعها' : '1. Information We Collect'}
            </h2>
            <p>
              {isRTL
                ? 'نجمع المعلومات التي تقدمها عند التسجيل (الاسم، البريد الإلكتروني، رقم الجوال) والمعلومات المتعلقة بالإعلانات والمعاملات داخل المنصة.'
                : 'We collect information you provide during registration (name, email, phone number) and information related to listings and transactions within the platform.'}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '٢. استخدام المعلومات' : '2. Use of Information'}
            </h2>
            <p>
              {isRTL
                ? 'نستخدم معلوماتك لتوفير الخدمة، وتحسينها، وإرسال الإشعارات ذات الصلة. لن نبيع بياناتك لأطراف ثالثة.'
                : 'We use your information to provide and improve the service, and to send relevant notifications. We will not sell your data to third parties.'}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '٣. حماية البيانات' : '3. Data Protection'}
            </h2>
            <p>
              {isRTL
                ? 'نطبق معايير أمان عالية لحماية بياناتك. جميع الاتصالات مشفرة عبر HTTPS.'
                : 'We apply high security standards to protect your data. All communications are encrypted via HTTPS.'}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '٤. مشاركة البيانات' : '4. Data Sharing'}
            </h2>
            <p>
              {isRTL
                ? 'قد نشارك بياناتك مع مزودي خدمات موثوقين لأغراض تشغيلية فقط (مثل بوابات الدفع، خدمات البريد الإلكتروني). لن تُستخدم لأغراض تجارية أخرى.'
                : 'We may share your data with trusted service providers for operational purposes only (e.g., payment gateways, email services). It will not be used for other commercial purposes.'}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '٥. ملفات تعريف الارتباط' : '5. Cookies'}
            </h2>
            <p>
              {isRTL
                ? 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وحفظ تفضيلاتك. يمكنك تعطيلها من إعدادات متصفحك.'
                : 'We use cookies to improve your experience and save your preferences. You can disable them in your browser settings.'}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-navy text-base mb-2">
              {isRTL ? '٦. حقوقك' : '6. Your Rights'}
            </h2>
            <p>
              {isRTL
                ? 'يحق لك الوصول إلى بياناتك وتصحيحها أو حذفها. للتواصل: '
                : 'You have the right to access, correct, or delete your data. Contact us: '}
              <a href="mailto:support@nawafez.sa" className="text-emerald hover:underline">
                support@nawafez.sa
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
