import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

  return {
    title:       isAr
      ? 'باقات الاشتراك — أسعار خطط نوافذ للمعلنين والشركات'
      : 'Subscription Plans — Nwafiz Pricing for Sellers and Businesses',
    description: isAr
      ? 'اختر باقتك في منصة نوافذ — ابدأ مجاناً ثم ارتقِ لباقات Basic أو Professional أو Enterprise. أسعار شفافة، إعلانات أكثر، ميزات أوسع.'
      : 'Choose your plan on Nwafiz — start free, then upgrade to Basic, Professional, or Enterprise. Transparent pricing, more listings, more features.',
    alternates: {
      canonical: `${BASE}/${locale}/pricing`,
      languages: {
        ar:           `${BASE}/ar/pricing`,
        en:           `${BASE}/en/pricing`,
        'x-default':  `${BASE}/ar/pricing`,
      },
    },
    openGraph: {
      title:       isAr ? 'باقات نوافذ' : 'Nwafiz Plans',
      description: isAr ? 'أسعار شفافة، 4 باقات لكل احتياج' : 'Transparent pricing, 4 plans for every need',
      url:         `${BASE}/${locale}/pricing`,
    },
  }
}

export default async function PricingLayout({ children, params }: Props) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home',  item: `${BASE}/${locale}` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'الباقات' : 'Pricing', item: `${BASE}/${locale}/pricing` },
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
