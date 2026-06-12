import type { Metadata } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'
const API  = process.env.NEXT_PUBLIC_API_URL ?? 'https://nwafiz.creativealphat.com'

// Convert the route from "dynamic, no-store" to ISR (5-minute cache —
// shorter than category pages because listing details change more often:
// price edits, status changes, new media). Without this Vercel emits
// cache-control: no-store which tanks Google indexing.
export const revalidate = 300

type Props = {
  children: React.ReactNode
  params:   Promise<{ locale: string; id: string }>
}

interface BackendListing {
  id:                     number
  section:                string
  listing_type:           string
  title_ar:               string | null
  title_en:               string | null
  description_ar:         string | null
  description_en:         string | null
  city:                   string | null
  region:                 string | null
  price:                  number | null
  currency:               string
  status:                 string
  media?:                 Array<{ path: string; type: string; is_primary?: boolean }>
  created_at?:            string
  updated_at?:            string
  expires_at?:            string
  user?: {
    id:       number
    name_ar?: string
    name_en?: string
    role?:    string
  }
}

async function fetchListing(id: string): Promise<BackendListing | null> {
  try {
    const res = await fetch(`${API}/api/listings/${id}`, {
      next: { revalidate: 300 }, // refresh every 5 minutes
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

function truncate(text: string | null | undefined, max = 160): string {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean
}

function buildImageUrl(path?: string): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  if (path.startsWith('uploads/')) return `${API}/${path}`
  return `${API}/storage/${path}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const listing = await fetchListing(id)

  if (!listing) {
    return {
      title: locale === 'ar' ? 'إعلان غير موجود — نوافذ' : 'Listing not found — Nwafiz',
      robots: { index: false, follow: false },
    }
  }

  const isAr   = locale === 'ar'
  const title  = (isAr ? listing.title_ar : listing.title_en) || listing.title_ar || listing.title_en || ''
  const desc   = truncate(isAr ? listing.description_ar : listing.description_en) ||
                 truncate(listing.description_ar) ||
                 truncate(listing.description_en) ||
                 (isAr ? 'تصفح فرص اللوجستيك في السعودية على منصة نوافذ' : 'Browse logistics opportunities in Saudi Arabia on Nwafiz')

  // Branded OG card — generated dynamically at /api/og/listing/{id}.
  // Shows title, city, price, and primary photo. Much higher CTR than a
  // raw photo when shared on WhatsApp / X / LinkedIn / Telegram.
  const imageUrl = `${BASE}/api/og/listing/${listing.id}`

  const canonical = `${BASE}/${locale}/listings/${listing.id}`
  const altAr = `${BASE}/ar/listings/${listing.id}`
  const altEn = `${BASE}/en/listings/${listing.id}`

  // Don't index rejected/draft/expired listings
  const noIndex = ['rejected', 'draft', 'expired'].includes(listing.status)

  return {
    title,
    description: desc,
    alternates: {
      canonical,
      languages: { ar: altAr, en: altEn },
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true,  follow: true },
    openGraph: {
      type: 'website',
      siteName: 'نوافذ',
      locale: isAr ? 'ar_SA' : 'en_US',
      url:    canonical,
      title,
      description: desc,
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [imageUrl],
    },
  }
}

export default async function ListingDetailLayout({ children, params }: Props) {
  const { locale, id } = await params
  const listing = await fetchListing(id)

  if (!listing || ['rejected', 'draft'].includes(listing.status)) {
    return <>{children}</>
  }

  const isAr  = locale === 'ar'
  const title = (isAr ? listing.title_ar : listing.title_en) || listing.title_ar || listing.title_en
  const desc  = truncate(isAr ? listing.description_ar : listing.description_en, 500)
  const url   = `${BASE}/${locale}/listings/${listing.id}`
  const primaryImage = listing.media?.find(m => m.type === 'image' && m.is_primary)
                    ?? listing.media?.find(m => m.type === 'image')
  const imageUrl = buildImageUrl(primaryImage?.path) ?? `${BASE}/logo.png`
  const sellerName = listing.user
    ? (isAr ? listing.user.name_ar : listing.user.name_en)
    : 'Nwafiz'

  // Decide schema type based on section
  let mainSchema: Record<string, unknown>

  if (listing.section === 'jobs') {
    // JobPosting schema
    mainSchema = {
      '@context':   'https://schema.org',
      '@type':      'JobPosting',
      title,
      description: desc,
      datePosted:  listing.created_at,
      validThrough: listing.expires_at,
      employmentType: 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name:    sellerName,
      },
      jobLocation: listing.city ? {
        '@type': 'Place',
        address: {
          '@type':          'PostalAddress',
          addressLocality:  listing.city,
          addressRegion:    listing.region ?? listing.city,
          addressCountry:   'SA',
        },
      } : undefined,
      baseSalary: listing.price ? {
        '@type':    'MonetaryAmount',
        currency:   listing.currency || 'SAR',
        value: {
          '@type': 'QuantitativeValue',
          value:    listing.price,
          unitText: 'MONTH',
        },
      } : undefined,
    }
  } else if (listing.section === 'forum') {
    // DiscussionForumPosting
    mainSchema = {
      '@context':  'https://schema.org',
      '@type':     'DiscussionForumPosting',
      headline:    title,
      description: desc,
      datePublished: listing.created_at,
      author: { '@type': 'Person', name: sellerName },
      image:  imageUrl,
    }
  } else {
    // Product (fleet, contracts, ma)
    mainSchema = {
      '@context':  'https://schema.org',
      '@type':     'Product',
      name:        title,
      description: desc,
      image:       [imageUrl],
      sku:         `nawafez-${listing.id}`,
      brand:       { '@type': 'Brand', name: 'نوافذ' },
      ...(listing.price ? {
        offers: {
          '@type':         'Offer',
          url,
          priceCurrency:   listing.currency || 'SAR',
          price:           listing.price,
          availability:    listing.status === 'active'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: {
            '@type': listing.user?.role === 'business' ? 'Organization' : 'Person',
            name:    sellerName,
          },
        },
      } : {}),
    }
  }

  // BreadcrumbList for all sections
  const sectionLabels: Record<string, { ar: string; en: string }> = {
    ma:        { ar: 'الاستحواذ والدمج',  en: 'M&A' },
    fleet:     { ar: 'الأسطول',            en: 'Fleet' },
    contracts: { ar: 'العقود',              en: 'Contracts' },
    jobs:      { ar: 'الوظائف',            en: 'Jobs' },
    forum:     { ar: 'المنتدى',            en: 'Forum' },
  }
  const sectionLabel = sectionLabels[listing.section]
  const sectionName  = sectionLabel ? (isAr ? sectionLabel.ar : sectionLabel.en) : listing.section

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home', item: `${BASE}/${locale}` },
      { '@type': 'ListItem', position: 2, name: isAr ? 'الإعلانات' : 'Listings', item: `${BASE}/${locale}/listings` },
      { '@type': 'ListItem', position: 3, name: sectionName, item: `${BASE}/${locale}/listings?section=${listing.section}` },
      { '@type': 'ListItem', position: 4, name: title, item: url },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mainSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  )
}
