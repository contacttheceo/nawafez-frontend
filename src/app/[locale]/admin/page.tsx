'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, LayoutDashboard, FileText, AlertTriangle,
  CheckCircle, XCircle, Clock, DollarSign, TrendingUp,
  Shield, Eye, Star, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

type AdminTab = 'dashboard' | 'listings' | 'users' | 'verifications' | 'reports';

export default function AdminPage() {
  const locale  = useLocale();
  const router  = useRouter();
  const isRTL   = locale === 'ar';
  const { user, isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab]   = useState<AdminTab>('dashboard');
  const [stats, setStats]           = useState<any>(null);
  const [listings, setListings]     = useState<any[]>([]);
  const [users, setUsers]           = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reports, setReports]       = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [search, setSearch]         = useState('');
  const [rejectModal, setRejectModal] = useState<{ type: 'listing' | 'verification'; id: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Guard: only admin
  useEffect(() => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    if (user?.role !== 'admin') { router.push(`/${locale}`); return; }
  }, [isAuthenticated, user]);

  // Load dashboard stats
  useEffect(() => {
    if (user?.role !== 'admin') return;
    const load = async () => {
      try {
        const res: any = await api.get('/admin/dashboard');
        setStats(res);
      } catch {}
    };
    load();
  }, [user]);

  // Load data by tab
  useEffect(() => {
    if (user?.role !== 'admin') return;
    const load = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'listings') {
          const res: any = await api.get('/admin/listings');
          setListings(res.data ?? []);
        } else if (activeTab === 'users') {
          const res: any = await api.get('/admin/users', { params: { search } });
          setUsers(res.data ?? []);
        } else if (activeTab === 'verifications') {
          const res: any = await api.get('/admin/verifications');
          setVerifications(res.data ?? []);
        } else if (activeTab === 'reports') {
          const res: any = await api.get('/admin/reports');
          setReports(res.data ?? []);
        }
      } catch {
        toast.error(isRTL ? 'فشل التحميل' : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [activeTab, user]);

  const approve = async (id: number) => {
    await api.patch(`/admin/listings/${id}/approve`);
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: 'active' } : l));
    toast.success(isRTL ? 'تم قبول الإعلان' : 'Listing approved');
  };

  const reject = (id: number) => {
    setRejectReason('');
    setRejectModal({ type: 'listing', id });
  };

  const toggleFeatured = async (id: number, current: boolean) => {
    await api.patch(`/admin/listings/${id}/feature`);
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, is_featured: !current } : l));
  };

  const approveVerification = async (id: number) => {
    await api.post(`/admin/verifications/${id}/approve`);
    setVerifications((prev) => prev.filter((v) => v.id !== id));
    toast.success(isRTL ? 'تم قبول التوثيق' : 'Verification approved');
  };

  const rejectVerification = (id: number) => {
    setRejectReason('');
    setRejectModal({ type: 'verification', id });
  };

  const resolveReport = async (id: number) => {
    await api.patch(`/admin/reports/${id}/resolve`);
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success(isRTL ? 'تم حل البلاغ' : 'Report resolved');
  };

  const toggleTrustedPayer = async (id: number) => {
    await api.patch(`/admin/users/${id}/trusted-payer`);
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_trusted_payer: !u.is_trusted_payer } : u));
  };

  const confirmReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    try {
      if (rejectModal.type === 'listing') {
        await api.patch(`/admin/listings/${rejectModal.id}/reject`, { reason: rejectReason });
        setListings(prev => prev.map(l => l.id === rejectModal.id ? { ...l, status: 'rejected' } : l));
        toast.success(isRTL ? 'تم رفض الإعلان' : 'Listing rejected');
      } else {
        await api.post(`/admin/verifications/${rejectModal.id}/reject`, { notes: rejectReason });
        setVerifications(prev => prev.filter(v => v.id !== rejectModal.id));
        toast.success(isRTL ? 'تم رفض التوثيق' : 'Verification rejected');
      }
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Error');
    } finally {
      setRejectModal(null);
      setRejectReason('');
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  const tabConfig = [
    { id: 'dashboard',     labelAr: 'الإحصائيات', labelEn: 'Dashboard',     Icon: LayoutDashboard },
    { id: 'listings',      labelAr: 'الإعلانات',   labelEn: 'Listings',      Icon: FileText        },
    { id: 'verifications', labelAr: 'التوثيقات',   labelEn: 'Verifications', Icon: Shield          },
    { id: 'reports',       labelAr: 'البلاغات',    labelEn: 'Reports',       Icon: AlertTriangle   },
    { id: 'users',         labelAr: 'المستخدمون',  labelEn: 'Users',         Icon: Users           },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-navy">
              {isRTL ? 'لوحة الإدارة' : 'Admin Panel'}
            </h1>
            <p className="text-xs text-gray-500">نوافذ — Nawafez</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
          {tabConfig.map(({ id, labelAr, labelEn, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                          whitespace-nowrap transition flex-shrink-0
                          ${activeTab === id ? 'bg-navy text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <Icon size={15} />
              {isRTL ? labelAr : labelEn}
            </button>
          ))}
        </div>

        {/* ── Dashboard Stats ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {!stats ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-navy" size={32} /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: isRTL ? 'إجمالي المستخدمين' : 'Total Users',     value: stats.users?.total,       Icon: Users,      color: 'text-navy'    },
                    { label: isRTL ? 'إعلانات نشطة' : 'Active Listings',      value: stats.listings?.active,   Icon: FileText,   color: 'text-emerald' },
                    { label: isRTL ? 'بانتظار المراجعة' : 'Pending Review',   value: stats.listings?.pending_review, Icon: Clock, color: 'text-amber-500'},
                    { label: isRTL ? 'الإيرادات (ر.س)' : 'Revenue (SAR)',     value: stats.revenue?.total_sar?.toLocaleString(), Icon: DollarSign, color: 'text-emerald'},
                  ].map(({ label, value, Icon, color }) => (
                    <div key={label} className="card p-5">
                      <div className={`flex items-center gap-2 mb-2 ${color}`}>
                        <Icon size={18} />
                        <span className="text-xs font-semibold text-gray-500">{label}</span>
                      </div>
                      <p className={`text-3xl font-black ${color}`}>{value ?? '—'}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card p-5">
                    <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                      <TrendingUp size={14} /> {isRTL ? 'إحصائيات اليوم' : "Today's Stats"}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isRTL ? 'مستخدمون جدد' : 'New users'}</span>
                        <span className="font-bold text-navy">{stats.users?.new_today}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isRTL ? 'إعلانات جديدة' : 'New listings'}</span>
                        <span className="font-bold text-navy">{stats.listings?.new_today}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card p-5">
                    <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-red-500" />
                      {isRTL ? 'تحتاج تدخل' : 'Needs Action'}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isRTL ? 'إعلانات معلقة' : 'Pending listings'}</span>
                        <span className="font-bold text-amber-500">{stats.listings?.pending_review}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isRTL ? 'بلاغات معلقة' : 'Pending reports'}</span>
                        <span className="font-bold text-red-500">{stats.reports?.pending}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card p-5">
                    <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald" />
                      {isRTL ? 'الإيرادات' : 'Revenue'}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isRTL ? 'هذا الشهر' : 'This month'}</span>
                        <span className="font-bold text-emerald">
                          {stats.revenue?.this_month?.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isRTL ? 'الإجمالي' : 'Total'}</span>
                        <span className="font-bold text-navy">
                          {stats.revenue?.total_sar?.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Listings Moderation ── */}
        {activeTab === 'listings' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" size={28} /></div>
            ) : listings.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                {isRTL ? 'لا توجد إعلانات' : 'No listings'}
              </div>
            ) : listings.map((listing) => (
              <div key={listing.id} className="card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/${locale}/listings/${listing.id}`}
                      className="font-bold text-navy hover:underline text-sm">
                      {isRTL ? listing.title_ar : listing.title_en || listing.title_ar}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${listing.status === 'active'         ? 'bg-emerald/10 text-emerald' :
                        listing.status === 'pending_review' ? 'bg-amber-100 text-amber-600' :
                        listing.status === 'rejected'       ? 'bg-red-100 text-red-600' :
                                                             'bg-gray-100 text-gray-500'}`}>
                      {listing.status}
                    </span>
                    {listing.is_featured && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        ⭐ {isRTL ? 'مميز' : 'Featured'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {listing.section} · {listing.city} · {isRTL ? listing.user?.name_ar : listing.user?.name_en}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/${locale}/listings/${listing.id}`}
                    className="p-2 hover:bg-gray-100 rounded-lg transition" title="View">
                    <Eye size={15} className="text-gray-500" />
                  </Link>
                  <button onClick={() => toggleFeatured(listing.id, listing.is_featured)}
                    className={`p-2 rounded-lg transition ${listing.is_featured ? 'bg-yellow-50 text-yellow-600' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <Star size={15} />
                  </button>
                  {listing.status !== 'active' && (
                    <button onClick={() => approve(listing.id)}
                      className="p-2 hover:bg-emerald/10 rounded-lg text-emerald transition">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  {listing.status !== 'rejected' && (
                    <button onClick={() => reject(listing.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition">
                      <XCircle size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Verifications ── */}
        {activeTab === 'verifications' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" size={28} /></div>
            ) : verifications.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                {isRTL ? 'لا توجد طلبات توثيق' : 'No pending verifications'}
              </div>
            ) : verifications.map((v: any) => (
              <div key={v.id} className="card p-4 flex items-center gap-4">
                <Shield className="text-navy flex-shrink-0" size={24} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-navy text-sm">
                    {isRTL ? v.user?.name_ar : v.user?.name_en}
                  </p>
                  <p className="text-xs text-gray-400">{v.user?.email} · CR: {v.cr_number}</p>
                </div>
                {v.cr_image_path && (
                  <a href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${v.cr_image_path}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-emerald hover:underline flex-shrink-0">
                    {isRTL ? 'عرض الوثيقة' : 'View Doc'}
                  </a>
                )}
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approveVerification(v.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald/10 text-emerald
                               rounded-lg text-xs font-semibold hover:bg-emerald/20 transition">
                    <CheckCircle size={13} /> {isRTL ? 'قبول' : 'Approve'}
                  </button>
                  <button onClick={() => rejectVerification(v.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500
                               rounded-lg text-xs font-semibold hover:bg-red-100 transition">
                    <XCircle size={13} /> {isRTL ? 'رفض' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Reports ── */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" size={28} /></div>
            ) : reports.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                {isRTL ? 'لا توجد بلاغات' : 'No reports'}
              </div>
            ) : reports.map((r: any) => (
              <div key={r.id} className="card p-4 flex items-start gap-4">
                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-navy text-sm">{r.data?.reason ?? '—'}</p>
                    <Link href={`/${locale}/listings/${r.listing_id}`}
                      className="text-xs text-emerald hover:underline">
                      #{r.listing_id}
                    </Link>
                  </div>
                  {r.data?.details && (
                    <p className="text-xs text-gray-500 mt-0.5">{r.data.details}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isRTL ? 'بواسطة:' : 'By:'} {isRTL ? r.user?.name_ar : r.user?.name_en}
                  </p>
                </div>
                <button onClick={() => resolveReport(r.id)}
                  className="px-3 py-1.5 bg-emerald/10 text-emerald rounded-lg text-xs font-semibold
                             hover:bg-emerald/20 transition flex-shrink-0">
                  {isRTL ? 'تم الحل' : 'Resolve'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') {
                setIsLoading(true);
                api.get('/admin/users', { params: { search } }).then((res: any) => {
                  setUsers(res.data ?? []);
                }).finally(() => setIsLoading(false));
              }}}
              className="input text-sm py-2"
              placeholder={isRTL ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
            />
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" size={28} /></div>
            ) : users.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                {isRTL ? 'لا توجد نتائج' : 'No results'}
              </div>
            ) : users.map((u: any) => (
              <div key={u.id} className="card p-4 flex items-center gap-4">
                <div className="w-9 h-9 bg-navy/10 rounded-full flex items-center justify-center
                                text-navy font-bold text-sm flex-shrink-0">
                  {(isRTL ? u.name_ar : u.name_en)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-navy text-sm">
                    {isRTL ? u.name_ar : u.name_en}
                  </p>
                  <p className="text-xs text-gray-400" dir="ltr">{u.email} · {u.role}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {u.is_trusted_payer && (
                    <span className="text-xs bg-emerald/10 text-emerald px-2 py-0.5 rounded-full font-medium">
                      {isRTL ? 'موثوق' : 'Trusted'}
                    </span>
                  )}
                  <button
                    onClick={() => toggleTrustedPayer(u.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                      ${u.is_trusted_payer
                        ? 'bg-red-50 text-red-500 hover:bg-red-100'
                        : 'bg-emerald/10 text-emerald hover:bg-emerald/20'}`}
                  >
                    {u.is_trusted_payer
                      ? (isRTL ? 'سحب الموثوقية' : 'Remove Trust')
                      : (isRTL ? 'منح الموثوقية' : 'Make Trusted')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <Footer />

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
             onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
               onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-navy text-lg mb-1">
              {isRTL ? 'سبب الرفض' : 'Rejection Reason'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {rejectModal.type === 'listing'
                ? (isRTL ? 'سيُرسل هذا السبب لصاحب الإعلان.' : 'This reason will be sent to the listing owner.')
                : (isRTL ? 'سيُرسل هذا السبب لصاحب طلب التوثيق.' : 'This will be sent to the verification requester.')}
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="input text-sm min-h-[100px] resize-none mb-4"
              dir={isRTL ? 'rtl' : 'ltr'}
              placeholder={isRTL ? 'اكتب سبب الرفض...' : 'Enter rejection reason...'}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 transition">
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-40">
                {isRTL ? 'تأكيد الرفض' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
