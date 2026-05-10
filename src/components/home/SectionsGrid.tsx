'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { statsApi } from '@/lib/api'

const SECTIONS = [
  { key: 'ma',        emoji: '🏢', href: 'listings?section=ma',        iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600'   },
  { key: 'fleet',     emoji: '🚛', href: 'listings?section=fleet',     iconBg: 'bg-gradient-to-br from-emerald to-teal-500'       },
  { key: 'contracts', emoji: '📄', href: 'listings?section=contracts', iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500'   },
  { key: 'jobs',      emoji: '👷', href: 'listings?section=jobs',      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500'    },
  { key: 'forum',     emoji: '💬', href: 'listings?section=forum',     iconBg: 'bg-gradient-to-br from-red-400 to-rose-500'       },
]

export default function SectionsGrid() {
  const t      = useTranslations('sections')
  const locale = useLocale()
  const isRTL  = locale === 'ar'

  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    statsApi.get()
      .then((data) => setCounts(data.sections ?? {}))
      .catch(() => {})
  }, [])

  const fmtCount = (n: number) =>
    n.toLocaleString(isRTL ? 'ar-SA' : 'en-US')

  const listingWord = isRTL ? 'إعلان' : 'listings'

  return (
    <section className="py-14 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="section-heading">{t('title')}</h2>
        <p className="section-sub mb-8">{t('sub')}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SECTIONS.map((sec) => (
            <Link key={sec.key} href={`/${locale}/${sec.href}`}>
              <div className="card p-6 transition-all duration-300 cursor-pointer group
                              hover:shadow-xl hover:-translate-y-1 hover:border-emerald/30">
                {/* Gradient icon */}
                <div className={`w-12 h-12 ${sec.iconBg} rounded-2xl flex items-center
                                 justify-center text-2xl mb-4 shadow-sm`}>
                  {sec.emoji}
                </div>

                <h3 className="font-bold text-navy text-base mb-1.5">
                  {t(`${sec.key}_title` as Parameters<typeof t>[0])}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {t(`${sec.key}_desc` as Parameters<typeof t>[0])}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-emerald text-sm font-bold">
                    {counts[sec.key] !== undefined
                      ? `${fmtCount(counts[sec.key])} ${listingWord}`
                      : <span className="inline-block w-10 h-3 bg-gray-200 rounded animate-pulse" />
                    }
                  </span>
                  <ChevronLeft
                    size={18}
                    className={`text-gray-300 group-hover:text-emerald transition-colors
                                ${!isRTL ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
