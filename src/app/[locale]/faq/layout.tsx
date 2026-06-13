import type { Metadata } from 'next'
import { faqs } from '@/data/faq'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title:       isAr ? 'الأسئلة الشائعة' : 'FAQ',
    description: isAr
      ? 'إجابات عن أسئلة استخدام منصة نوافذ: التسجيل، نشر الإعلانات، التحقق، المدفوعات.'
      : 'Common questions about using Nwafiz: signing up, posting listings, verification, payments.',
    alternates: {
      canonical: `${BASE}/${locale}/faq`,
      languages: { ar: `${BASE}/ar/faq`, en: `${BASE}/en/faq` },
    },
  }
}

export default async function FaqLayout({ children, params }: Props) {
  const { locale } = await params
  const items = (locale === 'ar' ? faqs.ar : faqs.en)

  // FAQPage Schema.org — qualifies for Google's expandable FAQ rich results
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: items.map(item => ({
      '@type':    'Question',
      name:        item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    item.a,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  )
}
