'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, TrendingUp, Users, FileText, MessageCircle, ExternalLink, Megaphone, Mail, Share2, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import Navbar from '@/components/Navbar'

/**
 * Marketing operations cockpit.
 *
 * Pulls activity counts from /api/admin/analytics and surfaces:
 *  - Channel health (Vercel Analytics, Telegram, X)
 *  - Distribution checklist (which marketing materials are deployed)
 *  - Quick links to the asset library in scripts/marketing/
 *
 * Read-only for now — the actual broadcast triggers happen automatically
 * on listing approval (TelegramBroadcaster, XBroadcaster).
 */

interface AnalyticsResponse {
  users_daily?: Array<{ date: string; count: number }>
  listings_daily?: Array<{ date: string; count: number }>
  top_listings?: Array<{ id: number; title_ar: string | null; views_count: number }>
  section_stats?: Record<string, { active: number; pending: number; total_views: number }>
}

export default function MarketingDashboardPage() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      router.replace(`/${locale}`)
    }
  }, [isAuthenticated, user, locale, router])

  useEffect(() => {
    const API   = process.env.NEXT_PUBLIC_API_URL ?? 'https://nwafiz.creativealphat.com'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) { setLoading(false); return }

    fetch(`${API}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(json => setAnalytics(json))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false))
  }, [])

  if (!isAuthenticated || user?.role !== 'admin') return null

  // KPIs from last 7 days
  const sumLast7 = (arr?: Array<{ count: number }>) =>
    (arr ?? []).slice(-7).reduce((a, b) => a + (b.count ?? 0), 0)
  const usersLast7    = sumLast7(analytics?.users_daily)
  const listingsLast7 = sumLast7(analytics?.listings_daily)
  const totalViews    = Object.values(analytics?.section_stats ?? {}).reduce((a, s) => a + (s.total_views ?? 0), 0)

  // Channel checklist — what's deployed vs. pending
  const channels = [
    { name: 'Vercel Analytics',  status: 'live',    note: 'tracking page views automatically', link: 'https://vercel.com' },
    { name: 'Daily admin digest', status: 'live',   note: 'sent 08:00 to admins',              link: null },
    { name: 'Onboarding emails',  status: 'live',   note: 'day 2/5/9/14 after signup',         link: null },
    { name: 'Telegram channel',   status: 'pending', note: 'set TELEGRAM_BOT_TOKEN to enable', link: 'https://t.me/BotFather' },
    { name: 'X (Twitter) auto-tweet', status: 'pending', note: 'set X_API_KEY/SECRET to enable', link: 'https://developer.x.com' },
    { name: 'Push notifications',  status: 'live',   note: 'on listing approval, comments, bids', link: null },
    { name: 'SEO articles (5)',    status: 'live',   note: '/articles — indexed in sitemap',     link: `/${locale}/articles` },
    { name: 'OG image generator',  status: 'live',   note: 'branded card on link previews',      link: `/api/og/listing/1` },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald rounded-xl flex items-center justify-center">
            <Megaphone className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-black text-navy">
            {isRTL ? 'لوحة التسويق' : 'Marketing Cockpit'}
          </h1>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          {isRTL
            ? 'كل قنوات الترويج، الحالة، والأرقام في مكان واحد.'
            : 'All promotion channels, status, and numbers in one place.'}
        </p>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-emerald" size={28} />
          </div>
        )}

        {!loading && (
          <>
            {/* KPI Cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-emerald text-white rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Users size={20} />
                  <span className="text-xs opacity-80">{isRTL ? 'آخر 7 أيام' : 'last 7 days'}</span>
                </div>
                <div className="text-3xl font-black">{usersLast7}</div>
                <div className="text-sm opacity-90">{isRTL ? 'مستخدمون جدد' : 'new users'}</div>
              </div>
              <div className="bg-navy text-white rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <FileText size={20} />
                  <span className="text-xs opacity-80">{isRTL ? 'آخر 7 أيام' : 'last 7 days'}</span>
                </div>
                <div className="text-3xl font-black">{listingsLast7}</div>
                <div className="text-sm opacity-90">{isRTL ? 'إعلانات جديدة' : 'new listings'}</div>
              </div>
              <div className="bg-amber-500 text-white rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp size={20} />
                  <span className="text-xs opacity-80">{isRTL ? 'الكل' : 'all-time'}</span>
                </div>
                <div className="text-3xl font-black">{totalViews.toLocaleString()}</div>
                <div className="text-sm opacity-90">{isRTL ? 'مشاهدات إعلانات' : 'listing views'}</div>
              </div>
            </div>

            {/* Channels status */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
              <h2 className="font-black text-navy mb-4">
                {isRTL ? '📡 حالة القنوات' : '📡 Channel Status'}
              </h2>
              <div className="space-y-2">
                {channels.map(c => (
                  <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0
                        ${c.status === 'live' ? 'bg-emerald animate-pulse' : 'bg-gray-300'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-navy">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.note}</div>
                    </div>
                    {c.link && (
                      <a href={c.link} target="_blank" rel="noopener noreferrer"
                        className="text-emerald hover:text-emerald-700">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Asset library */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
              <h2 className="font-black text-navy mb-4">
                {isRTL ? '📚 مكتبة الأصول التسويقية' : '📚 Marketing Asset Library'}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: MessageCircle, name: '30 منشور LinkedIn', path: 'scripts/marketing/linkedin-posts.md' },
                  { icon: Share2,        name: '30 تغريدة X جاهزة',  path: 'scripts/marketing/x-tweets.md' },
                  { icon: Mail,          name: 'سلسلة 5 إيميلات onboarding', path: 'scripts/marketing/email-sequences/' },
                  { icon: Users,         name: 'قوالب WhatsApp Outreach', path: 'scripts/marketing/whatsapp-outreach.md' },
                  { icon: TrendingUp,    name: 'قوالب Backlink Outreach',  path: 'scripts/marketing/backlink-outreach.md' },
                  { icon: BookOpen,      name: '5 مقالات SEO نُشرت',       path: `/${locale}/articles` },
                ].map(asset => (
                  <div key={asset.path} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                    <asset.icon className="text-emerald shrink-0" size={18} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-navy truncate">{asset.name}</div>
                      <div className="text-xs text-gray-500 font-mono truncate">{asset.path}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Top listings */}
            {analytics?.top_listings && analytics.top_listings.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="font-black text-navy mb-4">
                  {isRTL ? '🔥 أعلى الإعلانات مشاهدةً' : '🔥 Top viewed listings'}
                </h2>
                <div className="space-y-2">
                  {analytics.top_listings.slice(0, 5).map(l => (
                    <Link
                      key={l.id}
                      href={`/${locale}/listings/${l.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <span className="text-sm font-medium text-navy line-clamp-1">
                        {l.title_ar ?? `Listing #${l.id}`}
                      </span>
                      <span className="text-xs text-emerald font-bold shrink-0 ms-3">
                        👁 {l.views_count}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
