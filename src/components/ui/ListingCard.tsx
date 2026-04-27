'use client'

import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { MapPin, Clock, Eye } from 'lucide-react'
import type { Listing } from '@/types'
import { formatDistanceToNow } from '@/lib/utils'

interface Props {
  listing: Listing
}

export function ListingCard({ listing }: Props) {
  const locale = useLocale()
  const t = useTranslations('listings')
  const tb = useTranslations('badges')
  const isRTL = locale === 'ar'

  const title = isRTL ? (listing.title_ar ?? listing.title_en) : (listing.title_en ?? listing.title_ar)
  const sellerName = isRTL ? (listing.user?.name_ar ?? '') : (listing.user?.name_en ?? '')

  const sectionEmoji: Record<string, string> = {
    ma: '🏢', fleet: '🚛', contracts: '📄', jobs: '💼', forum: '💬',
  }

  const imgBg: Record<string, string> = {
    ma: 'from-green-100 to-green-200',
    fleet: 'from-blue-100 to-blue-200',
    contracts: 'from-amber-100 to-amber-200',
    jobs: 'from-purple-100 to-purple-200',
    forum: 'from-red-100 to-red-200',
  }

  return (
    <Link href={`/${locale}/listings/${listing.id}`}>
      <article className={`card hover:border-emerald hover:shadow-card-lg
                           transition-all duration-200 cursor-pointer overflow-hidden
                           ${listing.is_featured ? 'border-emerald' : ''}`}>

        {/* Image */}
        <div className={`h-44 bg-gradient-to-br ${imgBg[listing.section] || 'from-gray-100 to-gray-200'}
                         flex items-center justify-center text-5xl relative`}>
          {sectionEmoji[listing.section]}
          {listing.is_featured && (
            <span className="absolute top-3 start-3 bg-navy text-white text-[10px]
                             font-bold px-2 py-1 rounded-md">
              ⭐ {tb('featured')}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {listing.is_financing_eligible && (
              <span className="badge-navy text-[10px]">💰 {tb('financing')}</span>
            )}
            {listing.is_ready_to_operate && (
              <span className="badge-green text-[10px]">🟢 {tb('ready')}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
            {title}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {listing.city}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatDistanceToNow(listing.created_at ?? '', locale)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={11} /> {listing.views_count}
            </span>
          </div>

          {/* Price */}
          {listing.price && (
            <div className="text-xl font-black text-navy">
              {listing.price.toLocaleString('ar-SA')}{' '}
              <span className="text-xs font-normal text-gray-400">{t('sar')}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100
                        flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center
                            text-white text-[10px] font-bold flex-shrink-0">
              {sellerName.charAt(0) || '?'}
            </div>
            <span className="truncate max-w-[100px]">{sellerName}</span>
          </div>
          <div className="flex gap-1.5">
            {listing.user?.is_trusted_payer && (
              <span className="badge-gold text-[10px]">🎖️ {tb('trusted')}</span>
            )}
            {listing.user?.role === 'business' && (
              <span className="badge-emerald text-[10px]">✔ {tb('verified')}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

