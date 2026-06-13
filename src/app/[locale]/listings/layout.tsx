import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

// Convert the route from "dynamic, no-store" to ISR (1-hour cache).
// Without this Vercel emits cache-control: no-store which signals
// Googlebot the response is ephemeral and tanks indexing.
export const revalidate = 3600

type Props = {
  children: React.ReactNode
  params:   Promise<{ locale: string }>
}

const SECTION_META: Record<string, { ar: { title: string; desc: string }; en: { title: string; desc: string } }> = {
  ma: {
    ar: { title: 'الاستحواذ والدمج — نوافذ', desc: 'فرص شراء وبيع الشركات اللوجستية في السعودية، بيع المؤسسات والتنازل عن التراخيص.' },
    en: { title: 'M&A — Nwafiz',           desc: 'Buy and sell logistics companies in Saudi Arabia, business acquisitions and license transfers.' },
  },
  fleet: {
    ar: { title: 'حراج الأسطول والمركبات — نوافذ', desc: 'شاحنات، صهاريج، مبردات، باصات. بيع وإيجار وتنازل من الموثقين في السعودية.' },
    en: { title: 'Fleet Marketplace — Nwafiz',    desc: 'Trucks, tankers, refrigerated vans, buses. Sale, rental, and transfers from verified Saudi operators.' },
  },
  contracts: {
    ar: { title: 'مركز العقود والتشغيل — نوافذ', desc: 'عقود التوصيل والنقل الثقيل والتأجير في السعودية، بنظام عروض الأسعار المغلقة.' },
    en: { title: 'Operations Hub — Nwafiz',      desc: 'Delivery, heavy transport, and rental contracts in Saudi Arabia with blind bidding.' },
  },
  jobs: {
    ar: { title: 'وظائف اللوجستيك — نوافذ', desc: 'وظائف القيادة والتشغيل والإدارة في قطاع اللوجستيك السعودي.' },
    en: { title: 'Logistics Jobs — Nwafiz',  desc: 'Driving, operations, and management roles in Saudi logistics.' },
  },
  forum: {
    ar: { title: 'منتدى نوافذ — نقاش لوجستي', desc: 'نقاشات قانونية ومالية وتشغيلية لمحترفي اللوجستيك في السعودية.' },
    en: { title: 'Nwafiz Forum — Logistics Discussion', desc: 'Legal, financial, and operational discussions for Saudi logistics professionals.' },
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'

  // Bare titles (no '— نوافذ' suffix) — the root layout's title.template
  // appends ' | نوافذ' automatically. Adding it here too produced
  // 'الإعلانات — نوافذ | نوافذ' which Bing flagged as a duplicate-title
  // issue and looks unprofessional in SERPs.
  return {
    title:       isAr ? 'إعلانات اللوجستيك في السعودية' : 'Saudi Arabia Logistics Listings',
    description: isAr
      ? 'تصفّح أحدث إعلانات بيع وإيجار الشاحنات والمعدات، عقود النقل ومناقصات التشغيل، صفقات الاستحواذ، الوظائف اللوجستية، ومنتدى المختصين في السعودية — كل ذلك في منصة B2B واحدة موثّقة.'
      : 'Browse the latest truck and equipment sales/rentals, transport contracts and operations tenders, M&A deals, logistics jobs, and a professional forum across Saudi Arabia — all in one verified B2B marketplace.',
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
      title:       isAr ? 'إعلانات اللوجستيك في السعودية | نوافذ' : 'Saudi Arabia Logistics Listings | Nwafiz',
      description: isAr
        ? 'تصفّح فرص اللوجستيك B2B في السعودية'
        : 'Browse B2B logistics opportunities in Saudi Arabia',
      images: [{ url: '/logo.png', alt: 'نوافذ' }],
    },
  }
}

export default async function ListingsLayout({ children, params }: Props) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

  // BreadcrumbList — helps Google show breadcrumbs in search results
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home',         item: `${BASE}/${locale}` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'الإعلانات' : 'Listings',    item: `${BASE}/${locale}/listings` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  )
}
