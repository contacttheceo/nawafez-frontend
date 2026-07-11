import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

// Client page can't export metadata itself — this layout provides it so
// the calculator ranks for high-intent Arabic queries like
// "تكلفة تشغيل شاحنة" and "مصاريف شاحنة شهرياً".
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const title = isAr
    ? 'حاسبة تكلفة تشغيل شاحنة شهرياً 2026'
    : 'Truck Monthly Operating Cost Calculator 2026'
  const description = isAr
    ? 'احسب تكلفة تشغيل شاحنتك شهرياً في السعودية: الوقود، التأمين، الصيانة، الإطارات، الرسوم، الراتب، والتمويل. أرقام السوق الفعلية من 2026.'
    : 'Calculate your truck monthly operating cost in Saudi Arabia: fuel, insurance, maintenance, tires, fees, salary, and financing. Real 2026 market numbers.'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/tools/operating-cost`,
      languages: {
        ar: `${BASE}/ar/tools/operating-cost`,
        en: `${BASE}/en/tools/operating-cost`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/tools/operating-cost`,
      title,
      description,
      images: [{
        url: `${BASE}/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(isAr ? 'أرقام السوق السعودي 2026' : 'Saudi 2026 market data')}&stat=${encodeURIComponent(isAr ? '6 فئات' : '6 categories')}&statLabel=${encodeURIComponent(isAr ? 'شاحنات' : 'trucks')}`,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
  }
}

// Static-render; the calculator itself is client-side but the shell can prerender.
export const revalidate = 86400

export default function OperatingCostLayout({ children }: Props) {
  return <>{children}</>
}
