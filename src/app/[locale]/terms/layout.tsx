import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title:       isAr
      ? 'شروط الاستخدام والاتفاقيات — منصة نوافذ B2B'
      : 'Terms of Service and Agreements — Nwafiz B2B Platform',
    description: isAr
      ? 'الشروط الكاملة لاستخدام منصة نوافذ للوجستيك B2B في السعودية — التزامات المُعلنين، حقوق المشترين، سياسة الإلغاء والاسترداد، حل النزاعات، والاختصاص القضائي.'
      : 'Full terms for using Nwafiz B2B logistics platform in Saudi Arabia — advertiser obligations, buyer rights, cancellation and refund policy, dispute resolution, and jurisdiction.',
    alternates: {
      canonical: `${BASE}/${locale}/terms`,
      languages: { ar: `${BASE}/ar/terms`, en: `${BASE}/en/terms` },
    },
  }
}

export default function TermsLayout({ children }: Props) {
  return <>{children}</>
}
