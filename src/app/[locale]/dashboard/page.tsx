'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  LayoutDashboard, Plus, Eye, Bookmark, MessageSquare,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, LogOut
} from 'lucide-react';
import { userApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatDistanceToNow, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; color: string; Icon: any }> = {
  active:         { labelAr: 'نشط',          labelEn: 'Active',          color: 'text-emerald', Icon: CheckCircle  },
  pending_review: { labelAr: 'قيد المراجعة', labelEn: 'Under Review',    color: 'text-amber-500',Icon: Clock        },
  expired:        { labelAr: 'منتهي',         labelEn: 'Expired',         color: 'text-gray-400', Icon: XCircle     },
  draft:          { labelAr: 'مسودة',         labelEn: 'Draft',           color: 'text-gray-400', Icon: AlertCircle  },
  rejected:       { labelAr: 'مرفوض',         labelEn: 'Rejected',        color: 'text-red-500',  Icon: XCircle     },
};

export default function DashboardPage() {
  const locale  = useLocale();
  const router  = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const [stats, setStats]   = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login`);
      return;
    }

    const load = async () => {
      try {
        const data = await userApi.getDashboardStats();
        setStats(data.stats);
        setListings(data.recent_listings ?? []);
      } catch {
        toast.error(locale === 'ar' ? 'تعذر تحميل البيانات' : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    clearAuth();
    router.push(`/${locale}`);
    toast.success(locale === 'ar' ? 'تم تسجيل الخروج' : 'Logged out');
  };

  const displayName = locale === 'ar' ? user?.name_ar : user?.name_en;

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
              <LayoutDashboard size={24} />
              {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {locale === 'ar' ? `مرحباً، ${displayName}` : `Welcome back, ${displayName}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/listings/create`}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              {locale === 'ar' ? 'إعلان جديد' : 'New Listing'}
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:text-red-500 hover:border-red-300 transition text-sm"
            >
              <LogOut size={16} />
              {locale === 'ar' ? 'خروج' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Stats cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="skeleton h-8 w-8 rounded-lg mb-3" />
                <div className="skeleton h-7 w-1/2 mb-1" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { icon: TrendingUp,    value: stats.total_listings,  labelAr: 'إجمالي الإعلانات', labelEn: 'Total Listings',   color: 'text-navy' },
              { icon: CheckCircle,   value: stats.active_listings, labelAr: 'إعلانات نشطة',      labelEn: 'Active',           color: 'text-emerald' },
              { icon: Eye,           value: stats.total_views,     labelAr: 'مشاهدات',           labelEn: 'Views',            color: 'text-blue-500' },
              { icon: MessageSquare, value: stats.total_bids,      labelAr: 'عروض أسعار',        labelEn: 'Bids',             color: 'text-purple-500' },
              { icon: MessageSquare, value: stats.unread_messages, labelAr: 'رسائل جديدة',       labelEn: 'Unread Messages',  color: 'text-amber-500' },
              { icon: Bookmark,      value: stats.bookmarks_count, labelAr: 'المحفوظات',         labelEn: 'Bookmarks',        color: 'text-pink-500' },
            ].map(({ icon: Icon, value, labelAr, labelEn, color }, i) => (
              <div key={i} className="card text-center">
                <div className={`flex justify-center mb-2 ${color}`}>
                  <Icon size={22} />
                </div>
                <p className="text-2xl font-bold text-navy">{value ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">{locale === 'ar' ? labelAr : labelEn}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Recent listings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy">
              {locale === 'ar' ? 'أحدث إعلاناتك' : 'Your Recent Listings'}
            </h2>
            <Link
              href={`/${locale}/listings?mine=1`}
              className="text-sm text-emerald hover:underline"
            >
              {locale === 'ar' ? 'عرض الكل' : 'View all'}
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="skeleton h-14 w-14 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-4">
                {locale === 'ar' ? 'لا توجد إعلانات بعد' : 'No listings yet'}
              </p>
              <Link href={`/${locale}/listings/create`} className="btn-primary text-sm">
                {locale === 'ar' ? 'انشر أول إعلان' : 'Post your first listing'}
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {listings.map((listing: any) => {
                const cfg    = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.draft;
                const title  = locale === 'ar' ? listing.title_ar : (listing.title_en ?? listing.title_ar);

                return (
                  <div key={listing.id} className="flex items-center gap-4 py-3">
                    <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center text-navy font-bold text-lg shrink-0">
                      {title?.[0] ?? '#'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${locale}/listings/${listing.id}`}
                        className="font-medium text-gray-800 hover:text-emerald truncate block"
                      >
                        {title}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(listing.created_at, locale)}
                        {' · '}
                        <Eye size={10} className="inline" /> {listing.views_count ?? 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <cfg.Icon size={14} className={cfg.color} />
                      <span className={`text-xs font-medium ${cfg.color}`}>
                        {locale === 'ar' ? cfg.labelAr : cfg.labelEn}
                      </span>
                    </div>
                    {listing.expires_at && (
                      <p className="text-xs text-gray-400 shrink-0 hidden sm:block">
                        {locale === 'ar' ? 'ينتهي' : 'Expires'}{' '}
                        {formatDistanceToNow(listing.expires_at, locale)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[
            { href: `/${locale}/bookmarks`, labelAr: 'إعلاناتي المحفوظة', labelEn: 'My Bookmarks', icon: Bookmark    },
            { href: `/${locale}/messages`,  labelAr: 'رسائلي',            labelEn: 'My Messages',  icon: MessageSquare },
            { href: `/${locale}/profile`,   labelAr: 'إعدادات الحساب',    labelEn: 'Account Settings', icon: AlertCircle },
          ].map(({ href, labelAr, labelEn, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="card flex items-center gap-3 hover:border-emerald hover:shadow-md transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center text-emerald group-hover:bg-emerald group-hover:text-white transition">
                <Icon size={18} />
              </div>
              <span className="font-medium text-gray-700 text-sm">
                {locale === 'ar' ? labelAr : labelEn}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
