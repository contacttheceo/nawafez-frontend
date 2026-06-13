import type { Metadata } from 'next'
import Link from 'next/link'
import { CITIES } from '@/content/cities'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

export const revalidate = 86400

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr
    ? 'سوق اللوجستيك حسب المدينة | نوافذ'
    : 'Logistics Market by City | Nwafiz'
  const description = isAr
    ? 'تصفّح إعلانات الشاحنات، عقود النقل، والوظائف اللوجستية في المدن السعودية الكبرى: الرياض، جدة، الدمام، مكة، المدينة.'
    : 'Browse truck listings, transport contracts, and logistics jobs in major Saudi cities: Riyadh, Jeddah, Dammam, Mecca, Medina.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/cities`,
      languages: { ar: `${BASE}/ar/cities`, en: `${BASE}/en/cities` },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/cities`,
      title,
      description,
      images: [{ url: '/logo.png', alt: 'نوافذ' }],
    },
  }
}

export default async function CitiesIndexPage({ params }: Props) {
  const { locale } = await params
  const isAr = locale === 'ar'
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-navy mb-3">
              {isAr ? 'تصفّح حسب المدينة' : 'Browse by City'}
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              {isAr
                ? 'إعلانات لوجستية في أكبر المدن السعودية — كل مدينة بصفحتها الخاصة.'
                : 'Logistics listings across major Saudi cities — each with its own page.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CITIES.map(c => (
              <Link
                key={c.slug}
                href={`/${locale}/cities/${c.slug}`}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-emerald transition"
              >
                <div className="text-5xl mb-3">{c.icon}</div>
                <h2 className="text-xl font-black text-navy mb-1 group-hover:text-emerald transition">
                  {isAr ? c.name_ar : c.name_en}
                </h2>
                <p className="text-xs text-gray-500 mb-3">{isAr ? c.region_ar : c.region_en}</p>
                <p className="text-xs text-gray-600">
                  {isAr ? c.population_label_ar : c.population_label_en}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
