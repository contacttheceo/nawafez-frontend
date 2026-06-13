import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

export const revalidate = 86400 // daily

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr
    ? 'من نحن | نوافذ — منصة اللوجستيك B2B في السعودية'
    : 'About | Nwafiz — Saudi Arabia B2B Logistics Marketplace'
  const description = isAr
    ? 'نوافذ هي أول marketplace B2B متخصص في النقل واللوجستيك في السعودية. تعرف على رؤيتنا، فريقنا، والقيم التي تحرّك المنصة.'
    : 'Nwafiz is the first B2B marketplace dedicated to transport and logistics in Saudi Arabia. Learn about our vision, team, and values.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/about`,
      languages: { ar: `${BASE}/ar/about`, en: `${BASE}/en/about` },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/about`,
      title,
      description,
      images: [{ url: '/logo.png', alt: 'نوافذ' }],
    },
  }
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const isAr = locale === 'ar'

  // AboutPage schema — boosts E-E-A-T signals
  const schema = {
    '@context':  'https://schema.org',
    '@type':     'AboutPage',
    name:        isAr ? 'من نحن — نوافذ' : 'About — Nwafiz',
    url:         `${BASE}/${locale}/about`,
    inLanguage:  isAr ? 'ar' : 'en',
    description: isAr
      ? 'منصة B2B سعودية متخصصة في النقل واللوجستيك'
      : 'B2B platform specializing in Saudi transport and logistics',
    publisher: {
      '@type': 'Organization',
      name:    'Nwafiz',
      url:     BASE,
      logo: {
        '@type': 'ImageObject',
        url:     `${BASE}/logo.png`,
      },
    },
  }

  const values = isAr
    ? [
        { icon: '🔍', title: 'الشفافية', desc: 'أسعار ومعلومات مفتوحة. لا عمولات سرية. لا تواطؤ.' },
        { icon: '🛡️', title: 'الموثوقية', desc: 'كل مزوّد رئيسي يمرّ بتحقق تجاري. سجل عام لكل صفقة.' },
        { icon: '⚡', title: 'السرعة', desc: 'من التسجيل لأول إعلان في 5 دقائق. من السؤال للعرض في 24 ساعة.' },
        { icon: '🤝', title: 'الديمقراطية', desc: 'Blind Bidding يكافئ الجودة، ليس الحجم وحده. الصغار يفوزون أيضاً.' },
      ]
    : [
        { icon: '🔍', title: 'Transparency', desc: 'Open pricing and information. No hidden fees. No collusion.' },
        { icon: '🛡️', title: 'Trust',         desc: 'Every major provider passes commercial verification. Public record of every deal.' },
        { icon: '⚡', title: 'Speed',         desc: 'From signup to first listing in 5 minutes. From query to offer in 24 hours.' },
        { icon: '🤝', title: 'Democracy',     desc: 'Blind Bidding rewards quality, not just scale. Small players win too.' },
      ]

  const stats = isAr
    ? [
        { label: 'إعلان نشط', value: '583' },
        { label: 'مستخدم',     value: '250+' },
        { label: 'مدينة',       value: '15' },
        { label: 'فئات',        value: '5' },
      ]
    : [
        { label: 'Active listings', value: '583' },
        { label: 'Users',            value: '250+' },
        { label: 'Cities',           value: '15' },
        { label: 'Categories',       value: '5' },
      ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <Navbar />
      <main className="min-h-screen bg-white py-12 px-4">
        <article className="max-w-3xl mx-auto">

          {/* Hero */}
          <section className="text-center mb-12">
            <div className="text-6xl mb-4">🪟</div>
            <h1 className="text-4xl sm:text-5xl font-black text-navy mb-4">
              {isAr ? 'نوافذ' : 'Nwafiz'}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
              {isAr
                ? 'أول marketplace B2B متخصص في النقل واللوجستيك في السعودية. نوافذ مفتوحة على سوق كان مغلقاً.'
                : "Saudi Arabia's first B2B marketplace dedicated to transport and logistics. Open windows onto a market that was closed."}
            </p>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-4 gap-3 mb-12">
            {stats.map(s => (
              <div key={s.label} className="bg-emerald/10 border border-emerald/20 rounded-2xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-black text-emerald">{s.value}</div>
                <div className="text-xs text-gray-600 mt-1">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Story */}
          <section className="mb-12 space-y-5 text-gray-700 leading-relaxed">
            <h2 className="text-2xl font-black text-navy mb-3">
              {isAr ? 'قصتنا' : 'Our Story'}
            </h2>
            <p>
              {isAr
                ? 'سوق النقل واللوجستيك في السعودية يقدّر بـ 70 مليار ريال. ومع ذلك، نصف صفقاته تُعقد في مجموعات WhatsApp مغلقة، عبر مكالمات هاتفية، أو من خلال علاقات شخصية ضيقة.'
                : "Saudi Arabia's transport and logistics market is valued at SAR 70 billion. Yet half its deals are made in closed WhatsApp groups, phone calls, or narrow personal networks."}
            </p>
            <p>
              {isAr
                ? 'هذا يخلق سوقاً غير عادل: الكبار يكسبون أكثر مما يستحقون، الصغار يحرمون من فرص يستحقونها، والمستهلك النهائي يدفع تكاليف أعلى.'
                : 'This creates an unfair market: the big players gain more than they deserve, the small ones miss opportunities they earned, and the end consumer pays higher prices.'}
            </p>
            <p>
              {isAr
                ? 'في 2026، أنشأنا نوافذ لكسر هذا الجدار. منصة شفافة، موثقة، ومفتوحة للجميع — حيث الشاحنة الواحدة تنافس الأسطول، والمزوّد الجديد يبني سمعته من اليوم الأول، والشركات تجد بدائل بأسعار عادلة.'
                : "In 2026, we built Nwafiz to break that wall. A transparent, verified, open platform for everyone — where a single truck competes with the fleet, the new provider builds reputation from day one, and companies find fair-priced alternatives."}
            </p>
          </section>

          {/* Values */}
          <section className="mb-12">
            <h2 className="text-2xl font-black text-navy mb-5">
              {isAr ? 'قيمنا' : 'Our Values'}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {values.map(v => (
                <div key={v.title} className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                  <div className="text-3xl mb-2">{v.icon}</div>
                  <h3 className="font-black text-navy text-lg mb-1">{v.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Mission */}
          <section className="mb-12 bg-gradient-to-br from-navy to-navy/90 text-white rounded-2xl p-8">
            <h2 className="text-2xl font-black mb-3">
              {isAr ? 'مهمتنا' : 'Our Mission'}
            </h2>
            <p className="text-base leading-relaxed opacity-95 mb-3">
              {isAr
                ? 'تحويل قطاع النقل واللوجستيك في السعودية إلى سوق رقمي شفاف يكافئ الجودة والابتكار.'
                : "Transform Saudi Arabia's transport and logistics into a transparent digital market that rewards quality and innovation."}
            </p>
            <p className="text-sm leading-relaxed opacity-80">
              {isAr
                ? 'نحن جزء من رؤية 2030 الهادفة لرفع مساهمة القطاع في الناتج المحلي من 6% إلى 10%.'
                : "We are part of Vision 2030's goal of raising the sector's GDP contribution from 6% to 10%."}
            </p>
          </section>

          {/* CTA */}
          <section className="text-center">
            <h3 className="text-xl font-black text-navy mb-3">
              {isAr ? 'انضم إلى نوافذ' : 'Join Nwafiz'}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {isAr ? 'مجاناً 100% خلال فترة الإطلاق' : '100% free during launch period'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href={`/${locale}/auth/register`}
                className="bg-emerald text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-600"
              >
                {isAr ? 'سجّل الآن' : 'Sign Up'}
              </Link>
              <Link
                href={`/${locale}/listings`}
                className="bg-white border-2 border-navy text-navy font-bold px-8 py-3 rounded-xl hover:bg-navy hover:text-white transition"
              >
                {isAr ? 'تصفّح الإعلانات' : 'Browse Listings'}
              </Link>
            </div>
          </section>

        </article>
      </main>
      <Footer />
    </>
  )
}
