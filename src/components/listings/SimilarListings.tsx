'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { listingsApi } from '@/lib/api'
import { ListingCard } from '@/components/ui/ListingCard'
import type { Listing } from '@/types'

/**
 * Shows up to 6 listings from the same section (prefers same city).
 * Drives internal linking → better SEO + keeps users on-site longer.
 *
 * Rendered below the description on /listings/[id]. Self-contained:
 * just pass the current listing id and section.
 */
export default function SimilarListings({ currentId }: { currentId: number }) {
  const locale = useLocale()
  const isRTL  = locale === 'ar'

  const [items, setItems] = useState<Listing[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listingsApi.getSimilar(currentId)
      .then((res) => setItems((res?.data ?? []) as Listing[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [currentId])

  if (loading) {
    return (
      <div className="mt-12 flex justify-center py-10">
        <Loader2 className="animate-spin text-navy" size={24} />
      </div>
    )
  }

  if (!items || items.length === 0) return null

  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-xl sm:text-2xl font-black text-navy">
          {isRTL ? '🔗 إعلانات مشابهة' : '🔗 Similar Listings'}
        </h2>
        <p className="text-xs text-gray-500">
          {isRTL ? `${items.length} نتيجة` : `${items.length} results`}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} mode="grid" />
        ))}
      </div>
    </section>
  )
}
