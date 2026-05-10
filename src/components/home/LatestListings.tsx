'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { listingsApi } from '@/lib/api'
import { ListingCard } from '@/components/ui/ListingCard'
import type { Listing } from '@/types'

export default function LatestListings() {
  const locale            = useLocale()
  const isRTL             = locale === 'ar'
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    listingsApi.getAll({ sort: 'newest', limit: 8 } as any)
      .then((res: any) => setListings(res.data ?? []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-14 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="section-heading flex items-center gap-2">
              <Clock size={20} className="text-emerald" />
              {isRTL ? 'آخر الإعلانات' : 'Latest Listings'}
            </h2>
            <p className="section-sub">
              {isRTL
                ? 'أحدث الإعلانات المنشورة على المنصة'
                : 'Most recently posted listings on the platform'}
            </p>
          </div>
          <Link href={`/${locale}/listings`} className="btn-primary text-sm whitespace-nowrap">
            {isRTL ? 'عرض الكل' : 'View All'}
          </Link>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <>
            {/* Mobile skeleton */}
            <div className="flex md:hidden gap-4 overflow-x-auto pb-2 -mx-6 px-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card overflow-hidden animate-pulse flex-shrink-0 w-[280px]">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop skeleton */}
            <div className="hidden md:grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : listings.length === 0 ? (
          /* Empty state — platform just launched */
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-4xl mb-3">🚀</div>
            <p className="text-gray-400 text-sm">
              {isRTL
                ? 'كن أول من ينشر إعلاناً على المنصة'
                : 'Be the first to post a listing on the platform'}
            </p>
            <Link
              href={`/${locale}/listings/create`}
              className="inline-block mt-4 btn-primary text-sm"
            >
              {isRTL ? 'أنشئ إعلانك الآن' : 'Post Now'}
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile: snap carousel */}
            <div
              className="flex md:hidden gap-4 overflow-x-auto snap-x snap-mandatory
                         pb-3 -mx-6 px-6 scrollbar-hide"
            >
              {listings.map((l) => (
                <div key={l.id} className="snap-start flex-shrink-0 w-[280px]">
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>

            {/* Desktop: 4-column grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
