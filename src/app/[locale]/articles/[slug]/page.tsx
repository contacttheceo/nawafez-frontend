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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const a = getArticle(slug)
  if (!a) return { title: 'Not Found' }

  const isAr = locale === 'ar'
  const title = isAr ? a.title_ar : a.title_en
  const desc  = isAr ? a.description_ar : a.description_en

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
      images:        [{ url: '/logo.png', alt: title }],
    },
    twitter: {
      card:  'summary_large_image',
      title,
      description: desc,
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

  // Schema.org Article — helps Google show it as a rich result
  const schema = {
    '@context':       'https://schema.org',
    '@type':          'Article',
    headline:         isAr ? a.title_ar : a.title_en,
    description:      isAr ? a.description_ar : a.description_en,
    inLanguage:       isAr ? 'ar' : 'en',
    datePublished:    a.updated_at,
    dateModified:     a.updated_at,
    author:           { '@type': 'Organization', name: 'Nwafiz' },
    publisher: {
      '@type': 'Organization',
      name:    'Nwafiz',
      logo: {
        '@type': 'ImageObject',
        url:     `${BASE}/logo.png`,
      },
    },
    mainEntityOfPage: `${BASE}/${locale}/articles/${a.slug}`,
    image:            [`${BASE}/logo.png`],
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

  // Related articles — same primary section
  const related = ARTICLES
    .filter(other => other.slug !== a.slug && other.primary_section === a.primary_section)
    .slice(0, 3)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

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
              <span>📅 {a.updated_at}</span>
              <span>📖 {a.reading_minutes} {isAr ? 'دقائق قراءة' : 'min read'}</span>
            </div>
          </header>

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
