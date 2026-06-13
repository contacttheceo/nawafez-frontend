import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

export const revalidate = 86400

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  // Bare title — root template adds ' | نوافذ'
  const title = isAr ? 'الإعلام والمحتوى الصحفي' : 'Press & Media'
  const description = isAr
    ? 'مواد صحفية، إحصائيات، وصور لنوافذ — منصة اللوجستيك B2B الأولى في السعودية. مفتوحة للصحفيين والباحثين.'
    : 'Press materials, statistics, and brand assets for Nwafiz — the leading B2B logistics platform in Saudi Arabia. Open for journalists and researchers.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/press`,
      languages: { ar: `${BASE}/ar/press`, en: `${BASE}/en/press` },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/press`,
      title,
      description,
      images: [{ url: '/logo.png', alt: 'نوافذ' }],
    },
  }
}

export default async function PressPage({ params }: Props) {
  const { locale } = await params
  const isAr = locale === 'ar'

  const facts = isAr
    ? [
        { label: 'تاريخ الإطلاق',         value: 'مارس 2026' },
        { label: 'النوع',                    value: 'منصة B2B للوجستيك' },
        { label: 'المقر',                    value: 'الرياض، السعودية' },
        { label: 'حجم السوق المستهدف', value: '70 مليار ريال' },
        { label: 'الإعلانات النشطة',    value: '583+' },
        { label: 'المستخدمون',             value: '250+' },
        { label: 'المدن المغطاة',         value: '15' },
        { label: 'الفئات',                   value: '5 (أسطول، عقود، استحواذ، توظيف، منتدى)' },
      ]
    : [
        { label: 'Launch date',         value: 'March 2026' },
        { label: 'Type',                value: 'B2B logistics marketplace' },
        { label: 'Headquarters',        value: 'Riyadh, Saudi Arabia' },
        { label: 'Target market size',  value: 'SAR 70 billion' },
        { label: 'Active listings',     value: '583+' },
        { label: 'Users',               value: '250+' },
        { label: 'Cities covered',      value: '15' },
        { label: 'Categories',          value: '5 (Fleet, Contracts, M&A, Jobs, Forum)' },
      ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-3xl mx-auto">

          <header className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-navy mb-3">
              {isAr ? 'الإعلام والمحتوى الصحفي' : 'Press & Media'}
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              {isAr
                ? 'كل ما يحتاجه الصحفيون والباحثون عن نوافذ في صفحة واحدة.'
                : 'Everything journalists and researchers need about Nwafiz on one page.'}
            </p>
          </header>

          {/* Fast facts */}
          <section className="mb-10 bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-black text-navy mb-4">
              {isAr ? '📌 حقائق سريعة' : '📌 Fast Facts'}
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {facts.map(f => (
                  <tr key={f.label} className="border-b border-gray-200 last:border-0">
                    <td className="py-2 text-gray-600 align-top">{f.label}</td>
                    <td className="py-2 font-semibold text-navy">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Boilerplate */}
          <section className="mb-10">
            <h2 className="text-xl font-black text-navy mb-3">
              {isAr ? '📝 نبذة جاهزة للنشر' : '📝 Ready-to-publish boilerplate'}
            </h2>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                <strong>{isAr ? 'باللغة العربية' : 'In Arabic'}:</strong>
              </p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl italic">
                نوافذ هي منصة سعودية B2B متخصصة في النقل واللوجستيك، أُطلقت في مارس 2026. تربط المنصة بين مزوّدي الخدمات اللوجستية والشركات الباحثة عن هذه الخدمات في بيئة شفافة وموثّقة. تستضيف نوافذ 5 أقسام رئيسية: بيع وإيجار الأساطيل، عقود النقل بنظام Blind Bidding، صفقات الاستحواذ، الوظائف، والمنتدى المختص. كل المزوّدين الرئيسيين يمرّون بتحقق تجاري (CR). المقر: الرياض.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-3">
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                <strong>{isAr ? 'باللغة الإنجليزية' : 'In English'}:</strong>
              </p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl italic" dir="ltr">
                Nwafiz is a Saudi B2B marketplace specializing in transport and logistics, launched in March 2026. The platform connects logistics service providers with businesses seeking these services in a transparent, verified environment. Nwafiz hosts 5 main categories: fleet sales and rentals, transport contracts via Blind Bidding, M&A deals, jobs, and a specialized forum. All major providers pass commercial verification (CR). Headquartered in Riyadh.
              </p>
            </div>
          </section>

          {/* Brand assets */}
          <section className="mb-10">
            <h2 className="text-xl font-black text-navy mb-3">
              {isAr ? '🎨 الأصول البصرية' : '🎨 Brand assets'}
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <a href="/logo.png" download className="bg-white border border-gray-200 rounded-2xl p-5 text-center hover:border-emerald hover:shadow transition">
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-sm font-bold text-navy">{isAr ? 'الشعار الأساسي' : 'Primary logo'}</div>
                <div className="text-xs text-gray-500 mt-1">PNG · 800×626</div>
              </a>
              <a href="/logo-white.png" download className="bg-navy text-white border border-navy rounded-2xl p-5 text-center hover:shadow transition">
                <div className="text-4xl mb-2">🌙</div>
                <div className="text-sm font-bold">{isAr ? 'شعار أبيض' : 'White logo'}</div>
                <div className="text-xs opacity-80 mt-1">PNG · للخلفيات الداكنة</div>
              </a>
              <a href="/logo-transparent.png" download className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center hover:border-emerald hover:shadow transition">
                <div className="text-4xl mb-2">🪟</div>
                <div className="text-sm font-bold text-navy">{isAr ? 'شفّاف' : 'Transparent'}</div>
                <div className="text-xs text-gray-500 mt-1">PNG · للتركيب</div>
              </a>
            </div>
          </section>

          {/* Story angles */}
          <section className="mb-10 bg-emerald/5 border border-emerald/20 rounded-2xl p-6">
            <h2 className="text-xl font-black text-navy mb-4">
              {isAr ? '💡 زوايا قصصية مقترحة' : '💡 Suggested story angles'}
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>📈 <strong>{isAr ? 'كيف يكسر Blind Bidding احتكار الكبار' : 'How Blind Bidding breaks the big players\' monopoly'}</strong></li>
              <li>🎯 <strong>{isAr ? 'لماذا أصغر مزوّد فاز بعقد 2.4 مليون ريال' : 'How the smallest provider won an SAR 2.4M contract'}</strong></li>
              <li>📊 <strong>{isAr ? 'سوق اللوجستيك السعودي بالأرقام: 70 مليار ريال وكيف تتوزع' : 'Saudi logistics market by numbers: SAR 70B and how it splits'}</strong></li>
              <li>🚀 <strong>{isAr ? 'دور المنصات الرقمية في تحقيق رؤية 2030' : "Digital platforms' role in achieving Vision 2030"}</strong></li>
              <li>📉 <strong>{isAr ? 'لماذا 47% من إعلانات الشاحنات لا تحقق هدفها' : "Why 47% of truck listings fail to achieve their goal"}</strong></li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-navy text-white rounded-2xl p-6 text-center">
            <h2 className="text-xl font-black mb-2">
              {isAr ? '📧 للتواصل الإعلامي' : '📧 Media inquiries'}
            </h2>
            <p className="text-sm opacity-90 mb-4">
              {isAr ? 'نرد على الصحفيين خلال 24 ساعة' : 'We respond to journalists within 24 hours'}
            </p>
            <a
              href="mailto:press@nwafizlogi.com?subject=Media%20Inquiry"
              className="inline-block bg-emerald text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-600"
            >
              press@nwafizlogi.com
            </a>
            <div className="mt-4 text-xs opacity-70">
              <Link href={`/${locale}/about`} className="underline hover:opacity-100">
                {isAr ? 'تعرّف على نوافذ أكثر' : 'Learn more about Nwafiz'}
              </Link>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
