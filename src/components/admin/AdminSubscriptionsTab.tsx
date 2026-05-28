'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import {
  Loader2, Check, X, Calendar, Plus, Search,
  AlertCircle, ChevronRight, ChevronLeft,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminSubscriptionApi, plansApi } from '@/lib/api'
import type { Plan, PlanCode, BillingCycle } from '@/types'

type Subscription = {
  id: number
  user_id: number
  plan_id: number
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'suspended'
  billing_cycle: BillingCycle
  started_at: string | null
  expires_at: string | null
  source: string | null
  user?:  { id: number; name_ar: string; name_en: string; email: string; phone: string | null }
  plan?:  Plan
  metadata?: Record<string, unknown> | null
}

/**
 * Admin → Subscriptions tab.
 *
 * Two sections:
 *   1. "طلبات معلّقة" — users who clicked "Subscribe" on /pricing.
 *      Each row: Approve (activate), Reject (cancel), or Open user.
 *   2. "كل الاشتراكات" — paginated table with filters by plan + status.
 *      Per-row actions: Extend +30/+90 days, Cancel, Activate.
 *
 * Plus a "Grant Plan" modal — pick user (by ID or email search), plan,
 *  cycle, optional note → POST /api/admin/users/{id}/grant-plan.
 */
export default function AdminSubscriptionsTab() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const t = (ar: string, en: string) => (isRTL ? ar : en)

  const [pending,    setPending]    = useState<Subscription[]>([])
  const [all,        setAll]        = useState<Subscription[]>([])
  const [plans,      setPlans]      = useState<Plan[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filterPlan,   setFilterPlan]   = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [page,       setPage]       = useState(1)
  const [meta,       setMeta]       = useState<{ total: number; last_page: number } | null>(null)
  const [showGrant,  setShowGrant]  = useState(false)

  const reload = () => {
    setLoading(true)
    Promise.all([
      adminSubscriptionApi.pending().then((r: any) => r.data ?? []),
      adminSubscriptionApi.list({
        status: filterStatus || undefined,
        plan:   filterPlan   || undefined,
        page,
      }).then((r: any) => ({ data: r.data ?? [], total: r.total ?? 0, last_page: r.last_page ?? 1 })),
      plansApi.list().then((r: any) => r.data ?? []),
    ])
      .then(([p, list, pls]) => {
        setPending(p)
        setAll(list.data)
        setMeta({ total: list.total, last_page: list.last_page })
        setPlans(pls)
      })
      .catch(() => toast.error(t('فشل تحميل الاشتراكات', 'Failed to load subscriptions')))
      .finally(() => setLoading(false))
  }
  useEffect(reload, [filterPlan, filterStatus, page])

  const onAction = async (
    sub: Subscription,
    action: 'extend' | 'cancel' | 'activate',
    days?: number
  ) => {
    try {
      await adminSubscriptionApi.update(sub.id, action, days)
      toast.success(t('تم بنجاح ✓', 'Done ✓'))
      reload()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t('فشل الإجراء', 'Action failed'))
    }
  }

  if (loading && all.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-navy" size={28} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-black text-navy">{t('الاشتراكات', 'Subscriptions')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t(
              'منح الباقات يدوياً، تمديد، أو إلغاء — كل التغييرات مسجّلة في سجل التدقيق.',
              'Manually grant, extend, or cancel — every change is logged in the audit trail.'
            )}
          </p>
        </div>
        <button
          onClick={() => setShowGrant(true)}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald hover:bg-emerald-dark inline-flex items-center gap-2"
        >
          <Plus size={14} /> {t('منح باقة', 'Grant Plan')}
        </button>
      </div>

      {/* ─── Pending requests ─── */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">
              {t(`طلبات معلّقة (${pending.length})`, `Pending requests (${pending.length})`)}
            </h3>
          </div>
          <div className="space-y-2">
            {pending.map((sub) => (
              <div key={sub.id}
                className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-amber-900">
                    {isRTL ? sub.user?.name_ar : sub.user?.name_en} —{' '}
                    {isRTL ? sub.plan?.name_ar : sub.plan?.name_en}
                  </p>
                  <p className="text-xs text-amber-700">
                    {sub.user?.email} · {sub.user?.phone}
                    {' · '}
                    {sub.billing_cycle === 'yearly' ? t('سنوي', 'Yearly') : t('شهري', 'Monthly')}
                  </p>
                  {typeof sub.metadata?.notes === 'string' && sub.metadata.notes && (
                    <p className="text-xs text-amber-800 mt-1 italic">"{sub.metadata.notes as string}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onAction(sub, 'activate')}
                    className="px-3 py-1.5 rounded-lg bg-emerald hover:bg-emerald-dark text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Check size={12} /> {t('قبول', 'Approve')}
                  </button>
                  <button
                    onClick={() => onAction(sub, 'cancel')}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium inline-flex items-center gap-1"
                  >
                    <X size={12} /> {t('رفض', 'Reject')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Filters + table ─── */}
      <div className="flex items-center gap-2 flex-wrap">
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="input text-sm py-1.5 px-3">
          <option value="">{t('كل الحالات', 'All statuses')}</option>
          <option value="active">{t('نشطة', 'Active')}</option>
          <option value="pending">{t('معلّقة', 'Pending')}</option>
          <option value="cancelled">{t('ملغاة', 'Cancelled')}</option>
          <option value="expired">{t('منتهية', 'Expired')}</option>
        </select>
        <select value={filterPlan} onChange={(e) => { setFilterPlan(e.target.value); setPage(1) }}
          className="input text-sm py-1.5 px-3">
          <option value="">{t('كل الباقات', 'All plans')}</option>
          {plans.map((p) => (
            <option key={p.code} value={p.code}>{isRTL ? p.name_ar : p.name_en}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          {t(`${meta?.total ?? 0} اشتراك`, `${meta?.total ?? 0} subscriptions`)}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <Th>{t('المستخدم', 'User')}</Th>
              <Th>{t('الباقة', 'Plan')}</Th>
              <Th>{t('الحالة', 'Status')}</Th>
              <Th>{t('الانتهاء', 'Expires')}</Th>
              <Th>{t('المصدر', 'Source')}</Th>
              <Th className="text-end pe-4">{t('إجراءات', 'Actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {all.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                {t('لا توجد اشتراكات بهذه الفلاتر', 'No subscriptions match')}
              </td></tr>
            )}
            {all.map((sub) => (
              <tr key={sub.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                <Td>
                  <div className="font-semibold text-navy">{isRTL ? sub.user?.name_ar : sub.user?.name_en}</div>
                  <div className="text-xs text-gray-500">{sub.user?.email}</div>
                </Td>
                <Td>
                  <PlanPill code={sub.plan?.code as PlanCode} name={(isRTL ? sub.plan?.name_ar : sub.plan?.name_en) ?? '—'} />
                </Td>
                <Td><StatusPill status={sub.status} /></Td>
                <Td className="text-xs">
                  {sub.expires_at
                    ? new Date(sub.expires_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')
                    : <span className="text-gray-400">—</span>}
                </Td>
                <Td className="text-xs text-gray-500">{sub.source ?? '—'}</Td>
                <Td className="text-end pe-4 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    {sub.status === 'active' && (
                      <>
                        <ActionBtn onClick={() => onAction(sub, 'extend', 30)}>
                          <Calendar size={11} /> +30
                        </ActionBtn>
                        <ActionBtn onClick={() => onAction(sub, 'extend', 90)}>
                          +90
                        </ActionBtn>
                        <ActionBtn danger onClick={() => onAction(sub, 'cancel')}>
                          <X size={11} /> {t('إلغاء', 'Cancel')}
                        </ActionBtn>
                      </>
                    )}
                    {(sub.status === 'cancelled' || sub.status === 'expired' || sub.status === 'pending') && (
                      <ActionBtn onClick={() => onAction(sub, 'activate')}>
                        <Check size={11} /> {t('تفعيل', 'Activate')}
                      </ActionBtn>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex justify-center items-center gap-2 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40"
          >
            {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <span className="text-gray-500">{t(`${page} من ${meta.last_page}`, `${page} of ${meta.last_page}`)}</span>
          <button
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40"
          >
            {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      )}

      {/* Grant modal */}
      {showGrant && (
        <GrantModal
          plans={plans}
          onClose={() => setShowGrant(false)}
          onGranted={() => { setShowGrant(false); reload() }}
        />
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
function GrantModal({
  plans, onClose, onGranted,
}: {
  plans: Plan[]
  onClose: () => void
  onGranted: () => void
}) {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const t = (ar: string, en: string) => (isRTL ? ar : en)

  const [userId,    setUserId]    = useState('')
  const [planCode,  setPlanCode]  = useState<PlanCode>('basic')
  const [cycle,     setCycle]     = useState<BillingCycle>('monthly')
  const [note,      setNote]      = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    const id = parseInt(userId)
    if (!Number.isFinite(id) || id <= 0) {
      toast.error(t('أدخل رقم مستخدم صحيح', 'Enter a valid user ID'))
      return
    }
    setSubmitting(true)
    try {
      await adminSubscriptionApi.grantPlan(id, planCode, cycle, note || undefined)
      toast.success(t('تم تفعيل الباقة ✓', 'Plan granted ✓'))
      onGranted()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t('فشل التفعيل', 'Grant failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-navy">{t('منح باقة لمستخدم', 'Grant plan to user')}</h3>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t('رقم المستخدم (User ID)', 'User ID')}
          </label>
          <input className="input text-sm" type="number" value={userId} onChange={(e) => setUserId(e.target.value)}
            placeholder={t('مثال: 12', 'e.g. 12')} />
          <p className="text-[10px] text-gray-400 mt-1">
            {t('تجده في تبويب "المستخدمون"', 'Find it in the Users tab')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('الباقة', 'Plan')}</label>
            <select className="input text-sm" value={planCode}
              onChange={(e) => setPlanCode(e.target.value as PlanCode)}>
              {plans.filter((p) => p.code !== 'free').map((p) => (
                <option key={p.code} value={p.code}>{isRTL ? p.name_ar : p.name_en}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('الدورة', 'Cycle')}</label>
            <select className="input text-sm" value={cycle}
              onChange={(e) => setCycle(e.target.value as BillingCycle)}>
              <option value="monthly">{t('شهري', 'Monthly')}</option>
              <option value="yearly">{t('سنوي', 'Yearly')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t('ملاحظة (اختيارية)', 'Note (optional)')}
          </label>
          <textarea className="input text-sm" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={t('مثلاً: ترقية مجاناً لمدة 3 أشهر', 'e.g. free upgrade for 3 months')} />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
            {t('إلغاء', 'Cancel')}
          </button>
          <button onClick={submit} disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald hover:bg-emerald-dark disabled:opacity-60 inline-flex items-center gap-2">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {t('تفعيل', 'Grant')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tiny helpers ────────────────────────────────────────────────────────────
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-start font-semibold px-3 py-2 ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>
}

const PLAN_TONE: Record<PlanCode, string> = {
  free:         'bg-gray-100 text-gray-700',
  basic:        'bg-navy/10 text-navy',
  professional: 'bg-emerald-bg text-emerald-dark',
  enterprise:   'bg-amber-50 text-amber-700',
}
function PlanPill({ code, name }: { code: PlanCode; name: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_TONE[code] ?? 'bg-gray-100 text-gray-700'}`}>
      {name}
    </span>
  )
}

const STATUS_TONE: Record<string, string> = {
  active:    'bg-emerald-bg text-emerald-dark',
  pending:   'bg-amber-50 text-amber-700',
  cancelled: 'bg-gray-100 text-gray-600',
  expired:   'bg-red-50 text-red-600',
  suspended: 'bg-orange-50 text-orange-700',
}
function StatusPill({ status }: { status: string }) {
  const locale = (typeof window !== 'undefined' && document.documentElement.lang) || 'ar'
  const isRTL = locale === 'ar'
  const labelAr: Record<string,string> = {
    active: 'نشطة', pending: 'معلّقة', cancelled: 'ملغاة', expired: 'منتهية', suspended: 'موقوفة',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_TONE[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {isRTL ? (labelAr[status] ?? status) : status}
    </span>
  )
}

function ActionBtn({
  children, onClick, danger,
}: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold border
        ${danger
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
      {children}
    </button>
  )
}
