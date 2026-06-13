import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CITIES, getCity } from '@/content/cities'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Props = { params: Promise<{ locale: string; slug: string }> }

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'
const API  = process.env.NEXT_PUBLIC_API_URL ?? 'https://nwafiz.creativealphat.com'

// Refresh once an hour — listing counts change frequently.
export const revalidate = 3600

export async function generateStaticParams() {
  return CITIES.flatMap(c => [
    { locale: 'ar', slug: c.slug },
    { locale: 'en', slug: c.slug },
  ])
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const c = getCity(slug)
  if (!c) return { title: 'Not Found' }

  const isAr = locale === 'ar'
  const cityName = isAr ? c.name_ar : c.name_en
  const title = isAr
    ? `شاحنات، عقود، وظائف لوجستية في ${cityName} | نوافذ`
    : `Trucks, Contracts & Logistics Jobs in ${cityName} | Nwafiz`
  const description = isAr
    ? `أحدث إعلانات بيع وإيجار الشاحنات، عقود النقل، والوظائف اللوجستية في ${cityName}. منصة B2B موثوقة لمحترفي قطاع النقل.`
    : `Latest listings for truck sales, rentals, transport contracts, and logistics jobs in ${cityName}. Trusted B2B platform for transport professionals.`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/cities/${c.slug}`,
      languages: {
        ar: `${BASE}/ar/cities/${c.slug}`,
        en: `${BASE}/en/cities/${c.slug}`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/cities/${c.slug}`,
      title,
      description,
      images: [{ url: '/logo.png', alt: cityName }],
    },
  }
}

interface BackendListing {
  id:       number
  title_ar: string | null
  title_en: string | null
  section:  string
  city:     string | null
  price:    number | null
  currency: string | null
  media?:   Array<{ path: string; type: string; is_primary?: boolean }>
}

async function fetchCityListings(filterValue: string): Promise<BackendListing[]> {
  try {
    const url = `${API}/api/listings?city=${encodeURIComponent(filterValue)}&limit=12`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json: { data?: BackendListing[] } = await res.json()
    return json.data ?? []
  } catch { return [] }
}

export default async function CityPage({ params }: Props) {
  const { locale, slug } = await params
  const c = getCity(slug)
  if (!c) notFound()

  const isAr = locale === 'ar'
  const cityName  = isAr ? c.name_ar : c.name_en
  const region    = isAr ? c.region_ar : c.region_en
  const features  = isAr ? c.features_ar : c.features_en
  const popLabel  = isAr ? c.population_label_ar : c.population_label_en

  const listings = await fetchCityListings(c.listings_filter_value)

  // Group by section for the quick-stats strip
  const sections = ['fleet', 'contracts', 'jobs', 'ma', 'forum'] as const
  const countBySection = Object.fromEntries(
    sections.map(s => [s, listings.filter(l => l.section === s).length])
  ) as Record<typeof sections[number], number>

  const sectionLabels = isAr
    ? { fleet: '🚛 أسطول', contracts: '📄 عقود', jobs: '💼 وظائف', ma: '🏢 استحواذ', forum: '💬 منتدى' }
    : { fleet: '🚛 Fleet', contracts: '📄 Contracts', jobs: '💼 Jobs', ma: '🏢 M&A', forum: '💬 Forum' }

  // Place schema — helps Google understand this is a geo-targeted page
  const placeSchema = {
    '@context':  'https://schema.org',
    '@type':     'Place',
    name:        cityName,
    address: {
      '@type':         'PostalAddress',
      addressLocality: cityName,
      addressRegion:   region,
      addressCountry:  'SA',
    },
    geo: {
      '@type':    'GeoCoordinates',
      latitude:   c.lat,
      longitude:  c.lng,
    },
  }
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home',          item: `${BASE}/${locale}` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'المدن'    : 'Cities',         item: `${BASE}/${locale}/cities` },
      { '@type': 'ListItem', position: 3, name: cityName,                              item: `${BASE}/${locale}/cities/${c.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Hero */}
          <section className="mb-10">
            <div className="text-6xl mb-3">{c.icon}</div>
            <h1 className="text-3xl sm:text-4xl font-black text-navy mb-2">
              {isAr
                ? `سوق اللوجستيك في ${cityName}`
                : `The Logistics Market in ${cityName}`}
            </h1>
            <p className="text-gray-600">
              {region} · {popLabel}
            </p>
          </section>

          {/* Quick stats */}
          <section className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
            {sections.map(s => (
              <Link
                key={s}
                href={`/${locale}/listings?section=${s}&city=${encodeURIComponent(c.listings_filter_value)}`}
                className="bg-white border border-gray-200 rounded-2xl p-4 text-center hover:border-emerald hover:shadow transition"
              >
                <div className="text-2xl mb-1">{sectionLabels[s].split(' ')[0]}</div>
                <div className="text-2xl font-black text-navy">{countBySection[s]}</div>
                <div className="text-xs text-gray-500 mt-1">{sectionLabels[s].split(' ').slice(1).join(' ')}</div>
              </Link>
            ))}
          </section>

          {/* Why this city matters */}
          <section className="mb-10 bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-black text-navy mb-4">
              {isAr ? `لماذا ${cityName} مهمة لقطاع اللوجستيك؟` : `Why ${cityName} matters for logistics`}
            </h2>
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-emerald font-bold shrink-0">✓</span>
                  <span className="text-gray-700 leading-relaxed text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Live listings */}
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-xl font-black text-navy">
                {isAr ? `أحدث الإعلانات في ${cityName}` : `Latest listings in ${cityName}`}
              </h2>
              <Link
                href={`/${locale}/listings?city=${encodeURIComponent(c.listings_filter_value)}`}
                className="text-sm text-emerald font-bold hover:underline"
              >
                {isAr ? 'تصفّح الكل ←' : 'Browse all →'}
              </Link>
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-2xl">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 text-sm mb-4">
                  {isAr
                    ? `لا توجد إعلانات حالياً في ${cityName}. كن أول من ينشر!`
                    : `No listings yet in ${cityName}. Be the first to post!`}
                </p>
                <Link
                  href={`/${locale}/listings/create`}
                  className="inline-block bg-emerald text-white text-sm font-bold px-6 py-2 rounded-xl hover:bg-emerald-600"
                >
                  {isAr ? '+ أضف إعلان' : '+ Add Listing'}
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.slice(0, 9).map(l => {
                  const title = isAr ? (l.title_ar ?? l.title_en) : (l.title_en ?? l.title_ar)
                  const primary = l.media?.find(m => m.type === 'image' && m.is_primary)
                               ?? l.media?.find(m => m.type === 'image')
                  const imgUrl = primary ? `${API}/uploads/${primary.path}` : null
                  return (
                    <Link
                      key={l.id}
                      href={`/${locale}/listings/${l.id}`}
                      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-emerald transition group"
                    >
                      <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">
                        {imgUrl
                          ? <img src={imgUrl} alt={title ?? ''} className="w-full h-full object-cover" loading="lazy" />
                          : <span>📦</span>}
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-sm text-navy line-clamp-2 mb-2 group-hover:text-emerald transition">
                          {title}
                        </p>
                        {l.price && (
                          <p className="text-sm font-bold text-navy">
                            {Number(l.price).toLocaleString(isAr ? 'ar-SA' : 'en-US')} {isAr ? 'ر.س' : 'SAR'}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Related cities */}
          <section className="mb-10">
            <h2 className="text-xl font-black text-navy mb-4">
              {isAr ? 'مدن أخرى' : 'Other cities'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CITIES.filter(o => o.slug !== c.slug).map(o => (
                <Link
                  key={o.slug}
                  href={`/${locale}/cities/${o.slug}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-emerald hover:shadow transition"
                >
                  <div className="text-3xl mb-1">{o.icon}</div>
                  <div className="font-bold text-sm text-navy">{isAr ? o.name_ar : o.name_en}</div>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-navy text-white rounded-2xl p-8 text-center">
            <h3 className="text-xl font-black mb-2">
              {isAr ? `لديك خدمة لوجستية في ${cityName}؟` : `Have a logistics service in ${cityName}?`}
            </h3>
            <p className="text-sm text-gray-300 mb-5">
              {isAr ? 'انشر إعلانك مجاناً — يصل لمحترفي القطاع في 24 ساعة' : 'Post free — reaches professionals within 24 hours'}
            </p>
            <Link
              href={`/${locale}/listings/create`}
              className="inline-block bg-emerald text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-600 transition"
            >
              {isAr ? '+ أضف إعلان' : '+ Add Listing'}
            </Link>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
