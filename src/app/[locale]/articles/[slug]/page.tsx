import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ARTICLES, getArticle } from '@/content/articles'
import { ARTICLE_BODIES } from '@/content/articles/bodies'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Props = { params: Promise<{ locale: string; slug: string }> }

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

export const revalidate = 86400 // refresh once a day (articles change rarely)

// Section label used as the OG subtitle so each shared article card
// carries its real category instead of the generic "منصة B2B".
const SECTION_LABEL_AR: Record<string, string> = {
  fleet:     'الأسطول اللوجستي',
  contracts: 'العقود والمناقصات',
  jobs:      'الوظائف اللوجستية',
  ma:        'الاستحواذ والدمج',
  forum:     'المنتدى المهني',
}
const SECTION_LABEL_EN: Record<string, string> = {
  fleet:     'Fleet & Logistics',
  contracts: 'Contracts & Tenders',
  jobs:      'Logistics Jobs',
  ma:        'M&A',
  forum:     'Professional Forum',
}

function buildOgImageUrl(title: string, subtitle: string): string {
  const q = new URLSearchParams({ title, subtitle })
  return `${BASE}/api/og?${q.toString()}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const a = getArticle(slug)
  if (!a) return { title: 'Not Found' }

  const isAr = locale === 'ar'
  const title = isAr ? a.title_ar : a.title_en
  const desc  = isAr ? a.description_ar : a.description_en
  const subtitle = isAr
    ? (SECTION_LABEL_AR[a.primary_section] ?? 'منصة نوافذ')
    : (SECTION_LABEL_EN[a.primary_section] ?? 'Nwafiz')

  // Branded, article-specific OG card — much higher share CTR than the
  // generic logo.png we were serving. The /api/og edge route renders
  // a 1200x630 image with the title + section as subtitle.
  const ogImage = buildOgImageUrl(title, subtitle)

  return {
    title,
    description: desc,
    alternates: {
      canonical: `${BASE}/${locale}/articles/${a.slug}`,
      languages: {
        ar: `${BASE}/ar/articles/${a.slug}`,
        en: `${BASE}/en/articles/${a.slug}`,
      },
    },
    openGraph: {
      type: 'article',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    `${BASE}/${locale}/articles/${a.slug}`,
      title,
      description: desc,
      publishedTime: a.updated_at,
      modifiedTime:  a.updated_at,
      authors:       ['Nwafiz Editorial'],
      tags:          a.tags,
      images:        [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card:  'summary_large_image',
      title,
      description: desc,
      images: [ogImage],
    },
  }
}

export async function generateStaticParams() {
  return ARTICLES.flatMap(a => [
    { locale: 'ar', slug: a.slug },
    { locale: 'en', slug: a.slug },
  ])
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params
  const a = getArticle(slug)
  if (!a) notFound()

  const isAr = locale === 'ar'
  const body = ARTICLE_BODIES[slug] ?? '<p>المقال قيد التحضير.</p>'

  const articleTitle = isAr ? a.title_ar : a.title_en
  const articleSubtitle = isAr
    ? (SECTION_LABEL_AR[a.primary_section] ?? 'منصة نوافذ')
    : (SECTION_LABEL_EN[a.primary_section] ?? 'Nwafiz')
  const articleOgImage = buildOgImageUrl(articleTitle, articleSubtitle)

  // Schema.org Article — helps Google show it as a rich result. `image`
  // uses the same dynamic OG card as the social share so the SERP
  // thumbnail, the WhatsApp preview and the Twitter card all match.
  const schema = {
    '@context':       'https://schema.org',
    '@type':          'Article',
    headline:         articleTitle,
    description:      isAr ? a.description_ar : a.description_en,
    inLanguage:       isAr ? 'ar' : 'en',
    datePublished:    a.updated_at,
    dateModified:     a.updated_at,
    author:           { '@type': 'Organization', name: 'Nwafiz', url: BASE },
    publisher: {
      '@type': 'Organization',
      name:    'Nwafiz',
      logo: {
        '@type': 'ImageObject',
        url:     `${BASE}/logo.png`,
      },
    },
    mainEntityOfPage: `${BASE}/${locale}/articles/${a.slug}`,
    image:            [articleOgImage],
  }

  // Breadcrumbs
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home',         item: `${BASE}/${locale}` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'المقالات' : 'Articles',     item: `${BASE}/${locale}/articles` },
      { '@type': 'ListItem', position: 3, name: isAr ? a.title_ar : a.title_en,    item: `${BASE}/${locale}/articles/${a.slug}` },
    ],
  }

  // FAQPage schema — only emitted when the article has FAQ content.
  // Qualifies for Google's FAQ rich result (expandable Q/A boxes on
  // the SERP) and gives LLM crawlers extractable Q/A pairs.
  const faqSchema = a.faq && a.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: a.faq.map(item => ({
      '@type': 'Question',
      name:    isAr ? item.q_ar : item.q_en,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    isAr ? item.a_ar : item.a_en,
      },
    })),
  } : null

  // Related articles — same primary section
  const related = ARTICLES
    .filter(other => other.slug !== a.slug && other.primary_section === a.primary_section)
    .slice(0, 3)

  const tldr = isAr ? a.tldr_ar : a.tldr_en
  const updatedLabel = isAr ? 'آخر تحديث' : 'Last updated'

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <Navbar />
      <main className="min-h-screen bg-white py-10 px-4">
        <article className="max-w-3xl mx-auto">
          <nav className="text-xs text-gray-500 mb-6">
            <Link href={`/${locale}`}            className="hover:text-emerald">{isAr ? 'الرئيسية' : 'Home'}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${locale}/articles`}    className="hover:text-emerald">{isAr ? 'المقالات' : 'Articles'}</Link>
          </nav>

          <header className="mb-10 pb-8 border-b border-gray-200">
            <div className="text-5xl mb-4">{a.icon}</div>
            <h1 className="text-3xl sm:text-4xl font-black text-navy leading-tight mb-4">
              {isAr ? a.title_ar : a.title_en}
            </h1>
            <p className="text-gray-600 leading-relaxed mb-5">
              {isAr ? a.description_ar : a.description_en}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span>📅 {updatedLabel}: <time dateTime={a.updated_at}>{a.updated_at}</time></span>
              <span>📖 {a.reading_minutes} {isAr ? 'دقائق قراءة' : 'min read'}</span>
            </div>
          </header>

          {/* TL;DR — surfaces the article's core answer in one paragraph.
              AI engines (Perplexity, ChatGPT) prefer extractable openers;
              human readers scanning the SERP get the gist immediately. */}
          {tldr && (
            <aside
              className="mb-10 rounded-xl border-s-4 border-emerald bg-emerald/5
                         px-5 py-4"
              aria-label={isAr ? 'ملخص سريع' : 'Quick summary'}
            >
              <div className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">
                {isAr ? '💡 ملخص سريع' : '💡 TL;DR'}
              </div>
              <p className="text-navy font-medium leading-relaxed text-base">
                {tldr}
              </p>
            </aside>
          )}

          <div
            className="text-gray-700 leading-relaxed text-base sm:text-lg
                       [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-navy [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-emerald/30
                       [&_p]:my-4 [&_p]:leading-relaxed
                       [&_strong]:text-navy [&_strong]:font-bold
                       [&_ul]:my-4 [&_ul]:ps-6 [&_ul]:list-disc [&_ul]:space-y-1
                       [&_ol]:my-4 [&_ol]:ps-6 [&_ol]:list-decimal [&_ol]:space-y-1
                       [&_li]:leading-relaxed
                       [&_a]:text-emerald [&_a]:underline hover:[&_a]:text-emerald-700
                       [&_table]:my-6 [&_table]:w-full [&_table]:border [&_table]:border-gray-200 [&_table]:rounded-lg [&_table]:overflow-hidden
                       [&_th]:bg-navy [&_th]:text-white [&_th]:p-3 [&_th]:text-right [&_th]:font-bold
                       [&_td]:p-3 [&_td]:border-t [&_td]:border-gray-200
                       [&_.lead]:text-lg sm:[&_.lead]:text-xl [&_.lead]:text-gray-700 [&_.lead]:leading-relaxed [&_.lead]:mb-8 [&_.lead]:font-medium [&_.lead]:border-s-4 [&_.lead]:border-emerald [&_.lead]:ps-4"
            dangerouslySetInnerHTML={{ __html: body }}
          />

          {/* FAQ — rendered when the article declares `faq` items.
              Paired with the FAQPage JSON-LD above so Google can show
              expandable Q/A tiles in the SERP. LLM crawlers get a
              clearly-scoped Q/A block to extract. */}
          {a.faq && a.faq.length > 0 && (
            <section className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-black text-navy mb-2">
                {isAr ? '❓ أسئلة شائعة' : '❓ Frequently asked questions'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {isAr
                  ? 'الأسئلة الأكثر تكراراً حول هذا الموضوع'
                  : 'The questions most readers ask about this topic'}
              </p>
              <div className="space-y-3">
                {a.faq.map((item, i) => (
                  <details
                    key={i}
                    className="group rounded-xl border border-gray-200 bg-gray-50 open:bg-white
                               open:shadow-sm open:border-emerald/40 transition-colors"
                  >
                    <summary className="cursor-pointer list-none flex items-start justify-between
                                        gap-3 px-5 py-4 font-bold text-navy text-base">
                      <span className="flex-1 leading-snug">{isAr ? item.q_ar : item.q_en}</span>
                      <span className="text-emerald text-xl shrink-0 transition-transform
                                       group-open:rotate-45 leading-none">+</span>
                    </summary>
                    <div className="px-5 pb-4 text-gray-700 leading-relaxed">
                      {isAr ? item.a_ar : item.a_en}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-2">
            {a.tags.map(tag => (
              <span key={tag} className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          {/* CTA → matching section */}
          <div className="mt-10 bg-gradient-to-br from-emerald to-emerald-700 text-white rounded-2xl p-8 text-center">
            <h3 className="text-xl font-black mb-2">
              {isAr ? '🔥 شاهد إعلانات مرتبطة بهذا المقال' : '🔥 See related listings'}
            </h3>
            <p className="text-sm opacity-90 mb-5">
              {isAr ? 'تصفّح أحدث الفرص الآن على نوافذ' : 'Browse the latest opportunities on Nwafiz'}
            </p>
            <Link
              href={`/${locale}/listings?section=${a.primary_section}`}
              className="inline-block bg-white text-emerald font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition"
            >
              {isAr ? 'تصفح الإعلانات ←' : 'Browse Listings →'}
            </Link>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="text-xl font-black text-navy mb-4">
                {isAr ? 'مقالات ذات صلة' : 'Related Articles'}
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map(r => (
                  <Link
                    key={r.slug}
                    href={`/${locale}/articles/${r.slug}`}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-emerald hover:shadow transition"
                  >
                    <div className="text-3xl mb-2">{r.icon}</div>
                    <h4 className="font-bold text-sm text-navy leading-snug line-clamp-2">
                      {isAr ? r.title_ar : r.title_en}
                    </h4>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      <Footer />
    </>
  )
}
