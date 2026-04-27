'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

const sections = [
  { key: 'ma',        emoji: '🏢', href: 'ma',        count: '148', iconBg: 'bg-indigo-50' },
  { key: 'fleet',     emoji: '🚛', href: 'fleet',     count: '412', iconBg: 'bg-emerald-bg' },
  { key: 'contracts', emoji: '📄', href: 'contracts', count: '87',  iconBg: 'bg-amber-50' },
  { key: 'jobs',      emoji: '👷', href: 'jobs',      count: '63',  iconBg: 'bg-purple-50' },
  { key: 'forum',     emoji: '💬', href: 'forum',     count: '234', iconBg: 'bg-red-50' },
  { key: 'tools',     emoji: '🧮', href: 'tools',     count: '5',   iconBg: 'bg-sky-50' },
]

export default function SectionsGrid() {
  const t = useTranslations('sections')
  const locale = useLocale()

  return (
    <section className="py-14 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="section-heading">{t('title')}</h2>
        <p className="section-sub mb-8">{t('sub')}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {sections.map((sec) => (
            <Link key={sec.key} href={`/${locale}/${sec.href}`}>
              <div className="card p-5 hover:border-emerald hover:shadow-card-lg
                              transition-all duration-200 cursor-pointer group
                              border-s-4 border-s-transparent hover:border-s-emerald">
                <div className={`w-12 h-12 ${sec.iconBg} rounded-2xl flex items-center
                                 justify-center text-2xl mb-3`}>
                  {sec.emoji}
                </div>
                <h3 className="font-bold text-navy text-sm mb-1">
                  {t(`${sec.key}_title` as Parameters<typeof t>[0])}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                  {t(`${sec.key}_desc` as Parameters<typeof t>[0])}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-emerald text-xs font-semibold">
                    {sec.count} إعلان
                  </span>
                  <span className="text-gray-300 group-hover:text-emerald
                                   transition-colors text-lg leading-none">←</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
