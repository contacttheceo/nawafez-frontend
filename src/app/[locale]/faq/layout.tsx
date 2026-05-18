import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title:       isAr ? 'الأسئلة الشائعة — نوافذ' : 'FAQ — Nawafez',
    description: isAr
      ? 'إجابات عن أسئلة استخدام منصة نوافذ: التسجيل، نشر الإعلانات، التحقق، المدفوعات.'
      : 'Common questions about using Nawafez: signing up, posting listings, verification, payments.',
    alternates: {
      canonical: `${BASE}/${locale}/faq`,
      languages: { ar: `${BASE}/ar/faq`, en: `${BASE}/en/faq` },
    },
  }
}

export default function FaqLayout({ children }: Props) {
  return <>{children}</>
}
