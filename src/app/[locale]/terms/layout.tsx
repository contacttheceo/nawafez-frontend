import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title:       isAr ? 'شروط الاستخدام — نوافذ' : 'Terms of Service — Nawafez',
    description: isAr
      ? 'شروط استخدام منصة نوافذ، التزامات المستخدمين، وسياسة الإلغاء.'
      : 'Nawafez terms of service, user obligations, and cancellation policy.',
    alternates: {
      canonical: `${BASE}/${locale}/terms`,
      languages: { ar: `${BASE}/ar/terms`, en: `${BASE}/en/terms` },
    },
  }
}

export default function TermsLayout({ children }: Props) {
  return <>{children}</>
}
