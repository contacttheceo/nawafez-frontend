import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title:       isAr ? 'أدوات الذكاء الاصطناعي — نوافذ' : 'AI Tools — Nawafez',
    description: isAr
      ? 'محلل العقود، كاتب الإعلانات، مستشار التسعير. أدوات ذكية للوجستيك السعودي.'
      : 'Contract analyzer, listing writer, pricing advisor. Smart tools for Saudi logistics.',
    alternates: {
      canonical: `${BASE}/${locale}/tools`,
      languages: { ar: `${BASE}/ar/tools`, en: `${BASE}/en/tools` },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/tools`,
      title:       isAr ? 'أدوات الذكاء الاصطناعي — نوافذ' : 'AI Tools — Nawafez',
      description: isAr
        ? 'محلل العقود، كاتب الإعلانات، مستشار التسعير.'
        : 'Contract analyzer, listing writer, pricing advisor.',
      images: [{ url: '/logo.png', alt: 'نوافذ' }],
    },
  }
}

export default function ToolsLayout({ children }: Props) {
  return <>{children}</>
}
