import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title:       isAr ? 'سياسة الخصوصية — نوافذ' : 'Privacy Policy — Nwafiz',
    description: isAr
      ? 'كيف تتعامل نوافذ مع بياناتك. التزام كامل بقانون حماية البيانات السعودي (PDPL).'
      : 'How Nwafiz handles your data. Full compliance with the Saudi PDPL.',
    alternates: {
      canonical: `${BASE}/${locale}/privacy`,
      languages: { ar: `${BASE}/ar/privacy`, en: `${BASE}/en/privacy` },
    },
  }
}

export default function PrivacyLayout({ children }: Props) {
  return <>{children}</>
}
