'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  LayoutDashboard, Plus, Eye, Bookmark, MessageSquare,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
  LogOut, Settings, DollarSign, Bell, Star,
  ChevronRight, Pencil, ExternalLink, Package,
  Pause, Play, RefreshCw, Trash2, AlertTriangle, Sparkles, X,
} from 'lucide-react';
import { userApi, authApi, listingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatDistanceToNow, storageUrl } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';

const SECTION_EMOJI: Record<string, string> = {
  ma: '🏢', fleet: '🚛', contracts: '📄', jobs: '💼', forum: '💬',
};
const SECTION_LABEL: Record<string, { ar: string; en: string }> = {
  ma:        { ar: 'استحواذ', en: 'M&A'       },
  fleet:     { ar: 'أسطول',   en: 'Fleet'     },
  contracts: { ar: 'عقود',    en: 'Contracts' },
  jobs:      { ar: 'وظائف',  en: 'Jobs'      },
  forum:     { ar: 'منتدى',  en: 'Forum'     },
};

const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; bg: string; text: string; Icon: any }> = {
  active:         { labelAr: 'نشط',          labelEn: 'Active',        bg: 'bg-emerald/10', text: 'text-emerald',    Icon: CheckCircle  },
  paused:         { labelAr: 'معطّل',         labelEn: 'Paused',        bg: 'bg-gray-100',   text: 'text-gray-500',   Icon: Pause        },
  pending_review: { labelAr: 'قيد المراجعة', labelEn: 'Under Review',  bg: 'bg-amber-50',   text: 'text-amber-600',  Icon: Clock        },
  expired:        { labelAr: 'منتهي',         labelEn: 'Expired',       bg: 'bg-red-50',     text: 'text-red-500',    Icon: XCircle      },
  draft:          { labelAr: 'مسودة',         labelEn: 'Draft',         bg: 'bg-gray-100',   text: 'text-gray-500',   Icon: AlertCircle  },
  rejected:       { labelAr: 'مرفوض',         labelEn: 'Rejected',      bg: 'bg-red-50',     text: 'text-red-500',    Icon: XCircle      },
};

/* ─── Expiry helper ─────────────────────────────────────────────────────── */
function daysUntilExpiry(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export default function DashboardPage() {
  const locale  = useLocale();
  const isRTL   = locale === 'ar';
  const router  = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const [stats,        setStats]        = useState<any>(null);
  const [listings,     setListings]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [listPage,     setListPage]     = useState(1);
  const [listLastPage, setListLastPage] = useState(1);
  const [myBids,     setMyBids]     = useState<any[]>([]);
  const [delConfirm, setDelConfirm] = useState<number | null>(null); // listing id pending delete
  const [actionBusy, setActionBusy] = useState<number | null>(null); // which listing is being acted on
  const [tipsListingId, setTipsListingId] = useState<number | null>(null); // which listing shows tips
  const [tips,          setTips]          = useState<Array<{icon:string;message:string;priority:string}>>([]);
  const [loadingTips,   setLoadingTips]   = useState(false);

  const loadStats = async () => {
    const [dashData, bidsData] = await Promise.all([
      userApi.getDashboardStats(),
      userApi.getMyBids().catch(() => ({ data: [] })),
    ]);
    setStats(dashData.stats);
    setMyBids((bidsData as any).data ?? []);
  };

  const loadListings = async (page: number) => {
    const res = await userApi.getMyListings(page);
    // Laravel paginate → { data: [], current_page, last_page }
    setListings(res.data ?? res ?? []);
    setListLastPage(res.last_page ?? 1);
  };

  const goToPage = (page: number) => {
    setListPage(page);
    loadListings(page);
  };

  useEffect(() => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    setLoading(true);
    Promise.all([loadStats(), loadListings(1)])
      .catch(() => toast.error(isRTL ? 'تعذر تحميل البيانات' : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push(`/${locale}`);
    toast.success(isRTL ? 'تم تسجيل الخروج' : 'Logged out');
  };

  /* ── Listing actions ── */
  const handlePause = async (id: number) => {
    setActionBusy(id);
    try {
      await listingsApi.pause(id);
      toast.success(isRTL ? 'تم تعطيل الإعلان مؤقتاً' : 'Listing paused');
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'paused' } : l));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'حدث خطأ' : 'Error'));
    } finally { setActionBusy(null); }
  };

  const handleUnpause = async (id: number) => {
    setActionBusy(id);
    try {
      await listingsApi.unpause(id);
      toast.success(isRTL ? 'تم إعادة تفعيل الإعلان' : 'Listing reactivated');
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active' } : l));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'حدث خطأ' : 'Error'));
    } finally { setActionBusy(null); }
  };

  const handleRenew = async (id: number) => {
    setActionBusy(id);
    try {
      const res = await listingsApi.renew(id);
      toast.success(isRTL ? 'تم تجديد الإعلان 30 يوماً ✓' : 'Listing renewed for 30 days ✓');
      setListings(prev => prev.map(l =>
        l.id === id ? { ...l, expires_at: res.expires_at, status: res.status } : l
      ));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'حدث خطأ' : 'Error'));
    } finally { setActionBusy(null); }
  };

  const handleDelete = async (id: number) => {
    setActionBusy(id);
    try {
      await listingsApi.delete(id);
      toast.success(isRTL ? 'تم حذف الإعلان' : 'Listing deleted');
      setListings(prev => prev.filter(l => l.id !== id));
      setDelConfirm(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'حدث خطأ' : 'Error'));
    } finally { setActionBusy(null); }
  };

  const handleFetchTips = async (listing: any) => {
    if (tipsListingId === listing.id) { setTipsListingId(null); return; }
    setTipsListingId(listing.id);
    setTips([]);
    setLoadingTips(true);
    try {
      const res = await fetch('/api/ai/listing-tips', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          section:      listing.section,
          listing_type: listing.listing_type,
          dynamic_data: listing.dynamic_data,
          price:        listing.price,
          views_count:  listing.views_count,
          title_ar:     listing.title_ar,
          has_images:   listing.media?.length > 0,
          city:         listing.city,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTips(data.tips ?? []);
      }
    } catch { setTips([]); }
    finally  { setLoadingTips(false); }
  };

  if (!isAuthenticated) return null;

  const displayName   = isRTL ? user?.name_ar : user?.name_en;
  const pendingCount  = listings.filter(l => l.status === 'pending_review').length;
  const rejectedCount = listings.filter(l => l.status === 'rejected').length;
  const expiredCount  = listings.filter(l => l.status === 'expired').length;

  const STATS = [
    {
      icon: TrendingUp, value: stats?.total_listings  ?? 0,
      labelAr: 'إجمالي الإعلانات', labelEn: 'Total Listings',
      bg: 'from-navy to-navy/80', text: 'text-white', sub: 'text-white/70',
      href: `/${locale}/listings?mine=1`,
    },
    {
      icon: CheckCircle, value: stats?.active_listings ?? 0,
      labelAr: 'إعلانات نشطة', labelEn: 'Active Listings',
      bg: 'from-emerald to-emerald/80', text: 'text-white', sub: 'text-white/70',
      href: `/${locale}/listings?mine=1&status=active`,
    },
    {
      icon: Eye, value: stats?.total_views ?? 0,
      labelAr: 'إجمالي المشاهدات', labelEn: 'Total Views',
      bg: 'from-blue-500 to-blue-400', text: 'text-white', sub: 'text-white/70',
      href: null,
    },
    {
      icon: DollarSign, value: stats?.total_bids ?? 0,
      labelAr: 'عروض الأسعار', labelEn: 'Bids Received',
      bg: 'from-purple-500 to-purple-400', text: 'text-white', sub: 'text-white/70',
      href: null,
    },
    {
      icon: Bell, value: stats?.unread_messages ?? 0,
      labelAr: 'رسائل جديدة', labelEn: 'Unread Messages',
      bg: 'from-amber-500 to-amber-400', text: 'text-white', sub: 'text-white/70',
      href: `/${locale}/messages`,
    },
    {
      icon: Bookmark, value: stats?.bookmarks_count ?? 0,
      labelAr: 'المحفوظات', labelEn: 'Saved',
      bg: 'from-pink-500 to-pink-400', text: 'text-white', sub: 'text-white/70',
      href: `/${locale}/bookmarks`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-navy to-navy/90 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard size={20} className="text-emerald" />
              <span className="text-white/60 text-sm">{isRTL ? 'لوحة التحكم' : 'Dashboard'}</span>
            </div>
            <h1 className="text-2xl font-black">
              {isRTL ? `مرحباً، ${displayName} 👋` : `Welcome back, ${displayName} 👋`}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {isRTL ? 'هذه نظرة عامة على نشاطك في نوافذ' : "Here's an overview of your activity on Nawafez"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/listings/create`}
              className="bg-emerald hover:bg-emerald/90 text-white px-4 py-2.5 rounded-xl
                         text-sm font-semibold flex items-center gap-2 transition">
              <Plus size={16} />
              {isRTL ? 'إعلان جديد' : 'New Listing'}
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/20
                         text-white/70 hover:text-white hover:border-white/40 transition text-sm">
              <LogOut size={15} />
              {isRTL ? 'خروج' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-28 animate-pulse bg-gray-200" />
              ))
            : STATS.map(({ icon: Icon, value, labelAr, labelEn, bg, text, sub, href }, i) => {
                const Wrapper = href ? Link : 'div';
                return (
                  <Wrapper key={i} href={href ?? ''} className={`rounded-2xl p-4 bg-gradient-to-br ${bg}
                             flex flex-col justify-between min-h-[7rem] shadow-sm
                             ${href ? 'hover:scale-[1.02] transition-transform cursor-pointer' : ''}`}>
                    <div className={`${text} opacity-80`}><Icon size={20} /></div>
                    <div>
                      <p className={`text-3xl font-black ${text}`}>{value}</p>
                      <p className={`text-[11px] mt-0.5 ${sub}`}>{isRTL ? labelAr : labelEn}</p>
                    </div>
                  </Wrapper>
                );
              })
          }
        </div>

        {/* ── Alerts ── */}
        {!loading && pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
            <Clock size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {isRTL
                  ? `${pendingCount} إعلان قيد المراجعة`
                  : `${pendingCount} listing${pendingCount > 1 ? 's' : ''} under review`}
              </p>
              <p className="text-amber-700 text-xs mt-0.5">
                {isRTL
                  ? 'سيتم مراجعة إعلاناتك من فريق نوافذ خلال 24 ساعة.'
                  : 'Your listings will be reviewed within 24 hours.'}
              </p>
            </div>
          </div>
        )}
        {!loading && rejectedCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start">
            <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">
              {isRTL
                ? `${rejectedCount} إعلان مرفوض — يمكنك تعديله وإعادة نشره.`
                : `${rejectedCount} listing${rejectedCount > 1 ? 's' : ''} rejected — edit and repost.`}
            </p>
          </div>
        )}
        {!loading && expiredCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3 items-start">
            <AlertTriangle size={18} className="text-orange-500 mt-0.5 shrink-0" />
            <p className="text-orange-700 text-sm">
              {isRTL
                ? `${expiredCount} إعلان انتهت صلاحيته — اضغط "تجديد" لإعادة نشره 30 يوماً.`
                : `${expiredCount} expired listing${expiredCount > 1 ? 's' : ''} — click Renew to repost.`}
            </p>
          </div>
        )}

        {/* ── Listings + Quick Links ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent listings (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-navy flex items-center gap-2">
                  <Package size={16} className="text-emerald" />
                  {isRTL ? 'إعلاناتك' : 'Your Listings'}
                </h2>
                <Link href={`/${locale}/listings?mine=1`}
                  className="text-xs text-emerald hover:underline flex items-center gap-1">
                  {isRTL ? 'عرض الكل' : 'View all'}
                  <ChevronRight size={12} className={isRTL ? 'rotate-180' : ''} />
                </Link>
              </div>

              {loading ? (
                <div className="divide-y">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 px-5 py-4 animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="text-5xl mb-3">📋</div>
                  <p className="text-gray-500 text-sm mb-4">
                    {isRTL ? 'لا توجد إعلانات بعد' : 'No listings yet'}
                  </p>
                  <Link href={`/${locale}/listings/create`} className="btn-primary text-sm">
                    {isRTL ? '+ انشر أول إعلان' : '+ Post your first listing'}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {listings.map((listing: any) => {
                    const cfg    = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.draft;
                    const title  = isRTL ? listing.title_ar : (listing.title_en ?? listing.title_ar);
                    const sec    = listing.section ?? '';
                    const price  = listing.price
                      ? `${Number(listing.price).toLocaleString(isRTL ? 'ar-SA' : 'en-US')} ${isRTL ? 'ر.س' : 'SAR'}`
                      : null;
                    const daysLeft  = daysUntilExpiry(listing.expires_at);
                    const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                    const isBusy    = actionBusy === listing.id;

                    return (
                      <div key={listing.id} className="px-5 py-3.5 hover:bg-gray-50 transition">

                        {/* Delete confirmation banner */}
                        {delConfirm === listing.id && (
                          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3
                                          flex items-center justify-between gap-3">
                            <p className="text-sm text-red-700 font-medium">
                              {isRTL ? 'هل أنت متأكد من حذف هذا الإعلان؟' : 'Delete this listing permanently?'}
                            </p>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleDelete(listing.id)}
                                disabled={isBusy}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold
                                           hover:bg-red-600 disabled:opacity-60 transition"
                              >
                                {isBusy ? '…' : (isRTL ? 'نعم، احذف' : 'Yes, Delete')}
                              </button>
                              <button
                                onClick={() => setDelConfirm(null)}
                                className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg
                                           text-xs hover:bg-gray-100 transition"
                              >
                                {isRTL ? 'إلغاء' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          {/* Thumbnail or section emoji */}
                          {(() => {
                            const img = listing.media?.find((m: any) => m.is_primary && m.type === 'image')
                                     ?? listing.media?.find((m: any) => m.type === 'image');
                            return img ? (
                              <div className="w-11 h-11 rounded-xl shrink-0 overflow-hidden bg-navy/5">
                                <img
                                  src={storageUrl(img.path)!}
                                  alt={title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const el = e.currentTarget.parentElement!;
                                    el.className = 'w-11 h-11 rounded-xl bg-navy/5 flex items-center justify-center text-2xl shrink-0';
                                    el.innerHTML = SECTION_EMOJI[sec] ?? '📋';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-navy/5 flex items-center
                                              justify-center text-2xl shrink-0">
                                {SECTION_EMOJI[sec] ?? '📋'}
                              </div>
                            );
                          })()}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {SECTION_LABEL[sec] && (
                                <span className="text-[10px] text-gray-400">
                                  {isRTL ? SECTION_LABEL[sec].ar : SECTION_LABEL[sec].en}
                                </span>
                              )}
                              {price && <span className="text-[10px] font-bold text-navy">· {price}</span>}
                              <span className="text-[10px] text-gray-400">
                                · <Eye size={9} className="inline" /> {listing.views_count ?? 0}
                              </span>
                              {/* Expiry indicator */}
                              {listing.status === 'active' && daysLeft !== null && (
                                <span className={`text-[10px] font-medium flex items-center gap-0.5
                                                  ${isExpiring ? 'text-orange-500' : 'text-gray-400'}`}>
                                  · <Clock size={9} className="inline" />
                                  {isRTL
                                    ? (isExpiring
                                        ? `تنتهي خلال ${daysLeft} يوم`
                                        : `تنتهي بعد ${daysLeft} يوم`)
                                    : (isExpiring
                                        ? `Expires in ${daysLeft}d`
                                        : `${daysLeft}d left`)}
                                </span>
                              )}
                              {listing.status === 'expired' && (
                                <span className="text-[10px] font-medium text-red-500">
                                  · {isRTL ? 'منتهية الصلاحية' : 'Expired'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status badge */}
                          <span className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold
                                            px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <cfg.Icon size={11} />
                            {isRTL ? cfg.labelAr : cfg.labelEn}
                          </span>

                          {/* Action buttons */}
                          <div className="flex gap-1 shrink-0">
                            {/* View */}
                            <Link href={`/${locale}/listings/${listing.id}`}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400
                                         hover:text-gray-700 transition"
                              title={isRTL ? 'عرض' : 'View'}>
                              <ExternalLink size={14} />
                            </Link>

                            {/* Edit */}
                            <Link href={`/${locale}/listings/${listing.id}/edit`}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400
                                         hover:text-blue-600 transition"
                              title={isRTL ? 'تعديل' : 'Edit'}>
                              <Pencil size={14} />
                            </Link>

                            {/* Pause / Unpause */}
                            {listing.status === 'active' && (
                              <button
                                onClick={() => handlePause(listing.id)}
                                disabled={isBusy}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400
                                           hover:text-amber-600 transition disabled:opacity-40"
                                title={isRTL ? 'تعطيل مؤقت' : 'Pause'}>
                                <Pause size={14} />
                              </button>
                            )}
                            {listing.status === 'paused' && (
                              <button
                                onClick={() => handleUnpause(listing.id)}
                                disabled={isBusy}
                                className="p-1.5 rounded-lg hover:bg-emerald/10 text-gray-400
                                           hover:text-emerald transition disabled:opacity-40"
                                title={isRTL ? 'إعادة تفعيل' : 'Unpause'}>
                                <Play size={14} />
                              </button>
                            )}

                            {/* Renew */}
                            {(listing.status === 'expired' || isExpiring) && (
                              <button
                                onClick={() => handleRenew(listing.id)}
                                disabled={isBusy}
                                className="p-1.5 rounded-lg hover:bg-emerald/10 text-gray-400
                                           hover:text-emerald transition disabled:opacity-40"
                                title={isRTL ? 'تجديد 30 يوم' : 'Renew 30 days'}>
                                <RefreshCw size={14} />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => setDelConfirm(listing.id === delConfirm ? null : listing.id)}
                              disabled={isBusy}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400
                                         hover:text-red-500 transition disabled:opacity-40"
                              title={isRTL ? 'حذف' : 'Delete'}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* ── AI Advisor trigger ── */}
                        {tipsListingId !== listing.id && (
                          <button
                            onClick={() => handleFetchTips(listing)}
                            className="mt-2.5 w-full flex items-center gap-2 px-3 py-2 rounded-xl
                                       bg-gradient-to-r from-violet-50 to-purple-50
                                       border border-violet-100 hover:border-violet-300
                                       hover:from-violet-100 hover:to-purple-100
                                       transition-all group text-start"
                          >
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600
                                            flex items-center justify-center shrink-0 shadow-sm">
                              <Sparkles size={11} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-violet-700">
                                {isRTL ? '✨ توصيات الذكاء الاصطناعي' : '✨ AI Advisor'}
                              </p>
                              <p className="text-[10px] text-violet-400">
                                {isRTL ? 'اضغط للحصول على نصائح لتحسين هذا الإعلان' : 'Click to get tips for improving this listing'}
                              </p>
                            </div>
                            <ChevronRight size={14}
                              className={`text-violet-300 group-hover:text-violet-500 transition shrink-0
                                          ${isRTL ? 'rotate-180' : ''}`} />
                          </button>
                        )}

                        {/* ── AI Tips Panel ── */}
                        {tipsListingId === listing.id && (
                          <div className="mt-2.5 rounded-xl overflow-hidden border border-violet-200 shadow-sm">
                            {/* Panel header */}
                            <div className="flex items-center justify-between px-4 py-2.5
                                            bg-gradient-to-r from-violet-600 to-purple-600">
                              <div className="flex items-center gap-2">
                                <Sparkles size={13} className="text-white/80" />
                                <span className="text-xs font-bold text-white">
                                  {isRTL ? 'توصيات الذكاء الاصطناعي لهذا الإعلان' : 'AI Recommendations for this listing'}
                                </span>
                              </div>
                              <button
                                onClick={() => setTipsListingId(null)}
                                className="p-0.5 text-white/60 hover:text-white transition">
                                <X size={13} />
                              </button>
                            </div>
                            {/* Panel body */}
                            <div className="bg-violet-50 p-3.5">
                              {loadingTips ? (
                                <div className="space-y-2.5">
                                  {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3">
                                      <div className="w-7 h-7 rounded-lg bg-violet-200 animate-pulse shrink-0" />
                                      <div className="flex-1 h-3.5 bg-violet-200 rounded animate-pulse" />
                                    </div>
                                  ))}
                                </div>
                              ) : tips.length === 0 ? (
                                <div className="flex items-center justify-between gap-2.5 py-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">🔄</span>
                                    <p className="text-xs text-violet-600">
                                      {isRTL ? 'لم يتمكن المستشار من التحليل' : 'Advisor could not analyze'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const listings_list = listings.find((l: any) => l.id === tipsListingId);
                                      if (listings_list) { setTipsListingId(null); setTimeout(() => handleFetchTips(listings_list), 50); }
                                    }}
                                    className="text-[10px] text-violet-600 hover:text-violet-800 underline shrink-0"
                                  >
                                    {isRTL ? 'أعد المحاولة' : 'Retry'}
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2.5">
                                  {tips.map((tip, i) => (
                                    <div key={i}
                                      className={`flex items-start gap-3 rounded-lg px-3 py-2.5
                                                  ${tip.priority === 'high'
                                                    ? 'bg-red-50 border border-red-100'
                                                    : 'bg-white border border-violet-100'}`}>
                                      <span className="text-base shrink-0 mt-0.5">{tip.icon}</span>
                                      <p className={`text-xs leading-relaxed font-medium
                                                     ${tip.priority === 'high' ? 'text-red-700' : 'text-violet-800'}`}>
                                        {tip.message}
                                      </p>
                                      {tip.priority === 'high' && (
                                        <span className="shrink-0 text-[9px] bg-red-100 text-red-600
                                                          font-bold px-1.5 py-0.5 rounded-full border border-red-200 mt-0.5">
                                          {isRTL ? 'عاجل' : 'High'}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {listLastPage > 1 && (
                <div className="flex items-center justify-center gap-3 py-4 border-t border-gray-100">
                  <button
                    onClick={() => goToPage(listPage - 1)}
                    disabled={listPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                               disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    {isRTL ? 'السابق →' : '← Prev'}
                  </button>
                  <span className="text-sm text-gray-500 font-medium">
                    {listPage} / {listLastPage}
                  </span>
                  <button
                    onClick={() => goToPage(listPage + 1)}
                    disabled={listPage === listLastPage}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                               disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    {isRTL ? '← التالي' : 'Next →'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick links (1/3) */}
          <div className="space-y-4">
            <h2 className="font-bold text-navy text-sm px-1">
              {isRTL ? 'روابط سريعة' : 'Quick Links'}
            </h2>

            {[
              { href: `/${locale}/listings/create`, labelAr: 'إضافة إعلان جديد',    labelEn: 'Post New Listing',    icon: Plus,         color: 'bg-emerald/10 text-emerald',  hover: 'group-hover:bg-emerald group-hover:text-white' },
              { href: `/${locale}/listings`,        labelAr: 'تصفح الإعلانات',       labelEn: 'Browse Listings',     icon: Package,      color: 'bg-navy/10 text-navy',        hover: 'group-hover:bg-navy group-hover:text-white'    },
              { href: `/${locale}/messages`,        labelAr: 'رسائلي',               labelEn: 'My Messages',         icon: MessageSquare,color: 'bg-blue-50 text-blue-500',    hover: 'group-hover:bg-blue-500 group-hover:text-white'},
              { href: `/${locale}/bookmarks`,       labelAr: 'إعلاناتي المحفوظة',    labelEn: 'Saved Listings',      icon: Bookmark,     color: 'bg-pink-50 text-pink-500',    hover: 'group-hover:bg-pink-500 group-hover:text-white'},
              { href: `/${locale}/profile`,         labelAr: 'إعدادات الحساب',       labelEn: 'Account Settings',    icon: Settings,     color: 'bg-gray-100 text-gray-600',   hover: 'group-hover:bg-gray-600 group-hover:text-white'},
            ].map(({ href, labelAr, labelEn, icon: Icon, color, hover }) => (
              <Link key={href} href={href}
                className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 flex items-center gap-3
                           hover:border-emerald hover:shadow-sm transition group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${color} ${hover}`}>
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {isRTL ? labelAr : labelEn}
                </span>
                <ChevronRight size={14} className={`ms-auto text-gray-300 group-hover:text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            ))}

            {/* Account info card */}
            <div className="bg-gradient-to-br from-navy to-navy/80 rounded-2xl p-4 text-white mt-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-base">
                  {displayName?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="font-bold text-sm">{displayName}</p>
                  <p className="text-white/60 text-xs capitalize">{user?.role}</p>
                </div>
              </div>
              {user?.role !== 'business' && (
                <Link href={`/${locale}/profile`}
                  className="text-[11px] text-white/70 hover:text-white flex items-center gap-1 transition">
                  <Star size={11} />
                  {isRTL ? 'ارفع حسابك إلى Business ←' : 'Upgrade to Business →'}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── My submitted bids (M&A) ── */}
        {!loading && myBids.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-navy flex items-center gap-2">
                <DollarSign size={16} className="text-indigo-500" />
                {isRTL ? 'عروض الأسعار التي قدمتها' : 'My Submitted Bids'}
              </h2>
              <span className="text-xs text-gray-400">
                {isRTL ? `${myBids.length} عروض` : `${myBids.length} bids`}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {myBids.map((bid: any) => {
                const listingTitle = isRTL
                  ? bid.listing?.title_ar
                  : (bid.listing?.title_en ?? bid.listing?.title_ar);
                return (
                  <div key={bid.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 text-xl">
                      🏢
                    </div>
                    <div className="flex-1 min-w-0">
                      {bid.listing ? (
                        <Link href={`/${locale}/listings/${bid.listing.id}`}
                          className="font-semibold text-gray-800 text-sm truncate hover:text-emerald transition-colors block">
                          {listingTitle}
                        </Link>
                      ) : (
                        <p className="font-semibold text-gray-400 text-sm">
                          {isRTL ? 'الإعلان غير متاح' : 'Listing unavailable'}
                        </p>
                      )}
                      {bid.message && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{bid.message}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="font-black text-emerald text-sm">
                        {Number(bid.amount).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                        {' '}{isRTL ? 'ر.س' : 'SAR'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(bid.submitted_at).toLocaleDateString(
                          isRTL ? 'ar-SA' : 'en-US',
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
