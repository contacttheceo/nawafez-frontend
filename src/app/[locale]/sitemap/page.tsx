import { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'
  return {
    title:       isAr ? 'خريطة الموقع — نوافذ' : 'Site Map — Nwafiz',
    description: isAr
      ? 'جميع صفحات وأقسام منصة نوافذ للوجستيك B2B السعودي في مكان واحد. تصفّح الأقسام، المدن، والخدمات.'
      : 'Every section and page on Nwafiz, the B2B logistics platform for Saudi Arabia. Browse categories, cities, and services.',
    alternates: {
      canonical: `${BASE}/${locale}/sitemap`,
      languages: {
        ar:           `${BASE}/ar/sitemap`,
        en:           `${BASE}/en/sitemap`,
        'x-default':  `${BASE}/ar/sitemap`,
      },
    },
  }
}

const CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر',
  'الطائف', 'تبوك', 'بريدة', 'الأحساء', 'حائل', 'الجبيل', 'ينبع',
  'أبها', 'خميس مشيط', 'نجران', 'جازان',
]
const CITIES_EN = [
  'Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar',
  'Taif', 'Tabuk', 'Buraidah', 'Al Ahsa', 'Hail', 'Jubail', 'Yanbu',
  'Abha', 'Khamis Mushait', 'Najran', 'Jazan',
]

export default async function SitemapPage({ params }: Props) {
  const { locale } = await params
  const isRTL = locale === 'ar'

  const t = (ar: string, en: string) => (isRTL ? ar : en)

  // Section + sub-section deep links — same structure as backend filters
  const sectionsArOnly = [
    {
      title: 'أساطيل لوجستية',
      titleEn: 'Logistics Fleet',
      links: [
        { ar: 'كل الأساطيل',       en: 'All Fleet',              href: '?section=fleet' },
        { ar: 'أساطيل للبيع',      en: 'Fleet for sale',         href: '?section=fleet&type=sale' },
        { ar: 'أساطيل للتأجير',    en: 'Fleet for rent',         href: '?section=fleet&type=rent' },
        { ar: 'مطلوب أساطيل',      en: 'Wanted: fleet',          href: '?section=fleet&type=wanted' },
      ],
    },
    {
      title: 'عقود تشغيلية',
      titleEn: 'Operational Contracts',
      links: [
        { ar: 'كل العقود',           en: 'All contracts',            href: '?section=contracts' },
        { ar: 'عروض عقود',           en: 'Contract offers',          href: '?section=contracts&type=offer' },
        { ar: 'مطلوب عقد تشغيلي',    en: 'Wanted: contract',         href: '?section=contracts&type=wanted' },
      ],
    },
    {
      title: 'بيع كيانات (M&A)',
      titleEn: 'Business Acquisitions (M&A)',
      links: [
        { ar: 'كل الكيانات',           en: 'All businesses',         href: '?section=ma' },
        { ar: 'شركات لوجستية للبيع',   en: 'Logistics for sale',     href: '?section=ma&type=acquisition' },
      ],
    },
    {
      title: 'وظائف لوجستية',
      titleEn: 'Logistics Jobs',
      links: [
        { ar: 'كل الوظائف',          en: 'All jobs',              href: '?section=jobs' },
        { ar: 'وظائف مطلوبة',        en: 'Jobs offered',          href: '?section=jobs&type=job' },
        { ar: 'باحثون عن عمل',       en: 'Job seekers',           href: '?section=jobs&type=job_seeker' },
      ],
    },
    {
      title: 'منتدى الاستشارات',
      titleEn: 'Consultation Forum',
      links: [
        { ar: 'كل النقاشات',           en: 'All discussions',     href: '?section=forum' },
        { ar: 'استشارات قانونية',      en: 'Legal',               href: '?section=forum&forum_category=legal' },
        { ar: 'استشارات مالية',        en: 'Financial',           href: '?section=forum&forum_category=financial' },
        { ar: 'استشارات تشغيلية',      en: 'Operational',         href: '?section=forum&forum_category=operational' },
        { ar: 'لوجستيات',              en: 'Logistics',           href: '?section=forum&forum_category=logistics' },
      ],
    },
  ]

  const mainPages = [
    { ar: 'الرئيسية',          en: 'Home',                 href: '' },
    { ar: 'تصفّح الإعلانات',   en: 'Browse Listings',      href: 'listings' },
    { ar: 'الباقات والأسعار',  en: 'Plans & Pricing',      href: 'pricing' },
    { ar: 'الأدوات الذكية',    en: 'AI Tools',             href: 'tools' },
    { ar: 'تحليل العقود AI',   en: 'AI Contract Analyzer', href: 'tools/contract-analyzer' },
    { ar: 'الأسئلة الشائعة',   en: 'FAQ',                  href: 'faq' },
    { ar: 'سياسة الخصوصية',    en: 'Privacy Policy',       href: 'privacy' },
    { ar: 'الشروط والأحكام',   en: 'Terms & Conditions',   href: 'terms' },
  ]

  const accountPages = [
    { ar: 'تسجيل دخول',     en: 'Sign In',     href: 'auth/login' },
    { ar: 'تسجيل حساب',     en: 'Register',    href: 'auth/register' },
    { ar: 'نسيت كلمة السر', en: 'Forgot Pwd',  href: 'auth/forgot-password' },
    { ar: 'لوحة التحكم',    en: 'Dashboard',   href: 'dashboard' },
    { ar: 'الملف الشخصي',   en: 'Profile',     href: 'profile' },
    { ar: 'المفضّلة',       en: 'Bookmarks',   href: 'bookmarks' },
    { ar: 'الرسائل',         en: 'Messages',   href: 'messages' },
    { ar: 'نشر إعلان',       en: 'Post Listing', href: 'listings/create' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <h1 className="text-3xl sm:text-4xl font-black text-navy mb-3">
          {t('خريطة الموقع', 'Site Map')}
        </h1>
        <p className="text-gray-600 mb-10 max-w-2xl">
          {t(
            'كل ما على منصة نوافذ — مرتّب بأقسام، أنواع، ومدن. اضغط أي قسم للوصول لإعلاناته مباشرة.',
            'Everything on Nwafiz — organized by section, type, and city. Click any link to jump directly to the listings.'
          )}
        </p>

        {/* Main pages */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-navy mb-4">
            🏠 {t('الصفحات الرئيسية', 'Main Pages')}
          </h2>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {mainPages.map((p) => (
                <Link
                  key={p.href}
                  href={`/${locale}/${p.href}`}
                  className="text-sm text-gray-700 hover:text-emerald-dark hover:underline transition-colors py-1"
                >
                  → {isRTL ? p.ar : p.en}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Sections + sub-sections */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-navy mb-4">
            📂 {t('الأقسام والتصنيفات', 'Sections & Categories')}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectionsArOnly.map((sec) => (
              <div key={sec.title} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-emerald-dark mb-3 text-sm">
                  {isRTL ? sec.title : sec.titleEn}
                </h3>
                <div className="flex flex-col gap-1.5">
                  {sec.links.map((link) => (
                    <Link
                      key={link.href}
                      href={`/${locale}/listings${link.href}`}
                      className="text-xs text-gray-600 hover:text-navy hover:underline transition-colors"
                    >
                      → {isRTL ? link.ar : link.en}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cities */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-navy mb-4">
            📍 {t('تصفّح حسب المدينة', 'Browse by City')}
          </h2>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {CITIES.map((cityAr, i) => (
                <Link
                  key={cityAr}
                  href={`/${locale}/listings?city=${encodeURIComponent(cityAr)}`}
                  className="text-sm text-gray-700 hover:text-emerald-dark hover:underline transition-colors py-1"
                >
                  → {t(`لوجستيات ${cityAr}`, `Logistics ${CITIES_EN[i]}`)}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Account */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-navy mb-4">
            👤 {t('الحساب', 'Account')}
          </h2>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {accountPages.map((p) => (
                <Link
                  key={p.href}
                  href={`/${locale}/${p.href}`}
                  className="text-sm text-gray-700 hover:text-emerald-dark hover:underline transition-colors py-1"
                >
                  → {isRTL ? p.ar : p.en}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer note */}
        <p className="text-xs text-gray-500 mt-8 text-center leading-relaxed">
          {t(
            'تبحث عن صفحة محدّدة؟ ',
            'Looking for a specific page? '
          )}
          <a href="mailto:info@nwafizlogi.com" className="text-emerald-dark hover:underline font-semibold">
            info@nwafizlogi.com
          </a>
        </p>
      </main>

      <Footer />
    </div>
  )
}
