'use client'

import { useLocale } from 'next-intl'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const faqs = {
  ar: [
    {
      q: 'ما هي منصة نوافذ؟',
      a: 'نوافذ هي منصة B2B متخصصة في السوق اللوجستي السعودي، تتيح للشركات تداول الأصول (الأسطول)، والعقود اللوجستية، وفرص الاستحواذ، والوظائف، والنقاشات المهنية.',
    },
    {
      q: 'كيف أنشر إعلاناً؟',
      a: 'بعد تسجيل الدخول، اضغط على "أضف إعلاناً" واتبع خطوات المعالج البسيط لاختيار القسم وملء التفاصيل ورفع الصور ونشر الإعلان.',
    },
    {
      q: 'ما الفرق بين الإعلان العادي والمميز؟',
      a: 'الإعلانات المميزة تظهر في قسم خاص أعلى صفحة الإعلانات بإطار ذهبي، مما يمنحها ظهوراً أكبر وفرصاً أعلى للتواصل.',
    },
    {
      q: 'كيف أتحقق من هويتي التجارية؟',
      a: 'من صفحة الملف الشخصي، انتقل إلى تبويب "التحقق التجاري" وارفع صورة السجل التجاري. سيراجع فريقنا الطلب خلال 24-48 ساعة.',
    },
    {
      q: 'هل يمكنني حفظ إعلانات أعجبتني؟',
      a: 'نعم، اضغط على أيقونة الإشارة المرجعية في أي بطاقة إعلان لحفظه، ويمكنك مراجعة إعلاناتك المحفوظة من لوحة التحكم.',
    },
    {
      q: 'كيف أتواصل مع صاحب الإعلان؟',
      a: 'يمكنك إرسال رسالة داخلية من صفحة الإعلان أو الضغط على زر واتساب (إذا كان الرقم متاحاً) للتواصل الفوري.',
    },
    {
      q: 'ما هي سياسة الإلغاء واسترداد المبالغ؟',
      a: 'رسوم الإعلانات المميزة غير قابلة للاسترداد بعد النشر. للاستفسار عن حالات استثنائية تواصل معنا عبر support@nawafez.sa',
    },
  ],
  en: [
    {
      q: 'What is Nawafez?',
      a: 'Nawafez is a B2B marketplace specialized in the Saudi logistics sector, enabling companies to trade assets (fleet), logistics contracts, M&A opportunities, jobs, and professional discussions.',
    },
    {
      q: 'How do I post a listing?',
      a: 'After logging in, click "Add Listing" and follow the simple wizard to choose the section, fill in details, upload photos, and publish.',
    },
    {
      q: 'What is the difference between regular and featured listings?',
      a: 'Featured listings appear in a special section at the top of the listings page with a golden border, giving them greater visibility and higher chances of engagement.',
    },
    {
      q: 'How do I verify my business identity?',
      a: 'From your profile page, go to the "Business Verification" tab and upload a photo of your commercial registration. Our team will review the request within 24-48 hours.',
    },
    {
      q: 'Can I save listings I like?',
      a: 'Yes, click the bookmark icon on any listing card to save it, and you can review your saved listings from the dashboard.',
    },
    {
      q: 'How do I contact a listing owner?',
      a: 'You can send an internal message from the listing page, or click the WhatsApp button (if a number is provided) for instant contact.',
    },
    {
      q: 'What is the refund policy?',
      a: 'Featured listing fees are non-refundable after publication. For exceptional cases, contact us at support@nawafez.sa',
    },
  ],
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-start gap-4 hover:text-emerald transition-colors"
      >
        <span className="font-semibold text-sm text-navy">{q}</span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function FaqPage() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const items  = isRTL ? faqs.ar : faqs.en

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-black text-navy mb-2">
          {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {isRTL ? 'إجابات على أكثر الأسئلة شيوعاً' : 'Answers to the most common questions'}
        </p>

        <div className="card p-6">
          {items.map((item, i) => (
            <FaqItem key={i} {...item} />
          ))}
        </div>

        <div className="mt-8 card p-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            {isRTL ? 'لم تجد إجابة؟ تواصل معنا مباشرةً' : "Didn't find an answer? Contact us directly"}
          </p>
          <a
            href="mailto:support@nawafez.sa"
            className="btn-primary text-sm px-6 py-2"
          >
            support@nawafez.sa
          </a>
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
