import type { Metadata } from 'next'
import Link from 'next/link'
import { ARTICLES } from '@/content/articles'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import NewsletterSignup from '@/components/NewsletterSignup'

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  // Bare title — root template adds ' | نوافذ'
  const title = isAr
    ? 'دليل اللوجستيك في السعودية'
    : 'Saudi Arabia Logistics Guide'
  const description = isAr
    ? 'مقالات ودلائل عملية لقطاع النقل واللوجستيك في السعودية: التراخيص، الأسعار، العقود، وأفضل الممارسات.'
    : 'Practical articles and guides for the Saudi transport and logistics sector: licenses, pricing, contracts, and best practices.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/articles`,
      languages: { ar: `${BASE}/ar/articles`, en: `${BASE}/en/articles` },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/articles`,
      title,
      description,
      images: [{ url: '/logo.png', alt: 'نوافذ' }],
    },
  }
}

export default async function ArticlesIndexPage({ params }: Props) {
  const { locale } = await params
  const isAr = locale === 'ar'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-navy mb-3">
              {isAr ? 'دليل اللوجستيك في السعودية' : 'Saudi Arabia Logistics Guide'}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? 'مقالات ودلائل عملية كتبها فريق نوافذ لمحترفي قطاع النقل واللوجستيك في المملكة العربية السعودية.'
                : 'Practical articles and guides written by the Nwafiz team for professionals in the Saudi transport and logistics sector.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ARTICLES.map(a => (
              <Link
                key={a.slug}
                href={`/${locale}/articles/${a.slug}`}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-emerald transition"
              >
                <div className="text-5xl mb-4">{a.icon}</div>
                <h2 className="font-black text-lg text-navy leading-snug mb-2 group-hover:text-emerald transition">
                  {isAr ? a.title_ar : a.title_en}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                  {isAr ? a.description_ar : a.description_en}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>📖 {a.reading_minutes} {isAr ? 'دقائق قراءة' : 'min read'}</span>
                  <span className="text-emerald font-semibold group-hover:translate-x-1 transition">
                    {isAr ? 'اقرأ ←' : 'Read →'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 max-w-2xl mx-auto">
            <NewsletterSignup source="articles_index" />
          </div>

          <div className="mt-12 bg-navy text-white rounded-2xl p-8 text-center">
            <h3 className="text-xl font-black mb-2">
              {isAr ? 'انشر إعلانك على نوافذ' : 'Post Your Listing on Nwafiz'}
            </h3>
            <p className="text-sm text-gray-300 mb-5 max-w-xl mx-auto">
              {isAr
                ? 'انضم إلى أكثر من 580 إعلان لوجستي نشط — بيع، إيجار، عقود، وظائف، نقاشات.'
                : 'Join 580+ active logistics listings — sales, rentals, contracts, jobs, discussions.'}
            </p>
            <Link
              href={`/${locale}/listings/create`}
              className="inline-block bg-emerald text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-600 transition"
            >
              {isAr ? '+ أضف إعلان' : '+ Add Listing'}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
