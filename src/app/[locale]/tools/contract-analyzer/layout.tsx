import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

// Sibling `page.tsx` is `use client` so metadata must live in a layout.
// Without this file the page inherited the generic tools/layout title
// which showed up as duplicate-title (Bing flagged this as a moderate
// SEO issue).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr
    ? 'محلل العقود الذكي — تحليل عقود النقل والخدمات اللوجستية'
    : 'AI Contract Analyzer — Review Transport and Logistics Contracts'
  const description = isAr
    ? 'أداة ذكية تحلّل عقود النقل والخدمات اللوجستية في السعودية وتكشف البنود المخفية والمخاطر التعاقدية خلال ثوان.'
    : 'AI-powered tool that reviews Saudi transport and logistics contracts in seconds, surfacing hidden clauses and legal risks.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/tools/contract-analyzer`,
      languages: {
        ar: `${BASE}/ar/tools/contract-analyzer`,
        en: `${BASE}/en/tools/contract-analyzer`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/tools/contract-analyzer`,
      title,
      description,
    },
  }
}

export const revalidate = 86400

export default function ContractAnalyzerLayout({ children }: Props) {
  return <>{children}</>
}
