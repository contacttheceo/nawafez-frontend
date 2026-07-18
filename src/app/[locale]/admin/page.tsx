'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, LayoutDashboard, FileText, AlertTriangle,
  CheckCircle, XCircle, Clock, DollarSign, TrendingUp, TrendingDown,
  Shield, Eye, EyeOff, Star, Loader2, BarChart2, AlertCircle, Flag,
  Activity, Search, Filter, X, Download, MapPin, Calendar,
  Tag, Mail, Phone, ExternalLink, MessageSquare, Trash2, Edit3,
  Package, CreditCard,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { useAuthStore } from '@/store/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { adminApi } from '@/lib/api';
import AdminPlansTab from '@/components/admin/AdminPlansTab';
import AdminSubscriptionsTab from '@/components/admin/AdminSubscriptionsTab';
import { storageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ── Reject reason templates ─────────────────────────────────────────────── */
const LISTING_REJECT_TEMPLATES = [
  { ar: 'الصور غير واضحة أو غير كافية',          en: 'Images are unclear or insufficient' },
  { ar: 'السعر مبالغ به أو غير منطقي',           en: 'Price is unreasonable' },
  { ar: 'الوصف غير مكتمل أو مضلل',               en: 'Description is incomplete or misleading' },
  { ar: 'الإعلان مكرر من نفس المستخدم',          en: 'Duplicate listing from same user' },
  { ar: 'محتوى غير لائق أو مخالف للشروط',        en: 'Content violates terms' },
  { ar: 'القسم غير مناسب للمحتوى',               en: 'Wrong category for this content' },
  { ar: 'بيانات تواصل غير صالحة',                en: 'Invalid contact information' },
];

const VERIFICATION_REJECT_TEMPLATES = [
  { ar: 'وثيقة السجل التجاري غير واضحة',         en: 'CR document is not clear' },
  { ar: 'رقم السجل التجاري غير مطابق للوثيقة',  en: 'CR number does not match document' },
  { ar: 'الوثيقة منتهية الصلاحية',               en: 'Document has expired' },
  { ar: 'اسم الشركة لا يطابق السجل',             en: 'Company name does not match CR' },
  { ar: 'الوثيقة غير قانونية أو مزوّرة',         en: 'Document appears invalid or forged' },
];

type AdminTab = 'dashboard' | 'analytics' | 'listings' | 'verifications' | 'reports' | 'users' | 'audit' | 'comments' | 'plans' | 'subscriptions';

const SECTION_LABEL: Record<string, string> = {
  fleet: 'أسطول', contracts: 'عقود', ma: 'M&A', jobs: 'وظائف', forum: 'منتدى',
};
const SECTION_LABEL_EN: Record<string, string> = {
  fleet: 'Fleet', contracts: 'Contracts', ma: 'M&A', jobs: 'Jobs', forum: 'Forum',
};

// ─── KPI Card Component ───────────────────────────────────────────────────────
function KPICard({
  title, value, growth, thisWeek, icon, bgClass,
}: {
  title: string; value: string | number; growth?: number | null;
  thisWeek?: number; icon: React.ReactNode; bgClass: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex justify-between items-start mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass}`}>
          {icon}
        </div>
        {growth != null && (
          <span className={`text-xs font-bold flex items-center gap-1 ${growth >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
            {growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-navy">{value ?? '—'}</div>
      <div className="text-xs text-gray-400 mt-1">{title}</div>
      {thisWeek != null && (
        <div className="text-xs text-gray-300 mt-0.5">+{thisWeek} هذا الأسبوع</div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL  = locale === 'ar';
  const { user, isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab]   = useState<AdminTab>('dashboard');
  const [stats, setStats]           = useState<any>(null);
  const [pendingSubsCount, setPendingSubsCount] = useState<number>(0);
  const [listings, setListings]     = useState<any[]>([]);
  const [listingPage, setListingPage] = useState(1);
  const [listingLastPage, setListingLastPage] = useState(1);
  const [listingSearch, setListingSearch] = useState('');
  const [listingSection, setListingSection] = useState('');
  const [listingStatus, setListingStatus] = useState('pending_review');
  const [users, setUsers]           = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole]     = useState('');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reports, setReports]       = useState<any[]>([]);
  const [analytics, setAnalytics]   = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [rejectModal, setRejectModal] = useState<{ type: 'listing' | 'verification'; id: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  /* ── Preview modals ── */
  const [crPreview, setCrPreview]           = useState<{ url: string; name: string; cr: string } | null>(null);
  const [listingPreview, setListingPreview] = useState<any | null>(null);
  const [listingPreviewLoading, setListingPreviewLoading] = useState(false);
  const [userDetail, setUserDetail]         = useState<any | null>(null);

  /* ── Pagination for users + reports ── */
  const [userPage, setUserPage]         = useState(1);
  const [userLastPage, setUserLastPage] = useState(1);
  const [reportPage, setReportPage]     = useState(1);
  const [reportLastPage, setReportLastPage] = useState(1);

  /* ── Phase 2: Bulk selection on listings tab ── */
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkRejectModal, setBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  /* ── Phase 2: User suspend/delete modals ── */
  const [suspendModal, setSuspendModal] = useState<{ user: any } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendBusy, setSuspendBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ user: any } | null>(null);

  /* ── Phase 2: Audit Log tab ── */
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLastPage, setAuditLastPage] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('');

  /* ── Forum: Comments moderation tab ── */
  const [comments, setComments] = useState<any[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsLastPage, setCommentsLastPage] = useState(1);
  const [commentsReportedOnly, setCommentsReportedOnly] = useState(false);
  const [commentsSearch, setCommentsSearch] = useState('');

  // Guard: only admin
  useEffect(() => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    if (user?.role !== 'admin') { router.push(`/${locale}`); return; }
  }, [isAuthenticated, user, locale, router]);

  // Load dashboard stats
  useEffect(() => {
    if (user?.role !== 'admin') return;
    adminApi.getDashboard().then(setStats).catch(() => {});
    // Fetch pending subscription requests count for the tab badge
    import('@/lib/api').then(({ adminSubscriptionApi }) =>
      adminSubscriptionApi.pending()
        .then((r: any) => setPendingSubsCount((r.data ?? []).length))
        .catch(() => setPendingSubsCount(0))
    );
  }, [user]);

  // Load analytics (lazy — first time tab is opened)
  const loadAnalytics = useCallback(async () => {
    if (analytics) return;
    setAnalyticsLoading(true);
    try {
      const res = await adminApi.getAnalytics();
      setAnalytics(res);
    } catch {
      toast.error(isRTL ? 'فشل تحميل التحليلات' : 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analytics, isRTL]);

  // Load listings
  const loadListings = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page };
      if (listingStatus)  params.status  = listingStatus;
      if (listingSection) params.section = listingSection;
      if (listingSearch)  params.search  = listingSearch;
      const res: any = await adminApi.getListings(params);
      setListings(res.data ?? []);
      setListingLastPage(res.last_page ?? 1);
    } catch {
      toast.error(isRTL ? 'فشل التحميل' : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [listingStatus, listingSection, listingSearch, isRTL]);

  // Load users (paginated)
  const loadUsers = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res: any = await adminApi.getUsers({ search: userSearch, role: userRole, page });
      setUsers(res.data ?? []);
      setUserLastPage(res.last_page ?? 1);
    } catch {
      toast.error(isRTL ? 'فشل التحميل' : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [userSearch, userRole, isRTL]);

  // Load comments (paginated)
  const loadComments = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const params: any = { page };
      if (commentsReportedOnly) params.reported = 1;
      if (commentsSearch)       params.search   = commentsSearch;
      const res: any = await adminApi.getComments(params);
      setComments(res.data ?? []);
      setCommentsLastPage(res.last_page ?? 1);
    } catch {
      toast.error(isRTL ? 'فشل تحميل التعليقات' : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [commentsReportedOnly, commentsSearch, isRTL]);

  // Load audit logs (paginated)
  const loadAuditLogs = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page };
      if (auditActionFilter) params.action = auditActionFilter;
      const res: any = await adminApi.getAuditLogs(params);
      setAuditLogs(res.data ?? []);
      setAuditLastPage(res.last_page ?? 1);
    } catch {
      toast.error(isRTL ? 'فشل تحميل سجل التدقيق' : 'Failed to load audit log');
    } finally {
      setIsLoading(false);
    }
  }, [auditActionFilter, isRTL]);

  // Load reports (paginated)
  const loadReports = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res: any = await adminApi.getReports({ page });
      setReports(res.data ?? []);
      setReportLastPage(res.last_page ?? 1);
    } catch {
      toast.error(isRTL ? 'فشل التحميل' : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [isRTL]);

  // Tab effect
  useEffect(() => {
    if (user?.role !== 'admin') return;
    if (activeTab === 'listings')      loadListings(1);
    if (activeTab === 'users')         { setUserPage(1); loadUsers(1); }
    if (activeTab === 'verifications') {
      setIsLoading(true);
      adminApi.getVerifications()
        .then((res: any) => setVerifications(res.data ?? []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
    if (activeTab === 'reports')       { setReportPage(1); loadReports(1); }
    if (activeTab === 'audit')         { setAuditPage(1); loadAuditLogs(1); }
    if (activeTab === 'comments')      { setCommentsPage(1); loadComments(1); }
    if (activeTab === 'analytics') loadAnalytics();
  }, [activeTab, user]);

  // Re-load listings when filters change (clear bulk selection on filter change)
  useEffect(() => {
    if (activeTab === 'listings' && user?.role === 'admin') {
      setListingPage(1);
      setSelectedIds(new Set());
      loadListings(1);
    }
  }, [listingStatus, listingSection, listingSearch]);

  // Re-load audit logs when filter changes
  useEffect(() => {
    if (activeTab === 'audit' && user?.role === 'admin') {
      setAuditPage(1);
      loadAuditLogs(1);
    }
  }, [auditActionFilter]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const approveListing = async (id: number) => {
    try {
      await adminApi.approveListing(id);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active' } : l));
      toast.success(isRTL ? 'تم قبول الإعلان' : 'Listing approved');
    } catch { toast.error(isRTL ? 'حدث خطأ' : 'Error'); }
  };

  const toggleFeatured = async (id: number, current: boolean) => {
    try {
      await adminApi.toggleFeatured(id);
      setListings(prev => prev.map(l => l.id === id ? { ...l, is_featured: !current } : l));
    } catch { toast.error(isRTL ? 'حدث خطأ' : 'Error'); }
  };

  // Hide pulls the listing off the public site silently. Owner not notified.
  const toggleHidden = async (id: number, currentStatus: string) => {
    const isHidden = currentStatus === 'hidden';
    try {
      if (isHidden) {
        await adminApi.unhideListing(id);
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active' } : l));
        toast.success(isRTL ? 'تم إعادة العرض' : 'Listing visible');
      } else {
        await adminApi.hideListing(id);
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'hidden' } : l));
        toast.success(isRTL ? 'تم الإخفاء' : 'Listing hidden');
      }
    } catch { toast.error(isRTL ? 'حدث خطأ' : 'Error'); }
  };

  const deleteListing = async (id: number) => {
    if (!confirm(isRTL
      ? 'هل تريد حذف الإعلان نهائياً؟ يمكن استعادته من DB لاحقاً.'
      : 'Delete this listing? It can be restored from the database later.')) return;
    try {
      await adminApi.deleteListing(id);
      setListings(prev => prev.filter(l => l.id !== id));
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
    } catch { toast.error(isRTL ? 'حدث خطأ' : 'Error'); }
  };

  const approveVerification = async (id: number) => {
    try {
      await adminApi.approveVerification(id);
      setVerifications(prev => prev.filter(v => v.id !== id));
      toast.success(isRTL ? 'تم قبول التوثيق' : 'Verification approved');
    } catch { toast.error(isRTL ? 'حدث خطأ' : 'Error'); }
  };

  const resolveReport = async (id: number) => {
    try {
      await adminApi.resolveReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      toast.success(isRTL ? 'تم حل البلاغ' : 'Report resolved');
    } catch { toast.error(isRTL ? 'حدث خطأ' : 'Error'); }
  };

  const toggleTrustedPayer = async (id: number) => {
    try {
      await adminApi.toggleTrustedPayer(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_trusted_payer: !u.is_trusted_payer } : u));
    } catch { toast.error(isRTL ? 'حدث خطأ' : 'Error'); }
  };

  const manuallyVerifyEmail = async (id: number, email: string) => {
    if (!confirm(isRTL
      ? `تأكيد التحقق اليدوي من بريد ${email}؟ هذا يُلتفّ على إرسال إيميل التحقق.`
      : `Manually verify ${email}? This bypasses the verification email entirely.`)) return;
    try {
      await adminApi.manuallyVerifyEmail(id);
      setUsers(prev => prev.map(u => u.id === id
        ? { ...u, email_verified_at: new Date().toISOString() } : u));
      toast.success(isRTL ? 'تم التحقق ✓' : 'Verified ✓');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'فشل التحقق' : 'Verify failed'));
    }
  };

  const adminResendVerification = async (id: number, email: string) => {
    try {
      const res: any = await adminApi.adminResendVerification(id);
      toast.success(res?.message ?? (isRTL
        ? `تم إرسال رابط التحقق إلى ${email}`
        : `Verification link sent to ${email}`));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'فشل الإرسال' : 'Resend failed'));
    }
  };

  const activateAccountWithWelcome = async (id: number, email: string) => {
    if (!confirm(isRTL
      ? `تفعيل حساب ${email} وإرسال إيميل ترحيبي بالميزات والإحالة؟`
      : `Activate ${email} and send the welcome+features email?`)) return;
    try {
      const res: any = await adminApi.activateAccount(id);
      setUsers(prev => prev.map(u => u.id === id
        ? { ...u, email_verified_at: u.email_verified_at ?? new Date().toISOString() }
        : u));
      toast.success(res?.message ?? (isRTL
        ? `✓ تم تفعيل ${email}`
        : `✓ Activated ${email}`),
        { duration: 5000 });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'فشل التفعيل' : 'Activate failed'));
    }
  };

  /* ── Forum: Comment moderation handlers ────────────────────────────────── */
  const handleMarkCommentOfficial = async (commentId: number, currentlyOfficial: boolean) => {
    try {
      if (currentlyOfficial) {
        await adminApi.unmarkCommentOfficial(commentId);
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, is_official_answer: false } : c));
      } else {
        await adminApi.markCommentOfficial(commentId);
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, is_official_answer: true } : c));
      }
      toast.success(isRTL ? '✓' : '✓');
    } catch {
      toast.error(isRTL ? 'فشل' : 'Failed');
    }
  };

  const handleAdminDeleteComment = async (commentId: number) => {
    if (!confirm(isRTL ? 'حذف هذا التعليق نهائياً؟' : 'Delete this comment permanently?')) return;
    try {
      await adminApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
    } catch {
      toast.error(isRTL ? 'فشل الحذف' : 'Delete failed');
    }
  };

  /* ── Phase 2: Bulk action handlers ─────────────────────────────────────── */
  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev =>
      prev.size === listings.length ? new Set() : new Set(listings.map(l => l.id))
    );
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const res: any = await adminApi.bulkApproveListings(Array.from(selectedIds));
      toast.success(res?.message ?? (isRTL ? 'تم قبول الإعلانات' : 'Listings approved'));
      setSelectedIds(new Set());
      loadListings(listingPage);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'فشل القبول الجماعي' : 'Bulk approve failed'));
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0 || !bulkRejectReason.trim()) return;
    setBulkBusy(true);
    try {
      const res: any = await adminApi.bulkRejectListings(Array.from(selectedIds), bulkRejectReason);
      toast.success(res?.message ?? (isRTL ? 'تم رفض الإعلانات' : 'Listings rejected'));
      setSelectedIds(new Set());
      setBulkRejectModal(false);
      setBulkRejectReason('');
      loadListings(listingPage);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'فشل الرفض الجماعي' : 'Bulk reject failed'));
    } finally {
      setBulkBusy(false);
    }
  };

  /* ── Phase 2: Suspend / Delete user ────────────────────────────────────── */
  const handleSuspend = async () => {
    if (!suspendModal || !suspendReason.trim()) return;
    setSuspendBusy(true);
    try {
      await adminApi.suspendUser(suspendModal.user.id, suspendReason);
      toast.success(isRTL ? 'تم تعليق الحساب' : 'User suspended');
      setUsers(prev => prev.map(u => u.id === suspendModal.user.id
        ? { ...u, suspended_at: new Date().toISOString(), suspend_reason: suspendReason }
        : u));
      if (userDetail?.id === suspendModal.user.id) {
        setUserDetail({ ...userDetail, suspended_at: new Date().toISOString(), suspend_reason: suspendReason });
      }
      setSuspendModal(null);
      setSuspendReason('');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'فشل التعليق' : 'Suspend failed'));
    } finally {
      setSuspendBusy(false);
    }
  };

  const handleUnsuspend = async (u: any) => {
    try {
      await adminApi.unsuspendUser(u.id);
      toast.success(isRTL ? 'تم إلغاء التعليق' : 'Unsuspended');
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, suspended_at: null, suspend_reason: null } : x));
      if (userDetail?.id === u.id) setUserDetail({ ...userDetail, suspended_at: null, suspend_reason: null });
    } catch {
      toast.error(isRTL ? 'فشل' : 'Failed');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    try {
      await adminApi.deleteUser(deleteConfirm.user.id);
      toast.success(isRTL ? 'تم حذف الحساب' : 'User deleted');
      setUsers(prev => prev.filter(u => u.id !== deleteConfirm.user.id));
      if (userDetail?.id === deleteConfirm.user.id) setUserDetail(null);
      setDeleteConfirm(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isRTL ? 'فشل الحذف' : 'Delete failed'));
    }
  };

  /* ── Preview helpers ───────────────────────────────────────────────────── */
  const openCrPreview = (v: any) => {
    const bv = v.business_verification ?? {};
    // Backend stores the path under `document`; legacy field was `cr_image_path`
    const path = bv.document ?? bv.cr_image_path ?? null;
    if (!path) {
      toast.error(isRTL ? 'لم يتم رفع وثيقة' : 'No document uploaded');
      return;
    }
    const url = storageUrl(path);
    if (!url) {
      toast.error(isRTL ? 'رابط الوثيقة غير صالح' : 'Invalid document URL');
      return;
    }
    setCrPreview({
      url,
      name: (isRTL ? v.name_ar : v.name_en) ?? bv.company_name ?? '—',
      cr:   bv.cr_number ?? '—',
    });
  };

  const openListingPreview = async (id: number) => {
    setListingPreviewLoading(true);
    setListingPreview({ id, loading: true });
    try {
      const { listingsApi } = await import('@/lib/api');
      const res: any = await listingsApi.getOne(id);
      setListingPreview(res.data ?? res);
    } catch {
      toast.error(isRTL ? 'فشل تحميل الإعلان' : 'Failed to load listing');
      setListingPreview(null);
    } finally {
      setListingPreviewLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    try {
      if (rejectModal.type === 'listing') {
        await adminApi.rejectListing(rejectModal.id, rejectReason);
        setListings(prev => prev.map(l => l.id === rejectModal.id ? { ...l, status: 'rejected' } : l));
        toast.success(isRTL ? 'تم رفض الإعلان' : 'Listing rejected');
      } else {
        await adminApi.rejectVerification(rejectModal.id, rejectReason);
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
    { id: 'dashboard',     labelAr: 'لوحة البيانات', labelEn: 'Dashboard',     Icon: LayoutDashboard },
    { id: 'analytics',     labelAr: 'التحليلات',     labelEn: 'Analytics',     Icon: BarChart2       },
    { id: 'listings',      labelAr: 'الإعلانات',     labelEn: 'Listings',      Icon: FileText        },
    { id: 'verifications', labelAr: 'التوثيقات',     labelEn: 'Verifications', Icon: Shield          },
    { id: 'reports',       labelAr: 'البلاغات',      labelEn: 'Reports',       Icon: AlertTriangle   },
    { id: 'users',         labelAr: 'المستخدمون',    labelEn: 'Users',         Icon: Users           },
    { id: 'audit',         labelAr: 'سجل التدقيق',   labelEn: 'Audit Log',     Icon: Activity        },
    { id: 'comments',      labelAr: 'التعليقات',     labelEn: 'Comments',      Icon: MessageSquare   },
    { id: 'subscriptions', labelAr: 'الاشتراكات',    labelEn: 'Subscriptions', Icon: CreditCard      },
    { id: 'plans',         labelAr: 'الباقات',       labelEn: 'Plans',         Icon: Package         },
  ] as const;

  // Chart data builders
  const sectionChartData = stats ? [
    { name: isRTL ? 'أسطول' : 'Fleet',     value: stats.listings?.sections?.fleet     ?? 0 },
    { name: isRTL ? 'عقود' : 'Contracts',  value: stats.listings?.sections?.contracts ?? 0 },
    { name: isRTL ? 'وظائف' : 'Jobs',      value: stats.listings?.sections?.jobs      ?? 0 },
    { name: 'M&A',                          value: stats.listings?.sections?.ma        ?? 0 },
    { name: isRTL ? 'منتدى' : 'Forum',     value: stats.listings?.sections?.forum     ?? 0 },
  ] : [];

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
            <p className="text-xs text-gray-500">نوافذ لوجستيك — Nwafiz</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
          {tabConfig.map(({ id, labelAr, labelEn, Icon }) => {
            const badge =
              id === 'listings'      ? (stats?.listings?.pending_review || null) :
              id === 'reports'       ? (stats?.reports?.pending || null) :
              id === 'verifications' ? (verifications.length || null) :
              id === 'subscriptions' ? (pendingSubsCount || null) : null;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as AdminTab)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                            whitespace-nowrap transition flex-shrink-0
                            ${activeTab === id ? 'bg-navy text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon size={15} />
                {isRTL ? labelAr : labelEn}
                {badge != null && badge > 0 && (
                  <span className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center
                                    ${activeTab === id ? 'bg-white text-navy' : 'bg-red-500 text-white'}`}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: DASHBOARD
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {!stats ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-navy" size={32} />
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title={isRTL ? 'إجمالي المستخدمين' : 'Total Users'}
                    value={(stats.users?.total ?? 0).toLocaleString()}
                    growth={stats.users?.growth_pct}
                    thisWeek={stats.users?.this_week}
                    icon={<Users size={18} className="text-blue-600" />}
                    bgClass="bg-blue-100"
                  />
                  <KPICard
                    title={isRTL ? 'إعلانات نشطة' : 'Active Listings'}
                    value={(stats.listings?.active ?? 0).toLocaleString()}
                    growth={stats.listings?.growth_pct}
                    thisWeek={stats.listings?.this_week}
                    icon={<FileText size={18} className="text-emerald-600" />}
                    bgClass="bg-emerald-100"
                  />
                  <KPICard
                    title={isRTL ? 'بانتظار المراجعة' : 'Pending Review'}
                    value={stats.listings?.pending_review ?? 0}
                    icon={<Clock size={18} className="text-amber-600" />}
                    bgClass="bg-amber-100"
                  />
                  <KPICard
                    title={isRTL ? 'إيرادات الشهر (ر.س)' : 'Monthly Revenue (SAR)'}
                    value={(stats.revenue?.this_month ?? 0).toLocaleString()}
                    icon={<DollarSign size={18} className="text-purple-600" />}
                    bgClass="bg-purple-100"
                  />
                </div>

                {/* Quick Actions */}
                {(stats.listings?.pending_review > 0 || stats.reports?.pending > 0) && (
                  <div className="flex flex-wrap gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="w-full text-xs font-bold text-amber-700 flex items-center gap-1.5">
                      <AlertCircle size={13} />
                      {isRTL ? 'يحتاج انتباهك الآن' : 'Needs your attention'}
                    </p>
                    {stats.listings?.pending_review > 0 && (
                      <button
                        onClick={() => { setActiveTab('listings'); setListingStatus('pending_review'); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy/90 transition"
                      >
                        <Clock size={13} />
                        {stats.listings.pending_review} {isRTL ? 'إعلان قيد المراجعة' : 'pending listings'}
                      </button>
                    )}
                    {stats.reports?.pending > 0 && (
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition"
                      >
                        <Flag size={13} />
                        {stats.reports.pending} {isRTL ? 'بلاغ معلق' : 'pending reports'}
                      </button>
                    )}
                  </div>
                )}

                {/* Section Distribution Chart + Today Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart — listings by section */}
                  <div className="card p-5">
                    <p className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                      <BarChart2 size={16} />
                      {isRTL ? 'الإعلانات النشطة بالقسم' : 'Active Listings by Section'}
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={sectionChartData} barSize={32}>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          cursor={{ fill: '#f3f4f6' }}
                        />
                        <Bar dataKey="value" fill="#526483" radius={[6, 6, 0, 0]}
                          label={{ position: 'top', fontSize: 11, fill: '#6b7280' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Today + Revenue + Business Users */}
                  <div className="space-y-4">
                    <div className="card p-5">
                      <p className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5">
                        <TrendingUp size={13} /> {isRTL ? 'إحصائيات اليوم' : "Today's Stats"}
                      </p>
                      <div className="space-y-2.5">
                        {[
                          { label: isRTL ? 'مستخدمون جدد' : 'New users',    value: stats.users?.new_today },
                          { label: isRTL ? 'إعلانات جديدة' : 'New listings', value: stats.listings?.new_today },
                          { label: isRTL ? 'حسابات تجارية' : 'Business accounts', value: stats.users?.business },
                        ].map(item => (
                          <div key={item.label} className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">{item.label}</span>
                            <span className="font-black text-navy">{item.value ?? 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card p-5">
                      <p className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5">
                        <DollarSign size={13} className="text-emerald-500" />
                        {isRTL ? 'الإيرادات' : 'Revenue'}
                      </p>
                      <div className="space-y-2.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{isRTL ? 'هذا الشهر' : 'This month'}</span>
                          <span className="font-black text-emerald-500">
                            {(stats.revenue?.this_month ?? 0).toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{isRTL ? 'الإجمالي الكلي' : 'Total'}</span>
                          <span className="font-black text-navy">
                            {(stats.revenue?.total_sar ?? 0).toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="card p-5">
                  <p className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                    <Activity size={16} />
                    {isRTL ? 'آخر الأحداث' : 'Recent Activity'}
                  </p>
                  {(stats.recent_activity ?? []).length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">
                      {isRTL ? 'لا توجد أحداث بعد' : 'No recent activity'}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(stats.recent_activity ?? []).map((event: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                          <span className="text-lg shrink-0">{event.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-navy font-medium truncate">
                              {isRTL ? event.text_ar : event.text_en}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(event.time).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: ANALYTICS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-navy" size={32} />
              </div>
            ) : !analytics ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-navy" size={32} />
              </div>
            ) : (
              <>
                {/* Line Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Users daily */}
                  <div className="card p-5">
                    <p className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                      <Users size={15} />
                      {isRTL ? 'تسجيلات المستخدمين — آخر 30 يوم' : 'User Registrations — Last 30 Days'}
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analytics.users_daily ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d: string) => d.slice(5)}
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          axisLine={false} tickLine={false}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <Line type="monotone" dataKey="count" stroke="#526483" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Listings daily */}
                  <div className="card p-5">
                    <p className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                      <FileText size={15} />
                      {isRTL ? 'الإعلانات المنشورة — آخر 30 يوم' : 'Listings Published — Last 30 Days'}
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.listings_daily ?? []} barSize={8}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d: string) => d.slice(5)}
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          axisLine={false} tickLine={false}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" fill="#0D9B6C" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Revenue Monthly + Section Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue chart */}
                  <div className="card p-5">
                    <p className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                      <DollarSign size={15} />
                      {isRTL ? 'الإيرادات الشهرية (ر.س)' : 'Monthly Revenue (SAR)'}
                    </p>
                    {(analytics.revenue_monthly ?? []).length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-10">
                        {isRTL ? 'لا توجد بيانات إيرادات بعد' : 'No revenue data yet'}
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analytics.revenue_monthly} barSize={24}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(v: any) => [`${Number(v).toLocaleString()} ${isRTL ? 'ر.س' : 'SAR'}`, '']}
                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="total" fill="#a855f7" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Section performance */}
                  <div className="card p-5">
                    <p className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                      <BarChart2 size={15} />
                      {isRTL ? 'أداء الأقسام' : 'Section Performance'}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="pb-2 text-start text-gray-400 font-medium">{isRTL ? 'القسم' : 'Section'}</th>
                            <th className="pb-2 text-center text-emerald-500 font-medium">{isRTL ? 'نشط' : 'Active'}</th>
                            <th className="pb-2 text-center text-amber-500 font-medium">{isRTL ? 'مراجعة' : 'Pending'}</th>
                            <th className="pb-2 text-center text-gray-400 font-medium">{isRTL ? 'مشاهدات' : 'Views'}</th>
                            <th className="pb-2 text-center text-gray-400 font-medium">{isRTL ? 'عروض' : 'Bids'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(analytics.section_stats ?? {}).map(([sec, data]: any) => (
                            <tr key={sec} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2 font-bold text-navy">
                                {isRTL ? SECTION_LABEL[sec] : SECTION_LABEL_EN[sec]}
                              </td>
                              <td className="py-2 text-center font-bold text-emerald-500">{data.active}</td>
                              <td className="py-2 text-center font-bold text-amber-500">{data.pending}</td>
                              <td className="py-2 text-center text-gray-600">{(data.total_views ?? 0).toLocaleString()}</td>
                              <td className="py-2 text-center text-gray-600">{data.total_bids ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Top Listings by Views */}
                <div className="card p-5">
                  <p className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                    <Eye size={15} />
                    {isRTL ? 'أعلى الإعلانات مشاهدةً' : 'Top Listings by Views'}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-2 text-start text-gray-400 font-medium">{isRTL ? 'الإعلان' : 'Listing'}</th>
                          <th className="pb-2 text-center text-gray-400 font-medium">{isRTL ? 'القسم' : 'Section'}</th>
                          <th className="pb-2 text-center text-gray-400 font-medium">{isRTL ? 'المدينة' : 'City'}</th>
                          <th className="pb-2 text-center text-gray-400 font-medium">{isRTL ? 'مشاهدات' : 'Views'}</th>
                          <th className="pb-2 text-center text-gray-400 font-medium">{isRTL ? 'السعر' : 'Price'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analytics.top_listings ?? []).map((l: any) => (
                          <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2.5">
                              <Link href={`/${locale}/listings/${l.id}`}
                                className="font-medium text-navy hover:underline truncate max-w-[200px] block">
                                {isRTL ? l.title_ar : (l.title_en || l.title_ar)}
                              </Link>
                            </td>
                            <td className="py-2.5 text-center">
                              <span className="text-xs bg-navy/10 text-navy px-2 py-0.5 rounded-full">
                                {isRTL ? SECTION_LABEL[l.section] : SECTION_LABEL_EN[l.section]}
                              </span>
                            </td>
                            <td className="py-2.5 text-center text-gray-500 text-xs">{l.city || '—'}</td>
                            <td className="py-2.5 text-center font-black text-navy">
                              {(l.views_count ?? 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 text-center text-gray-500 text-xs">
                              {l.price ? `${Number(l.price).toLocaleString()} ${isRTL ? 'ر.س' : 'SAR'}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cities Breakdown */}
                <div className="card p-5">
                  <p className="text-sm font-bold text-navy mb-5 flex items-center gap-2">
                    <Activity size={15} />
                    {isRTL ? 'أكثر المدن نشاطاً' : 'Most Active Cities'}
                  </p>
                  <div className="space-y-3">
                    {(analytics.cities_breakdown ?? []).map((c: any, i: number) => {
                      const max = analytics.cities_breakdown[0]?.count ?? 1;
                      const pct = Math.round((c.count / max) * 100);
                      return (
                        <div key={c.city} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-4 text-end">{i + 1}</span>
                          <div className="w-20 text-sm font-medium text-navy shrink-0">{c.city}</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-navy to-navy/60 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="text-sm font-bold w-8 text-end text-navy">{c.count}</div>
                        </div>
                      );
                    })}
                    {(analytics.cities_breakdown ?? []).length === 0 && (
                      <p className="text-gray-400 text-sm text-center py-4">
                        {isRTL ? 'لا توجد بيانات بعد' : 'No data yet'}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: LISTINGS MODERATION
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="card p-4 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  value={listingSearch}
                  onChange={e => setListingSearch(e.target.value)}
                  placeholder={isRTL ? 'بحث في العنوان...' : 'Search title...'}
                  className="input text-sm ps-9 py-2"
                />
              </div>
              <select
                value={listingSection}
                onChange={e => setListingSection(e.target.value)}
                className="input text-sm py-2 flex-shrink-0"
              >
                <option value="">{isRTL ? 'كل الأقسام' : 'All sections'}</option>
                <option value="fleet">{isRTL ? 'أسطول' : 'Fleet'}</option>
                <option value="contracts">{isRTL ? 'عقود' : 'Contracts'}</option>
                <option value="ma">M&A</option>
                <option value="jobs">{isRTL ? 'وظائف' : 'Jobs'}</option>
                <option value="forum">{isRTL ? 'منتدى' : 'Forum'}</option>
              </select>
              <select
                value={listingStatus}
                onChange={e => setListingStatus(e.target.value)}
                className="input text-sm py-2 flex-shrink-0"
              >
                <option value="pending_review">{isRTL ? 'قيد المراجعة' : 'Pending Review'}</option>
                <option value="active">{isRTL ? 'نشط' : 'Active'}</option>
                <option value="rejected">{isRTL ? 'مرفوض' : 'Rejected'}</option>
                <option value="">{isRTL ? 'الكل' : 'All'}</option>
              </select>
            </div>

            {/* Bulk Action Bar (shown when items selected) */}
            {selectedIds.size > 0 && (
              <div className="card p-3 bg-navy text-white flex items-center justify-between gap-3 flex-wrap sticky top-2 z-10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">
                    {isRTL ? `${selectedIds.size} محدد` : `${selectedIds.size} selected`}
                  </span>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-white/60 hover:text-white underline"
                  >
                    {isRTL ? 'إلغاء التحديد' : 'Clear'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkApprove}
                    disabled={bulkBusy}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald hover:bg-emerald-dark rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    {bulkBusy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    {isRTL ? 'قبول الكل' : 'Approve all'}
                  </button>
                  <button
                    onClick={() => setBulkRejectModal(true)}
                    disabled={bulkBusy}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    <XCircle size={12} />
                    {isRTL ? 'رفض الكل' : 'Reject all'}
                  </button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" size={28} /></div>
            ) : listings.length === 0 ? (
              <div className="card p-10 text-center">
                <Filter size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-semibold text-sm mb-1">
                  {isRTL ? 'لا توجد إعلانات بهذه الفلاتر' : 'No listings match these filters'}
                </p>
                {listingStatus === 'pending_review' && (
                  <>
                    <p className="text-gray-400 text-xs mb-4">
                      {isRTL
                        ? 'كل الإعلانات تمت مراجعتها — لا يوجد ما يحتاج لقرارك.'
                        : "All caught up — no listings waiting for review."}
                    </p>
                    <button
                      onClick={() => setListingStatus('active')}
                      className="text-xs text-emerald font-bold hover:underline"
                    >
                      {isRTL ? '← اعرض الإعلانات النشطة' : 'View active listings →'}
                    </button>
                  </>
                )}
                {listingStatus && listingStatus !== 'pending_review' && (
                  <button
                    onClick={() => { setListingStatus(''); setListingSection(''); setListingSearch(''); }}
                    className="text-xs text-emerald font-bold hover:underline mt-2"
                  >
                    {isRTL ? 'مسح الفلاتر' : 'Clear all filters'}
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Select-all header (only shown when there are items) */}
                {listings.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === listings.length && listings.length > 0}
                      ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < listings.length; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-emerald rounded cursor-pointer"
                    />
                    <span>{isRTL ? 'تحديد الكل' : 'Select all'}</span>
                  </div>
                )}
                <div className="space-y-2">
                  {listings.map((listing: any) => (
                    <div key={listing.id} className={`card p-4 flex items-start gap-3 transition
                      ${selectedIds.has(listing.id) ? 'ring-2 ring-emerald bg-emerald/5' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(listing.id)}
                        onChange={() => toggleSelection(listing.id)}
                        className="w-4 h-4 accent-emerald rounded mt-1 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => openListingPreview(listing.id)}
                            className="font-bold text-navy hover:underline text-sm text-start"
                          >
                            {isRTL ? listing.title_ar : (listing.title_en || listing.title_ar)}
                          </button>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${listing.status === 'active'         ? 'bg-emerald-100 text-emerald-600' :
                              listing.status === 'pending_review' ? 'bg-amber-100 text-amber-600' :
                              listing.status === 'rejected'       ? 'bg-red-100 text-red-600' :
                              listing.status === 'hidden'         ? 'bg-gray-200 text-gray-600' :
                                                                   'bg-gray-100 text-gray-500'}`}>
                            {listing.status === 'active' ? (isRTL ? 'نشط' : 'Active') :
                             listing.status === 'pending_review' ? (isRTL ? 'قيد المراجعة' : 'Pending') :
                             listing.status === 'rejected' ? (isRTL ? 'مرفوض' : 'Rejected') :
                             listing.status === 'hidden' ? (isRTL ? 'مخفي' : 'Hidden') : listing.status}
                          </span>
                          {listing.is_featured && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              ⭐ {isRTL ? 'مميز' : 'Featured'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {isRTL ? SECTION_LABEL[listing.section] : SECTION_LABEL_EN[listing.section]}
                          {listing.city ? ` · ${listing.city}` : ''}
                          {listing.user ? ` · ${isRTL ? listing.user.name_ar : listing.user.name_en}` : ''}
                          {listing.views_count ? ` · ${listing.views_count} ${isRTL ? 'مشاهدة' : 'views'}` : ''}
                        </p>
                        {listing.rejection_reason && (
                          <p className="text-xs text-red-400 mt-0.5">
                            {isRTL ? 'سبب الرفض: ' : 'Rejection reason: '}{listing.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Link href={`/${locale}/listings/${listing.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition" title={isRTL ? 'عرض' : 'View'}>
                          <Eye size={15} className="text-gray-500" />
                        </Link>
                        <button
                          onClick={() => toggleFeatured(listing.id, listing.is_featured)}
                          className={`p-2 rounded-lg transition ${listing.is_featured ? 'bg-yellow-50 text-yellow-600' : 'hover:bg-gray-100 text-gray-300 hover:text-gray-500'}`}
                          title={isRTL ? 'تمييز' : 'Feature'}
                        >
                          <Star size={15} />
                        </button>
                        {listing.status !== 'active' && (
                          <button onClick={() => approveListing(listing.id)}
                            className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-500 transition"
                            title={isRTL ? 'قبول' : 'Approve'}>
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {listing.status !== 'rejected' && (
                          <button onClick={() => { setRejectReason(''); setRejectModal({ type: 'listing', id: listing.id }); }}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition"
                            title={isRTL ? 'رفض' : 'Reject'}>
                            <XCircle size={15} />
                          </button>
                        )}

                        {/* Hide / Unhide — silent moderation (no email to owner) */}
                        <button onClick={() => toggleHidden(listing.id, listing.status)}
                          className={`p-2 rounded-lg transition ${listing.status === 'hidden' ? 'bg-gray-100 text-gray-600' : 'hover:bg-gray-50 text-gray-400'}`}
                          title={listing.status === 'hidden' ? (isRTL ? 'إعادة العرض' : 'Unhide') : (isRTL ? 'إخفاء' : 'Hide')}>
                          {listing.status === 'hidden' ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>

                        {/* Edit — opens the owner-facing edit form. Admin
                            session can edit anyone's listing because the
                            page itself checks ownership OR role==admin. */}
                        <Link href={`/${locale}/listings/${listing.id}/edit`}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition"
                          title={isRTL ? 'تعديل' : 'Edit'}>
                          <Edit3 size={15} />
                        </Link>

                        {/* Delete — soft delete, restorable from DB */}
                        <button onClick={() => deleteListing(listing.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition"
                          title={isRTL ? 'حذف نهائي' : 'Delete'}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {listingLastPage > 1 && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <button
                      onClick={() => { const p = listingPage - 1; setListingPage(p); loadListings(p); }}
                      disabled={listingPage === 1}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition font-medium"
                    >
                      {isRTL ? 'السابق →' : '← Prev'}
                    </button>
                    <span className="text-sm text-gray-500 font-medium">
                      {listingPage} / {listingLastPage}
                    </span>
                    <button
                      onClick={() => { const p = listingPage + 1; setListingPage(p); loadListings(p); }}
                      disabled={listingPage === listingLastPage}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition font-medium"
                    >
                      {isRTL ? '← التالي' : 'Next →'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4: VERIFICATIONS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'verifications' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" size={28} /></div>
            ) : verifications.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                <CheckCircle size={32} className="mx-auto mb-2 text-emerald-300" />
                {isRTL ? 'لا توجد طلبات توثيق معلقة' : 'No pending verifications'}
              </div>
            ) : verifications.map((v: any) => (
              <div key={v.id} className="card p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-navy/10 rounded-full flex items-center justify-center shrink-0">
                    <Shield size={18} className="text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy text-sm">
                      {isRTL ? v.name_ar : v.name_en}
                    </p>
                    <p className="text-xs text-gray-400">{v.email}</p>
                    {v.business_verification?.cr_number && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        CR: {v.business_verification.cr_number}
                      </p>
                    )}
                  </div>
                  {(v.business_verification?.document || v.business_verification?.cr_image_path) && (
                    <button
                      onClick={() => openCrPreview(v)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald/10 text-emerald
                                 rounded-lg text-xs font-bold hover:bg-emerald/20 transition flex-shrink-0"
                    >
                      <FileText size={12} />
                      {isRTL ? 'عرض الوثيقة' : 'View Doc'}
                    </button>
                  )}
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => approveVerification(v.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600
                                 rounded-xl text-xs font-bold hover:bg-emerald-100 transition">
                      <CheckCircle size={13} /> {isRTL ? 'قبول' : 'Approve'}
                    </button>
                    <button onClick={() => { setRejectReason(''); setRejectModal({ type: 'verification', id: v.id }); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500
                                 rounded-xl text-xs font-bold hover:bg-red-100 transition">
                      <XCircle size={13} /> {isRTL ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 5: REPORTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" size={28} /></div>
            ) : reports.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                <CheckCircle size={32} className="mx-auto mb-2 text-emerald-300" />
                {isRTL ? 'لا توجد بلاغات معلقة' : 'No pending reports'}
              </div>
            ) : reports.map((r: any) => {
              const resolved = r.data?.resolved;
              return (
                <div key={r.id} className={`card p-4 flex items-start gap-4 ${resolved ? 'opacity-60' : ''}`}>
                  <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-navy text-sm">{r.data?.reason ?? '—'}</p>
                      {r.listing_id && (
                        <Link href={`/${locale}/listings/${r.listing_id}`}
                          className="text-xs text-emerald hover:underline">
                          #{r.listing_id}
                        </Link>
                      )}
                      {resolved && (
                        <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                          {isRTL ? 'تم الحل' : 'Resolved'}
                        </span>
                      )}
                    </div>
                    {r.data?.details && (
                      <p className="text-xs text-gray-500 mt-0.5">{r.data.details}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isRTL ? 'بواسطة:' : 'By:'}{' '}
                      {isRTL ? r.user?.name_ar : r.user?.name_en} · {r.user?.email}
                    </p>
                    {r.listing && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isRTL ? 'الإعلان:' : 'Listing:'}{' '}
                        {isRTL ? r.listing.title_ar : r.listing.title_en}
                      </p>
                    )}
                  </div>
                  {!resolved && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {r.listing_id && (
                        <button
                          onClick={() => openListingPreview(r.listing_id)}
                          className="px-3 py-1.5 bg-navy/10 text-navy rounded-lg text-[11px] font-bold
                                     hover:bg-navy/20 transition whitespace-nowrap flex items-center gap-1 justify-center"
                        >
                          <Eye size={11} /> {isRTL ? 'عرض الإعلان' : 'View listing'}
                        </button>
                      )}
                      {r.listing_id && r.listing?.status !== 'rejected' && (
                        <button
                          onClick={() => { setRejectReason(''); setRejectModal({ type: 'listing', id: r.listing_id }); }}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold
                                     hover:bg-red-100 transition whitespace-nowrap flex items-center gap-1 justify-center"
                        >
                          <XCircle size={11} /> {isRTL ? 'رفض الإعلان' : 'Reject listing'}
                        </button>
                      )}
                      <button onClick={() => resolveReport(r.id)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-bold
                                   hover:bg-emerald-100 transition whitespace-nowrap">
                        {isRTL ? '✓ تجاهل البلاغ' : '✓ Dismiss'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {!isLoading && reports.length > 0 && reportLastPage > 1 && (
              <div className="flex items-center justify-center gap-3 py-4">
                <button
                  onClick={() => { const p = reportPage - 1; setReportPage(p); loadReports(p); }}
                  disabled={reportPage === 1}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition font-medium"
                >
                  {isRTL ? 'السابق →' : '← Prev'}
                </button>
                <span className="text-sm text-gray-500 font-medium">
                  {reportPage} / {reportLastPage}
                </span>
                <button
                  onClick={() => { const p = reportPage + 1; setReportPage(p); loadReports(p); }}
                  disabled={reportPage === reportLastPage}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition font-medium"
                >
                  {isRTL ? '← التالي' : 'Next →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 6: USERS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="card p-4 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setUserPage(1); loadUsers(1); } }}
                  placeholder={isRTL ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
                  className="input text-sm ps-9 py-2"
                />
              </div>
              <select
                value={userRole}
                onChange={e => { setUserRole(e.target.value); }}
                className="input text-sm py-2 flex-shrink-0"
              >
                <option value="">{isRTL ? 'كل الأدوار' : 'All roles'}</option>
                <option value="individual">{isRTL ? 'أفراد' : 'Individuals'}</option>
                <option value="business">{isRTL ? 'شركات' : 'Businesses'}</option>
              </select>
              <button onClick={() => { setUserPage(1); loadUsers(1); }}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                <Search size={13} /> {isRTL ? 'بحث' : 'Search'}
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" size={28} /></div>
            ) : users.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                {isRTL ? 'لا توجد نتائج' : 'No results found'}
              </div>
            ) : (
              <>
              <div className="space-y-2">
                {users.map((u: any) => (
                  <div key={u.id} className="card p-4 flex items-center gap-4">
                    <button
                      onClick={() => setUserDetail(u)}
                      className="flex items-center gap-4 flex-1 min-w-0 text-start hover:opacity-80 transition"
                    >
                      <div className="w-10 h-10 bg-navy/10 rounded-full flex items-center justify-center
                                      text-navy font-black text-sm flex-shrink-0 overflow-hidden">
                        {storageUrl(u.avatar)
                          ? <img src={storageUrl(u.avatar)!} alt="" className="w-full h-full object-cover" />
                          : (isRTL ? u.name_ar : u.name_en)?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-navy text-sm hover:underline">
                          {isRTL ? u.name_ar : u.name_en}
                        </p>
                        <p className="text-xs text-gray-400 truncate" dir="ltr">{u.email}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${u.role === 'business' ? 'bg-blue-100 text-blue-600' :
                              u.role === 'admin'    ? 'bg-red-100 text-red-600' :
                                                     'bg-gray-100 text-gray-500'}`}>
                            {u.role === 'business' ? (isRTL ? 'شركة' : 'Business') :
                             u.role === 'admin'    ? (isRTL ? 'مشرف' : 'Admin') :
                                                    (isRTL ? 'فرد' : 'Individual')}
                          </span>
                          {u.listings_count > 0 && (
                            <span className="text-xs text-gray-400">
                              {u.listings_count} {isRTL ? 'إعلان' : 'listings'}
                            </span>
                          )}
                          {u.is_trusted_payer && (
                            <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                              ✓ {isRTL ? 'موثوق' : 'Trusted'}
                            </span>
                          )}
                          {u.email_verified_at ? (
                            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                              ✉️ {isRTL ? 'بريد موثق' : 'Email verified'}
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                              ⚠️ {isRTL ? 'بريد غير موثق' : 'Email NOT verified'}
                            </span>
                          )}
                          {u.suspended_at && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                              🚫 {isRTL ? 'مُعلَّق' : 'Suspended'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {/* Activate-and-welcome — the primary engagement action.
                          Works on any user: verifies if needed + sends the
                          beautiful welcome email with features & referral. */}
                      <button
                        onClick={() => activateAccountWithWelcome(u.id, u.email)}
                        title={isRTL
                          ? 'تفعيل الحساب + إيميل ترحيبي يحفّز على النشر والدعوة'
                          : 'Activate + welcome email (features + referral link)'}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald to-emerald-dark text-white hover:from-emerald-dark hover:to-emerald-dark transition shadow-sm"
                      >
                        🎉 {isRTL ? 'تفعيل وترحيب' : 'Activate & Welcome'}
                      </button>

                      {/* Verification fast-actions — only show for unverified */}
                      {!u.email_verified_at && (
                        <>
                          <button
                            onClick={() => adminResendVerification(u.id, u.email)}
                            title={isRTL ? 'إعادة إرسال إيميل التحقق' : 'Resend verification email'}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          >
                            ✉️ {isRTL ? 'إرسال رابط تحقق' : 'Send link'}
                          </button>
                          <button
                            onClick={() => manuallyVerifyEmail(u.id, u.email)}
                            title={isRTL ? 'تحقق يدوي بدون إرسال إيميل' : 'Manual verify (bypass email)'}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                          >
                            ✓ {isRTL ? 'تحقق يدوي صامت' : 'Silent verify'}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => toggleTrustedPayer(u.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition
                          ${u.is_trusted_payer
                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                      >
                        {u.is_trusted_payer
                          ? (isRTL ? 'سحب الموثوقية' : 'Remove Trust')
                          : (isRTL ? 'منح الموثوقية' : 'Make Trusted')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {userLastPage > 1 && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <button
                    onClick={() => { const p = userPage - 1; setUserPage(p); loadUsers(p); }}
                    disabled={userPage === 1}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition font-medium"
                  >
                    {isRTL ? 'السابق →' : '← Prev'}
                  </button>
                  <span className="text-sm text-gray-500 font-medium">
                    {userPage} / {userLastPage}
                  </span>
                  <button
                    onClick={() => { const p = userPage + 1; setUserPage(p); loadUsers(p); }}
                    disabled={userPage === userLastPage}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition font-medium"
                  >
                    {isRTL ? '← التالي' : 'Next →'}
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 7: AUDIT LOG
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="card p-4 flex flex-wrap gap-3">
              <select
                value={auditActionFilter}
                onChange={e => setAuditActionFilter(e.target.value)}
                className="input text-sm py-2 flex-1 min-w-[200px]"
              >
                <option value="">{isRTL ? 'كل الأنشطة' : 'All actions'}</option>
                <option value="listing.">{isRTL ? '— عمليات الإعلانات —' : '— Listing actions —'}</option>
                <option value="listing.approve">{isRTL ? 'قبول إعلان' : 'Approve listing'}</option>
                <option value="listing.reject">{isRTL ? 'رفض إعلان' : 'Reject listing'}</option>
                <option value="listing.bulk_approve">{isRTL ? 'قبول جماعي' : 'Bulk approve'}</option>
                <option value="listing.bulk_reject">{isRTL ? 'رفض جماعي' : 'Bulk reject'}</option>
                <option value="listing.toggle_featured">{isRTL ? 'تمييز إعلان' : 'Toggle featured'}</option>
                <option value="verification.">{isRTL ? '— التوثيقات —' : '— Verifications —'}</option>
                <option value="verification.approve">{isRTL ? 'قبول توثيق' : 'Approve verification'}</option>
                <option value="verification.reject">{isRTL ? 'رفض توثيق' : 'Reject verification'}</option>
                <option value="user.">{isRTL ? '— المستخدمون —' : '— Users —'}</option>
                <option value="user.toggle_trusted_payer">{isRTL ? 'تبديل الموثوقية' : 'Toggle trusted'}</option>
                <option value="user.suspend">{isRTL ? 'تعليق حساب' : 'Suspend user'}</option>
                <option value="user.unsuspend">{isRTL ? 'إلغاء تعليق' : 'Unsuspend user'}</option>
                <option value="user.delete">{isRTL ? 'حذف حساب' : 'Delete user'}</option>
                <option value="report.">{isRTL ? '— البلاغات —' : '— Reports —'}</option>
                <option value="report.resolve">{isRTL ? 'حل بلاغ' : 'Resolve report'}</option>
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" size={28} /></div>
            ) : auditLogs.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                <Activity size={32} className="mx-auto mb-2 text-gray-300" />
                {isRTL ? 'لا توجد عمليات مسجَّلة' : 'No audit records'}
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  {auditLogs.map((log: any) => {
                    const actionLabels: Record<string, { ar: string; en: string; color: string; icon: string }> = {
                      'listing.approve':            { ar: 'قبول إعلان',     en: 'Approved listing',     color: 'text-emerald-600 bg-emerald-50', icon: '✓' },
                      'listing.reject':             { ar: 'رفض إعلان',      en: 'Rejected listing',     color: 'text-red-600 bg-red-50',         icon: '✗' },
                      'listing.bulk_approve':       { ar: 'قبول جماعي',     en: 'Bulk approved',         color: 'text-emerald-600 bg-emerald-50', icon: '✓✓' },
                      'listing.bulk_reject':        { ar: 'رفض جماعي',      en: 'Bulk rejected',         color: 'text-red-600 bg-red-50',         icon: '✗✗' },
                      'listing.toggle_featured':    { ar: 'تمييز إعلان',    en: 'Toggle featured',       color: 'text-amber-600 bg-amber-50',     icon: '⭐' },
                      'verification.approve':       { ar: 'قبول توثيق',     en: 'Approved verification', color: 'text-emerald-600 bg-emerald-50', icon: '✓' },
                      'verification.reject':        { ar: 'رفض توثيق',      en: 'Rejected verification', color: 'text-red-600 bg-red-50',         icon: '✗' },
                      'user.toggle_trusted_payer':  { ar: 'تبديل الموثوقية', en: 'Toggle trusted payer', color: 'text-amber-600 bg-amber-50',     icon: '🎖️' },
                      'user.suspend':               { ar: 'تعليق حساب',     en: 'Suspended user',        color: 'text-orange-600 bg-orange-50',   icon: '🚫' },
                      'user.unsuspend':             { ar: 'إلغاء تعليق',    en: 'Unsuspended user',      color: 'text-emerald-600 bg-emerald-50', icon: '✓' },
                      'user.delete':                { ar: 'حذف حساب',       en: 'Deleted user',          color: 'text-red-600 bg-red-50',         icon: '🗑️' },
                      'report.resolve':             { ar: 'حل بلاغ',        en: 'Resolved report',       color: 'text-emerald-600 bg-emerald-50', icon: '✓' },
                    };
                    const meta = actionLabels[log.action] ?? { ar: log.action, en: log.action, color: 'text-gray-600 bg-gray-50', icon: '·' };
                    const adminName = isRTL ? log.admin?.name_ar : log.admin?.name_en;
                    return (
                      <div key={log.id} className="card p-3 flex items-start gap-3 hover:bg-gray-50/30 transition">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${meta.color}`}>
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-navy">
                              {isRTL ? meta.ar : meta.en}
                            </span>
                            {log.target_type && log.target_id && (
                              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                {log.target_type} #{log.target_id}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isRTL ? 'بواسطة' : 'By'}{' '}
                            <span className="font-semibold text-navy">{adminName ?? log.admin?.email}</span>
                            {log.metadata?.reason && (
                              <span className="text-gray-400"> · {log.metadata.reason}</span>
                            )}
                            {log.metadata?.count && (
                              <span className="text-gray-400"> · {log.metadata.count} {isRTL ? 'عنصر' : 'items'}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-[10px] text-gray-400 text-end shrink-0">
                          <div>{new Date(log.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}</div>
                          <div>{new Date(log.created_at).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {auditLastPage > 1 && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <button
                      onClick={() => { const p = auditPage - 1; setAuditPage(p); loadAuditLogs(p); }}
                      disabled={auditPage === 1}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition font-medium"
                    >
                      {isRTL ? 'السابق →' : '← Prev'}
                    </button>
                    <span className="text-sm text-gray-500 font-medium">
                      {auditPage} / {auditLastPage}
                    </span>
                    <button
                      onClick={() => { const p = auditPage + 1; setAuditPage(p); loadAuditLogs(p); }}
                      disabled={auditPage === auditLastPage}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition font-medium"
                    >
                      {isRTL ? '← التالي' : 'Next →'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 8: COMMENTS MODERATION
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="card p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  value={commentsSearch}
                  onChange={e => setCommentsSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setCommentsPage(1); loadComments(1); } }}
                  placeholder={isRTL ? 'بحث في نص التعليق...' : 'Search comment body...'}
                  className="input text-sm ps-9 py-2"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commentsReportedOnly}
                  onChange={e => { setCommentsReportedOnly(e.target.checked); setCommentsPage(1); }}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-sm text-red-600 font-semibold">
                  🚩 {isRTL ? 'المُبلَّغ عنها فقط' : 'Reported only'}
                </span>
              </label>
              <button onClick={() => { setCommentsPage(1); loadComments(1); }}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                <Search size={13} /> {isRTL ? 'بحث' : 'Search'}
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy" size={28} /></div>
            ) : comments.length === 0 ? (
              <div className="card p-10 text-center text-gray-400">
                <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                {isRTL ? 'لا توجد تعليقات' : 'No comments'}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {comments.map((c: any) => {
                    const authorName = isRTL ? (c.user?.name_ar ?? c.user?.name_en) : (c.user?.name_en ?? c.user?.name_ar);
                    const listingTitle = isRTL
                      ? (c.listing?.title_ar ?? c.listing?.title_en)
                      : (c.listing?.title_en ?? c.listing?.title_ar);
                    return (
                      <div key={c.id} className="card p-4">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
                          <span className="font-bold text-navy text-sm">{authorName ?? '—'}</span>
                          <span className="text-gray-400" dir="ltr">{c.user?.email}</span>
                          {c.is_official_answer && (
                            <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">⭐ {isRTL ? 'رسمية' : 'Official'}</span>
                          )}
                          {c.is_marked_helpful && (
                            <span className="bg-emerald/10 text-emerald px-2 py-0.5 rounded-full font-bold">✓ {isRTL ? 'مفيد' : 'Helpful'}</span>
                          )}
                          {c.upvotes_count > 0 && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                              👍 {c.upvotes_count}
                            </span>
                          )}
                          {c.parent_id && (
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">↳ {isRTL ? 'رد' : 'Reply'}</span>
                          )}
                          <span className="text-gray-400 ms-auto">
                            {new Date(c.created_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>

                        {/* Body */}
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words mb-3">{c.body}</p>

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                          {c.listing_id && (
                            <Link href={`/${locale}/listings/${c.listing_id}`}
                              target="_blank"
                              className="text-xs text-emerald hover:underline truncate flex-1">
                              📋 {listingTitle ?? `Listing #${c.listing_id}`}
                              {c.listing?.section && (
                                <span className="text-gray-400 ms-2">({c.listing.section})</span>
                              )}
                            </Link>
                          )}
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleMarkCommentOfficial(c.id, c.is_official_answer)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition
                                ${c.is_official_answer
                                  ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-600'}`}
                            >
                              <Star size={11} fill={c.is_official_answer ? 'currentColor' : 'none'} />
                              {isRTL ? (c.is_official_answer ? 'إلغاء الرسمية' : 'اعتبر رسمي') : (c.is_official_answer ? 'Unmark' : 'Mark official')}
                            </button>
                            <button
                              onClick={() => handleAdminDeleteComment(c.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg
                                         text-xs font-bold hover:bg-red-100 transition">
                              <Trash2 size={11} /> {isRTL ? 'حذف' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {commentsLastPage > 1 && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <button
                      onClick={() => { const p = commentsPage - 1; setCommentsPage(p); loadComments(p); }}
                      disabled={commentsPage === 1}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition font-medium"
                    >
                      {isRTL ? 'السابق →' : '← Prev'}
                    </button>
                    <span className="text-sm text-gray-500 font-medium">
                      {commentsPage} / {commentsLastPage}
                    </span>
                    <button
                      onClick={() => { const p = commentsPage + 1; setCommentsPage(p); loadComments(p); }}
                      disabled={commentsPage === commentsLastPage}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition font-medium"
                    >
                      {isRTL ? '← التالي' : 'Next →'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 9: SUBSCRIPTIONS — grant / extend / cancel + pending requests
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'subscriptions' && <AdminSubscriptionsTab />}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 10: PLANS — edit price / features without deploy
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'plans' && <AdminPlansTab />}

      </div>

      <Footer />

      {/* ── Reject Modal ─────────────────────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
             onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-navy text-lg mb-1">
              {isRTL ? 'سبب الرفض' : 'Rejection Reason'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {rejectModal.type === 'listing'
                ? (isRTL ? 'سيُرسل هذا السبب لصاحب الإعلان.' : 'This reason will be sent to the listing owner.')
                : (isRTL ? 'سيُرسل هذا السبب لصاحب طلب التوثيق.' : 'This will be sent to the requester.')}
            </p>

            {/* Quick-pick templates */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {isRTL ? 'أسباب جاهزة' : 'Quick reasons'}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(rejectModal.type === 'listing' ? LISTING_REJECT_TEMPLATES : VERIFICATION_REJECT_TEMPLATES)
                .map((t, i) => {
                  const text = isRTL ? t.ar : t.en;
                  const selected = rejectReason === text;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRejectReason(text)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition
                        ${selected
                          ? 'bg-red-50 border-red-400 text-red-700 font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'}`}
                    >
                      {text}
                    </button>
                  );
                })}
            </div>

            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="input text-sm min-h-[100px] resize-none mb-4"
              dir={isRTL ? 'rtl' : 'ltr'}
              placeholder={isRTL ? 'اكتب سبب الرفض أو اختر من الأعلى...' : 'Enter reason or pick from above...'}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition disabled:opacity-40">
                {isRTL ? 'تأكيد الرفض' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CR Document Preview Modal ─────────────────────────────────────────── */}
      {crPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
             onClick={() => setCrPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                  <FileText className="text-emerald" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-navy text-sm truncate">{crPreview.name}</p>
                  <p className="text-xs text-gray-400 truncate" dir="ltr">CR: {crPreview.cr}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={crPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-navy/10 text-navy
                             rounded-lg text-xs font-bold hover:bg-navy/20 transition"
                >
                  <ExternalLink size={12} />
                  {isRTL ? 'فتح خارجي' : 'Open'}
                </a>
                <a
                  href={crPreview.url}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald/10 text-emerald
                             rounded-lg text-xs font-bold hover:bg-emerald/20 transition"
                >
                  <Download size={12} />
                  {isRTL ? 'تنزيل' : 'Download'}
                </a>
                <button
                  onClick={() => setCrPreview(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              {crPreview.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={crPreview.url}
                  className="w-full h-[70vh] bg-white rounded-lg shadow"
                  title={crPreview.name}
                />
              ) : (
                <img
                  src={crPreview.url}
                  alt={crPreview.name}
                  className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── User Detail Modal ─────────────────────────────────────────────────── */}
      {userDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
             onClick={() => setUserDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Users className="text-navy" size={16} />
                <span className="font-bold text-navy text-sm">
                  {isRTL ? 'تفاصيل المستخدم' : 'User Details'}
                </span>
              </div>
              <button
                onClick={() => setUserDetail(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
              >
                <X size={16} />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Avatar + Identity */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center
                                text-navy font-black text-2xl overflow-hidden">
                  {storageUrl(userDetail.avatar)
                    ? <img src={storageUrl(userDetail.avatar)!} alt="" className="w-full h-full object-cover" />
                    : (isRTL ? userDetail.name_ar : userDetail.name_en)?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-navy text-lg">
                    {isRTL ? userDetail.name_ar : userDetail.name_en}
                  </h3>
                  <p className="text-xs text-gray-400" dir="ltr">{userDetail.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${userDetail.role === 'business' ? 'bg-blue-100 text-blue-600' :
                        userDetail.role === 'admin'    ? 'bg-red-100 text-red-600' :
                                                       'bg-gray-100 text-gray-500'}`}>
                      {userDetail.role === 'business' ? (isRTL ? 'شركة' : 'Business') :
                       userDetail.role === 'admin'    ? (isRTL ? 'مشرف' : 'Admin') :
                                                      (isRTL ? 'فرد' : 'Individual')}
                    </span>
                    {userDetail.is_trusted_payer && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        🎖️ {isRTL ? 'دافع موثوق' : 'Trusted Payer'}
                      </span>
                    )}
                    {userDetail.email_verified_at && (
                      <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                        ✓ {isRTL ? 'بريد موثق' : 'Email verified'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Mail size={10} /> {isRTL ? 'البريد' : 'Email'}
                  </p>
                  <p className="text-xs font-semibold text-gray-800 truncate" dir="ltr">{userDetail.email}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Phone size={10} /> {isRTL ? 'الجوال' : 'Phone'}
                  </p>
                  <p className="text-xs font-semibold text-gray-800 truncate" dir="ltr">
                    {userDetail.phone ?? '—'}
                  </p>
                </div>
              </div>

              {/* Activity stats */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {isRTL ? 'النشاط' : 'Activity'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-[10px] text-blue-500 uppercase tracking-wider mb-1">
                      {isRTL ? 'إعلانات' : 'Listings'}
                    </p>
                    <p className="text-2xl font-black text-blue-700">{userDetail.listings_count ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar size={10} /> {isRTL ? 'انضم في' : 'Joined'}
                    </p>
                    <p className="text-xs font-semibold text-gray-700">
                      {userDetail.created_at
                        ? new Date(userDetail.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Verification */}
              {userDetail.business_verification && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {isRTL ? 'التوثيق التجاري' : 'Business Verification'}
                  </p>
                  <div className={`rounded-xl p-3 border
                    ${userDetail.business_verification.status === 'approved' ? 'bg-emerald-50 border-emerald-200' :
                      userDetail.business_verification.status === 'pending'  ? 'bg-amber-50 border-amber-200' :
                                                                              'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase">
                        {userDetail.business_verification.status === 'approved'
                          ? (isRTL ? '✓ مقبول' : '✓ Approved')
                          : userDetail.business_verification.status === 'pending'
                          ? (isRTL ? '⏳ قيد المراجعة' : '⏳ Pending')
                          : (isRTL ? '✗ مرفوض' : '✗ Rejected')}
                      </span>
                      {(userDetail.business_verification.document || userDetail.business_verification.cr_image_path) && (
                        <button
                          onClick={() => openCrPreview(userDetail)}
                          className="text-xs text-emerald font-bold hover:underline flex items-center gap-1"
                        >
                          <FileText size={11} /> {isRTL ? 'عرض الوثيقة' : 'View Doc'}
                        </button>
                      )}
                    </div>
                    {userDetail.business_verification.company_name && (
                      <p className="text-sm font-bold text-gray-800">
                        {userDetail.business_verification.company_name}
                      </p>
                    )}
                    {userDetail.business_verification.cr_number && (
                      <p className="text-xs text-gray-500" dir="ltr">
                        CR: {userDetail.business_verification.cr_number}
                      </p>
                    )}
                    {userDetail.business_verification.reject_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        {isRTL ? 'سبب الرفض: ' : 'Reason: '}{userDetail.business_verification.reject_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Subscription */}
              {userDetail.subscription_data && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {isRTL ? 'الاشتراك' : 'Subscription'}
                  </p>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
                    <p className="text-sm font-bold text-violet-700 capitalize">
                      {userDetail.subscription_data.plan ?? '—'}
                    </p>
                    {userDetail.subscription_data.expires_at && (
                      <p className="text-xs text-violet-500 mt-0.5">
                        {isRTL ? 'تنتهي في ' : 'Expires '}
                        {new Date(userDetail.subscription_data.expires_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Suspended banner */}
              {userDetail.suspended_at && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-700 mb-1">
                    🚫 {isRTL ? 'الحساب مُعلَّق' : 'Account suspended'}
                  </p>
                  {userDetail.suspend_reason && (
                    <p className="text-xs text-red-600">{userDetail.suspend_reason}</p>
                  )}
                </div>
              )}

              {/* Quick actions */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {/* Toggle trusted payer */}
                <button
                  onClick={() => { toggleTrustedPayer(userDetail.id); setUserDetail({ ...userDetail, is_trusted_payer: !userDetail.is_trusted_payer }); }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition
                    ${userDetail.is_trusted_payer
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                >
                  {userDetail.is_trusted_payer
                    ? (isRTL ? '🚫 سحب الموثوقية' : '🚫 Remove Trust')
                    : (isRTL ? '🎖️ منح الموثوقية' : '🎖️ Make Trusted')}
                </button>

                {/* Suspend / Unsuspend */}
                {userDetail.role !== 'admin' && userDetail.id !== user?.id && (
                  <>
                    {userDetail.suspended_at ? (
                      <button
                        onClick={() => handleUnsuspend(userDetail)}
                        className="w-full py-2.5 rounded-xl text-xs font-bold transition
                                   bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      >
                        ✓ {isRTL ? 'إلغاء التعليق' : 'Unsuspend'}
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSuspendReason(''); setSuspendModal({ user: userDetail }); }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold transition
                                   bg-orange-50 text-orange-600 hover:bg-orange-100"
                      >
                        🚫 {isRTL ? 'تعليق الحساب' : 'Suspend account'}
                      </button>
                    )}

                    {/* Delete account */}
                    <button
                      onClick={() => setDeleteConfirm({ user: userDetail })}
                      className="w-full py-2.5 rounded-xl text-xs font-bold transition
                                 bg-red-50 text-red-500 hover:bg-red-100"
                    >
                      🗑️ {isRTL ? 'حذف الحساب' : 'Delete account'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Listing Quick Preview Modal ───────────────────────────────────────── */}
      {listingPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
             onClick={() => setListingPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Eye className="text-navy" size={16} />
                <span className="font-bold text-navy text-sm">
                  {isRTL ? 'معاينة الإعلان' : 'Listing Preview'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {listingPreview?.id && !listingPreview?.loading && (
                  <Link
                    href={`/${locale}/listings/${listingPreview.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald/10 text-emerald
                               rounded-lg text-xs font-bold hover:bg-emerald/20 transition"
                  >
                    <ExternalLink size={12} />
                    {isRTL ? 'الصفحة الكاملة' : 'Full page'}
                  </Link>
                )}
                <button
                  onClick={() => setListingPreview(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {listingPreviewLoading || listingPreview?.loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="animate-spin text-navy" size={28} />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Images */}
                  {(() => {
                    const imgs = (listingPreview.media ?? [])
                      .filter((m: any) => m.type === 'image')
                      .map((m: any) => `${process.env.NEXT_PUBLIC_API_URL}/uploads/${m.path}`);
                    if (imgs.length === 0) return null;
                    return (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {imgs.map((url: string, i: number) => (
                          <img key={i} src={url} alt=""
                            className="h-32 rounded-lg object-cover flex-shrink-0" />
                        ))}
                      </div>
                    );
                  })()}

                  {/* Title + badges */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs bg-navy/10 text-navy px-2 py-0.5 rounded-full font-medium">
                        {isRTL ? SECTION_LABEL[listingPreview.section] : SECTION_LABEL_EN[listingPreview.section]}
                      </span>
                      {listingPreview.is_featured && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          ⭐ {isRTL ? 'مميز' : 'Featured'}
                        </span>
                      )}
                      {listingPreview.is_financing_eligible && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          💰 {isRTL ? 'مؤهل للتمويل' : 'Financing'}
                        </span>
                      )}
                      {listingPreview.is_ready_to_operate && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          🟢 {isRTL ? 'جاهز للتشغيل' : 'Ready'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-navy text-lg leading-snug">
                      {isRTL ? listingPreview.title_ar : (listingPreview.title_en || listingPreview.title_ar)}
                    </h3>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-y border-gray-100 py-3">
                    {listingPreview.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} /> {listingPreview.city}
                      </span>
                    )}
                    {listingPreview.price && (
                      <span className="flex items-center gap-1.5">
                        <DollarSign size={13} />
                        {Number(listingPreview.price).toLocaleString(isRTL ? 'ar-SA' : 'en-US')} {isRTL ? 'ر.س' : 'SAR'}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Eye size={13} /> {listingPreview.views_count ?? 0}
                    </span>
                    {listingPreview.created_at && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {new Date(listingPreview.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {listingPreview.description_ar && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {isRTL ? 'الوصف' : 'Description'}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed"
                         dir={isRTL ? 'rtl' : 'ltr'}>
                        {isRTL ? listingPreview.description_ar : (listingPreview.description_en || listingPreview.description_ar)}
                      </p>
                    </div>
                  )}

                  {/* Dynamic data */}
                  {listingPreview.dynamic_data && Object.keys(listingPreview.dynamic_data).length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {isRTL ? 'بيانات إضافية' : 'Additional Data'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(listingPreview.dynamic_data)
                          .filter(([, v]) => v !== null && v !== '' && v !== undefined)
                          .map(([k, v]) => (
                            <div key={k} className="bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-[10px] text-gray-400 uppercase">{k}</p>
                              <p className="text-sm font-semibold text-gray-800 truncate">{String(v)}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Owner */}
                  {listingPreview.user && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center
                                      text-navy font-bold text-sm">
                        {(isRTL ? listingPreview.user.name_ar : listingPreview.user.name_en)?.[0] ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-navy truncate">
                          {isRTL ? listingPreview.user.name_ar : listingPreview.user.name_en}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">{listingPreview.user.role}</p>
                      </div>
                      {listingPreview.user.is_trusted_payer && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          🎖️ {isRTL ? 'موثوق' : 'Trusted'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rejection reason if any */}
                  {listingPreview.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-red-600 mb-1">
                        {isRTL ? 'سبب الرفض' : 'Rejection reason'}
                      </p>
                      <p className="text-sm text-red-700">{listingPreview.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Reject Modal ─────────────────────────────────────────────────── */}
      {bulkRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
             onClick={() => setBulkRejectModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
               onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-navy text-lg mb-1">
              {isRTL ? `رفض ${selectedIds.size} إعلان` : `Reject ${selectedIds.size} listings`}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {isRTL
                ? 'سيُرسل نفس السبب لجميع أصحاب الإعلانات المحددة.'
                : 'The same reason will be emailed to every selected listing owner.'}
            </p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {isRTL ? 'أسباب جاهزة' : 'Quick reasons'}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {LISTING_REJECT_TEMPLATES.map((t, i) => {
                const text = isRTL ? t.ar : t.en;
                const selected = bulkRejectReason === text;
                return (
                  <button key={i} type="button" onClick={() => setBulkRejectReason(text)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition
                      ${selected
                        ? 'bg-red-50 border-red-400 text-red-700 font-bold'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'}`}>
                    {text}
                  </button>
                );
              })}
            </div>
            <textarea
              value={bulkRejectReason}
              onChange={e => setBulkRejectReason(e.target.value)}
              className="input text-sm min-h-[100px] resize-none mb-4"
              dir={isRTL ? 'rtl' : 'ltr'}
              placeholder={isRTL ? 'اكتب سبب الرفض...' : 'Enter rejection reason...'}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setBulkRejectModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleBulkReject} disabled={!bulkRejectReason.trim() || bulkBusy}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition disabled:opacity-40 flex items-center justify-center gap-2">
                {bulkBusy && <Loader2 size={14} className="animate-spin" />}
                {isRTL ? `رفض ${selectedIds.size} إعلان` : `Reject ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Suspend User Modal ────────────────────────────────────────────────── */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
             onClick={() => setSuspendModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
               onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-navy text-lg mb-1">
              🚫 {isRTL ? 'تعليق الحساب' : 'Suspend Account'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {isRTL
                ? `سيتم تعليق حساب «${suspendModal.user.name_ar}» وإلغاء جلساته الحالية وإرسال إيميل بالسبب.`
                : `Will suspend «${suspendModal.user.name_en}», revoke active sessions, and email them the reason.`}
            </p>
            <textarea
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              className="input text-sm min-h-[100px] resize-none mb-4"
              dir={isRTL ? 'rtl' : 'ltr'}
              placeholder={isRTL ? 'سبب التعليق (إجباري)...' : 'Suspension reason (required)...'}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setSuspendModal(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleSuspend} disabled={!suspendReason.trim() || suspendBusy}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition disabled:opacity-40 flex items-center justify-center gap-2">
                {suspendBusy && <Loader2 size={14} className="animate-spin" />}
                {isRTL ? 'تأكيد التعليق' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete User Confirm Modal ─────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
             onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
               onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3 text-center">⚠️</div>
            <h3 className="font-black text-red-600 text-lg mb-1 text-center">
              {isRTL ? 'حذف الحساب نهائياً؟' : 'Delete account permanently?'}
            </h3>
            <p className="text-gray-500 text-sm text-center mb-4">
              {isRTL
                ? `سيتم حذف حساب «${deleteConfirm.user.name_ar}». السجلات المالية ستبقى محفوظة.`
                : `Account «${deleteConfirm.user.name_en}» will be removed. Payment records stay intact.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 transition font-medium">
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition">
                {isRTL ? 'حذف نهائياً' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
