'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { listingsApi } from '@/lib/api'
import { ListingCard } from '@/components/ui/ListingCard'
import type { Listing } from '@/types'

export default function FeaturedListings() {
  const t      = useTranslations('listings')
  const locale = useLocale()

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    listingsApi.getFeatured()
      .then((res: { data: Listing[] }) => setListings(res.data ?? []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [])

  // Don't render section if no featured listings
  if (!loading && listings.length === 0) return null

  return (
    <section className="py-14 px-6 bg-white">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-heading">{t('featured_title')}</h2>
            <p className="section-sub">{t('featured_sub')}</p>
          </div>
          <Link href={`/${locale}/listings`} className="btn-primary text-sm">
            {t('view_all')}
          </Link>
        </div>

        {loading ? (
          /* Skeleton */
          <>
            {/* Mobile skeleton */}
            <div className="flex md:hidden gap-4 overflow-x-auto pb-2 -mx-6 px-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card overflow-hidden animate-pulse flex-shrink-0 w-[300px]">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop skeleton */}
            <div className="hidden md:grid grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Mobile: horizontal snap scroll */}
            <div className="flex md:hidden gap-4 overflow-x-auto snap-x snap-mandatory
                            pb-3 -mx-6 px-6 scrollbar-hide">
              {listings.map((listing) => (
                <div key={listing.id} className="snap-start flex-shrink-0 w-[300px]">
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
            {/* Desktop: 3-column grid */}
            <div className="hidden md:grid grid-cols-3 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}

      </div>
    </section>
  )
}
