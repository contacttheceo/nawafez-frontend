import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

type Props = {
  children: React.ReactNode
  params:   Promise<{ locale: string }>
}

const SECTION_META: Record<string, { ar: { title: string; desc: string }; en: { title: string; desc: string } }> = {
  ma: {
    ar: { title: 'الاستحواذ والدمج — نوافذ', desc: 'فرص شراء وبيع الشركات اللوجستية في السعودية، بيع المؤسسات والتنازل عن التراخيص.' },
    en: { title: 'M&A — Nawafez',           desc: 'Buy and sell logistics companies in Saudi Arabia, business acquisitions and license transfers.' },
  },
  fleet: {
    ar: { title: 'حراج الأسطول والمركبات — نوافذ', desc: 'شاحنات، صهاريج، مبردات، باصات. بيع وإيجار وتنازل من الموثقين في السعودية.' },
    en: { title: 'Fleet Marketplace — Nawafez',    desc: 'Trucks, tankers, refrigerated vans, buses. Sale, rental, and transfers from verified Saudi operators.' },
  },
  contracts: {
    ar: { title: 'مركز العقود والتشغيل — نوافذ', desc: 'عقود التوصيل والنقل الثقيل والتأجير في السعودية، بنظام عروض الأسعار المغلقة.' },
    en: { title: 'Operations Hub — Nawafez',      desc: 'Delivery, heavy transport, and rental contracts in Saudi Arabia with blind bidding.' },
  },
  jobs: {
    ar: { title: 'وظائف اللوجستيك — نوافذ', desc: 'وظائف القيادة والتشغيل والإدارة في قطاع اللوجستيك السعودي.' },
    en: { title: 'Logistics Jobs — Nawafez',  desc: 'Driving, operations, and management roles in Saudi logistics.' },
  },
  forum: {
    ar: { title: 'منتدى نوافذ — نقاش لوجستي', desc: 'نقاشات قانونية ومالية وتشغيلية لمحترفي اللوجستيك في السعودية.' },
    en: { title: 'Nawafez Forum — Logistics Discussion', desc: 'Legal, financial, and operational discussions for Saudi logistics professionals.' },
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'

  return {
    title:       isAr ? 'الإعلانات — نوافذ' : 'Listings — Nawafez',
    description: isAr
      ? 'تصفّح آلاف فرص اللوجستيك B2B في السعودية: استحواذ، أسطول، عقود، وظائف، ومنتدى.'
      : 'Browse thousands of B2B logistics opportunities in Saudi Arabia: M&A, fleet, contracts, jobs, and forum.',
    alternates: {
      canonical: `${BASE}/${locale}/listings`,
      languages: {
        ar: `${BASE}/ar/listings`,
        en: `${BASE}/en/listings`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/listings`,
      title:       isAr ? 'الإعلانات — نوافذ' : 'Listings — Nawafez',
      description: isAr
        ? 'تصفّح فرص اللوجستيك B2B في السعودية'
        : 'Browse B2B logistics opportunities in Saudi Arabia',
      images: [{ url: '/logo.png', alt: 'نوافذ' }],
    },
  }
}

export default function ListingsLayout({ children }: Props) {
  return <>{children}</>
}
