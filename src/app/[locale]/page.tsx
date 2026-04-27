import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HeroSection from '@/components/home/HeroSection'
import SectionsGrid from '@/components/home/SectionsGrid'
import FeaturedListings from '@/components/home/FeaturedListings'
import HowItWorks from '@/components/home/HowItWorks'

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
        <SectionsGrid />
        <FeaturedListings />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
