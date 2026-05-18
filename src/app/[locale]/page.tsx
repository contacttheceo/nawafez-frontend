import { getTranslations } from 'next-intl/server'
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })
  const isAr = locale === 'ar'
  const title = isAr ? 'نوافذ — منصة اللوجستيك B2B' : 'Nawafez — B2B Logistics Marketplace'
  return {
    title,
    description: t('desc'),
    alternates: {
      canonical: `${BASE}/${locale}`,
      languages: { ar: `${BASE}/ar`, en: `${BASE}/en` },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url: `${BASE}/${locale}`,
      title,
      description: t('desc'),
      images: [{ url: '/logo.png', width: 800, height: 626, alt: 'نوافذ' }],
    },
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
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
