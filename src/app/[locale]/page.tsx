import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import Navbar             from '@/components/Navbar'
import Footer             from '@/components/Footer'
import HeroSection        from '@/components/home/HeroSection'
import TrustBar           from '@/components/home/TrustBar'
import SectionsGrid       from '@/components/home/SectionsGrid'
import FeaturedListings   from '@/components/home/FeaturedListings'
import LatestListings     from '@/components/home/LatestListings'
import AIFeaturesSection  from '@/components/home/AIFeaturesSection'
import HowItWorks         from '@/components/home/HowItWorks'
import CTABanner          from '@/components/home/CTABanner'

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

// Re-render at most once an hour. Without this Next.js 15 treats the page
// as fully dynamic and emits `cache-control: no-store`, which tells
// Googlebot the response is ephemeral and tanks indexing.
export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'hero' })
  const isAr = locale === 'ar'
  // SEO-tuned title: includes the high-intent KSA keywords people actually
  // search for ("شاحنات", "نقل", "السعودية"). Use title.absolute so the
  // root template's ' | نوافذ' suffix is NOT appended — the homepage is
  // the brand's anchor page and including 'نوافذ' twice (here + via the
  // template) was producing duplicate-title warnings in Bing.
  const titleStr = isAr
    ? 'سوق النقل واللوجستيك في السعودية — نوافذ | شاحنات، عقود، توظيف'
    : 'Saudi Arabia Logistics Marketplace — Nwafiz | Trucks, Contracts, Jobs'
  const description = isAr
    ? 'منصة B2B لسوق النقل واللوجستيك في السعودية. بيع وشراء وتأجير الشاحنات والمعدات، عقود نقل، وظائف لوجستية، ومنتدى مختصين في مكان واحد.'
    : 'B2B marketplace for logistics in Saudi Arabia. Buy, sell, and rent trucks and equipment, post transport contracts, find logistics jobs — all in one place.'
  return {
    // .absolute opts out of the root template — we already have 'نوافذ'
    // in the title, no need for the suffix to add it again.
    title: { absolute: titleStr },
    description,
    alternates: {
      canonical: `${BASE}/${locale}`,
      languages: { ar: `${BASE}/ar`, en: `${BASE}/en` },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url: `${BASE}/${locale}`,
      title: titleStr,
      description,
      // Branded OG card — much better engagement than the bare logo.
      // Same /api/og endpoint can power any page via query params.
      images: [{
        url: `${BASE}/api/og?title=${encodeURIComponent(isAr ? 'منصة اللوجستيك B2B الأولى في السعودية' : "Saudi Arabia's First B2B Logistics Marketplace")}&subtitle=${encodeURIComponent(isAr ? 'شاحنات، عقود نقل، استحواذ، توظيف، منتدى' : 'Trucks, contracts, M&A, jobs, forum')}&stat=583%2B&statLabel=${encodeURIComponent(isAr ? 'إعلان نشط' : 'active listings')}`,
        width: 1200,
        height: 630,
        alt: isAr ? 'نوافذ' : 'Nwafiz',
      }],
    },
  }
}

async function fetchStats() {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://nwafiz.creativealphat.com'
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 3000)
    const res = await fetch(`${API}/api/stats`, {
      signal: ctrl.signal,
      next: { revalidate: 3600 }, // re-fetch once an hour at most
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return await res.json() as { total_listings: number; total_users: number; sections?: Record<string, number> }
  } catch { return null }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const stats = await fetchStats()
  const isAr  = locale === 'ar'

  // ItemList of the five main sections — anchors organic discovery via SERP
  const sectionsList = {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    name:        isAr ? 'أقسام نوافذ' : 'Nwafiz Sections',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الأساطيل اللوجستية' : 'Logistics Fleet',          url: `${BASE}/${locale}/listings?section=fleet` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'العقود التشغيلية'   : 'Operational Contracts',    url: `${BASE}/${locale}/listings?section=contracts` },
      { '@type': 'ListItem', position: 3, name: isAr ? 'بيع الكيانات (M&A)' : 'Business Acquisitions',    url: `${BASE}/${locale}/listings?section=ma` },
      { '@type': 'ListItem', position: 4, name: isAr ? 'الوظائف اللوجستية'  : 'Logistics Jobs',           url: `${BASE}/${locale}/listings?section=jobs` },
      { '@type': 'ListItem', position: 5, name: isAr ? 'منتدى الاستشارات'   : 'Consultation Forum',       url: `${BASE}/${locale}/listings?section=forum` },
    ],
  }

  // LocalBusiness — anchors "Nwafiz" as a recognized entity with Saudi Arabia focus
  const localBusiness = {
    '@context': 'https://schema.org',
    '@type':    'LocalBusiness',
    '@id':       `${BASE}/#org`,
    name:        isAr ? 'نوافذ' : 'Nwafiz',
    alternateName: 'Nwafiz Logistics',
    url:         BASE,
    logo:        `${BASE}/logo.png`,
    image:       `${BASE}/logo.png`,
    description: isAr
      ? 'منصة B2B لقطاع اللوجستيك في السعودية. تجمع أساطيل، عقود، توظيف، وبيع كيانات في مكان واحد.'
      : 'B2B marketplace for the Saudi logistics sector — fleets, operational contracts, jobs, and business acquisitions all in one place.',
    address: {
      '@type':         'PostalAddress',
      addressCountry:  'SA',
      addressRegion:   'الرياض',
    },
    areaServed: { '@type': 'Country', name: 'Saudi Arabia' },
    contactPoint: {
      '@type':       'ContactPoint',
      email:         'info@nwafizlogi.com',
      telephone:     '+966556716705',
      contactType:   'customer service',
      availableLanguage: ['Arabic', 'English'],
    },
    ...(stats?.total_listings && stats.total_listings > 0 ? {
      // Surface the live listings count as a stat Google may show in rich results
      additionalProperty: [
        { '@type': 'PropertyValue', name: isAr ? 'عدد الإعلانات' : 'Total Listings', value: stats.total_listings },
        ...(stats.total_users ? [{ '@type': 'PropertyValue', name: isAr ? 'عدد المستخدمين' : 'Total Users', value: stats.total_users }] : []),
      ],
    } : {}),
  }

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sectionsList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <AIFeaturesSection />
        <TrustBar />
        <SectionsGrid />
        <FeaturedListings />
        <LatestListings />
        <HowItWorks />
        <CTABanner />
      </main>
      <Footer />
    </div>
  )
}
