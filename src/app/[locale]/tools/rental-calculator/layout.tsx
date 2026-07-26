import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

// Sibling `page.tsx` is `use client` — metadata lives here so the page
// no longer inherits the generic tools/layout title.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr
    ? 'حاسبة تكلفة إيجار الشاحنات في السعودية 2026'
    : 'Truck Rental Cost Calculator — Saudi Arabia 2026'
  const description = isAr
    ? 'قدّر تكلفة إيجار الشاحنة في السعودية حسب الفئة، المنطقة، والمدة. أسعار السوق الفعلية من نوافذ 2026.'
    : 'Estimate truck rental cost in Saudi Arabia by category, region, and duration. Real 2026 market prices from Nwafiz.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/tools/rental-calculator`,
      languages: {
        ar: `${BASE}/ar/tools/rental-calculator`,
        en: `${BASE}/en/tools/rental-calculator`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/tools/rental-calculator`,
      title,
      description,
    },
  }
}

export const revalidate = 86400

export default function RentalCalculatorLayout({ children }: Props) {
  return <>{children}</>
}
