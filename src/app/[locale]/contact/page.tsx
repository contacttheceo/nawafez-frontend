import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

export const dynamic    = 'force-static'
export const revalidate = false

export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr ? 'تواصل معنا | نوافذ' : 'Contact Us | Nwafiz'
  const description = isAr
    ? 'تواصل مع فريق نوافذ — منصة اللوجستيك B2B في السعودية. واتساب، بريد، أو من خلال النموذج.'
    : 'Contact the Nwafiz team — Saudi Arabia\'s B2B logistics platform. WhatsApp, email, or via the form.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/contact`,
      languages: { ar: `${BASE}/ar/contact`, en: `${BASE}/en/contact` },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/contact`,
      title,
      description,
      images: [{ url: '/logo.png', alt: 'نوافذ' }],
    },
  }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  const isAr = locale === 'ar'

  // ContactPage schema
  const schema = {
    '@context':  'https://schema.org',
    '@type':     'ContactPage',
    name:        isAr ? 'تواصل معنا — نوافذ' : 'Contact Us — Nwafiz',
    url:         `${BASE}/${locale}/contact`,
    inLanguage:  isAr ? 'ar' : 'en',
    mainEntity: {
      '@type': 'Organization',
      name:    'Nwafiz',
      url:     BASE,
      contactPoint: [
        {
          '@type':       'ContactPoint',
          telephone:     '+966-55-671-6705',
          contactType:   'customer service',
          areaServed:    'SA',
          availableLanguage: ['Arabic', 'English'],
        },
      ],
    },
  }

  const methods = isAr
    ? [
        { icon: '💬', label: 'WhatsApp',      value: '+966 55 671 6705', href: 'https://wa.me/966556716705?text=' + encodeURIComponent('مرحباً، أرغب بمعرفة المزيد عن نوافذ'), primary: true, hint: 'الأسرع — رد خلال 30 دقيقة' },
        { icon: '📧', label: 'البريد العام',  value: 'info@nwafizlogi.com', href: 'mailto:info@nwafizlogi.com', hint: 'للاستفسارات العامة' },
        { icon: '🤝', label: 'التواصل التجاري', value: 'sales@nwafizlogi.com', href: 'mailto:sales@nwafizlogi.com', hint: 'الشراكات والباقات المؤسسية' },
        { icon: '📰', label: 'الإعلام',         value: 'press@nwafizlogi.com', href: 'mailto:press@nwafizlogi.com', hint: 'الصحفيون والكتاب' },
        { icon: '🆘', label: 'الدعم الفني',     value: 'support@nwafizlogi.com', href: 'mailto:support@nwafizlogi.com', hint: 'مشاكل تقنية في المنصة' },
      ]
    : [
        { icon: '💬', label: 'WhatsApp',      value: '+966 55 671 6705', href: 'https://wa.me/966556716705?text=' + encodeURIComponent("Hi, I'd like to know more about Nwafiz"), primary: true, hint: 'Fastest — reply within 30 min' },
        { icon: '📧', label: 'General',       value: 'info@nwafizlogi.com', href: 'mailto:info@nwafizlogi.com', hint: 'General inquiries' },
        { icon: '🤝', label: 'Sales',         value: 'sales@nwafizlogi.com', href: 'mailto:sales@nwafizlogi.com', hint: 'Partnerships and enterprise plans' },
        { icon: '📰', label: 'Press',         value: 'press@nwafizlogi.com', href: 'mailto:press@nwafizlogi.com', hint: 'Journalists and writers' },
        { icon: '🆘', label: 'Support',       value: 'support@nwafizlogi.com', href: 'mailto:support@nwafizlogi.com', hint: 'Technical issues' },
      ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <Navbar />
      <main className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-2xl mx-auto">

          <header className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-navy mb-3">
              {isAr ? 'تواصل معنا' : 'Contact Us'}
            </h1>
            <p className="text-gray-600">
              {isAr
                ? 'فريق نوافذ متاح للرد على استفساراتك. اختر أنسب طريقة لك.'
                : 'The Nwafiz team is here to answer your questions. Choose the method that suits you.'}
            </p>
          </header>

          {/* Methods */}
          <section className="space-y-3 mb-10">
            {methods.map(m => (
              <a
                key={m.label}
                href={m.href}
                target={m.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={`flex items-center gap-4 p-5 rounded-2xl border transition
                  ${m.primary
                    ? 'border-emerald bg-emerald/5 hover:bg-emerald/10'
                    : 'border-gray-200 hover:border-emerald hover:bg-gray-50'}`}
              >
                <div className={`text-4xl shrink-0`}>{m.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-navy">{m.label}</div>
                  <div className="text-sm text-gray-600 truncate">{m.value}</div>
                  {m.hint && <div className="text-xs text-gray-500 mt-0.5">{m.hint}</div>}
                </div>
              </a>
            ))}
          </section>

          {/* Address + hours */}
          <section className="grid sm:grid-cols-2 gap-4 mb-10">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-navy mb-2">📍 {isAr ? 'المقر' : 'Headquarters'}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Kingdom of Saudi Arabia'}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-navy mb-2">🕐 {isAr ? 'ساعات العمل' : 'Hours'}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {isAr ? 'الأحد - الخميس · 9 ص - 6 م' : 'Sun-Thu · 9am - 6pm'}<br />
                <span className="text-xs text-gray-500">{isAr ? '(توقيت الرياض)' : '(Riyadh time)'}</span>
              </p>
            </div>
          </section>

          {/* Links */}
          <section className="text-center text-sm">
            <p className="text-gray-600 mb-3">
              {isAr ? 'قبل المراسلة، ربما تجد إجابتك في:' : 'Before reaching out, you might find your answer in:'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={`/${locale}/faq`} className="text-emerald font-bold hover:underline">
                {isAr ? 'الأسئلة الشائعة' : 'FAQ'}
              </Link>
              <span className="text-gray-300">|</span>
              <Link href={`/${locale}/articles`} className="text-emerald font-bold hover:underline">
                {isAr ? 'دليل اللوجستيك' : 'Logistics Guide'}
              </Link>
              <span className="text-gray-300">|</span>
              <Link href={`/${locale}/about`} className="text-emerald font-bold hover:underline">
                {isAr ? 'من نحن' : 'About'}
              </Link>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
