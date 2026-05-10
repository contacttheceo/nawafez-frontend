import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Navbar           from '@/components/Navbar'
import Footer           from '@/components/Footer'
import HeroSection      from '@/components/home/HeroSection'
import TrustBar         from '@/components/home/TrustBar'
import SectionsGrid     from '@/components/home/SectionsGrid'
import FeaturedListings from '@/components/home/FeaturedListings'
import LatestListings   from '@/components/home/LatestListings'
import HowItWorks       from '@/components/home/HowItWorks'
import CTABanner        from '@/components/home/CTABanner'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })
  return {
    title: locale === 'ar' ? 'نوافذ — منصة اللوجستيك B2B' : 'Nawafez — B2B Logistics Marketplace',
    description: t('desc'),
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
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
