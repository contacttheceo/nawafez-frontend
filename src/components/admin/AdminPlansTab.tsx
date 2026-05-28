'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import {
  Loader2, Save, Crown, Building2, Briefcase, Sparkles,
  Users as UsersIcon, Eye, EyeOff, ChevronDown, ChevronUp,
  type LucideIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminSubscriptionApi } from '@/lib/api'
import type { Plan, PlanCode, PlanFeatures } from '@/types'

/**
 * Admin → Plans tab.
 *
 * One row per plan. Click "تعديل" to expand an inline editor with:
 *   - Monthly + Yearly prices (number inputs)
 *   - is_active toggle
 *   - Arabic + English name + tagline
 *   - Every PlanFeatures field — numbers as inputs, booleans as toggles,
 *     enums as selects. Validates -1 means unlimited.
 *
 * On "حفظ" we PATCH /api/admin/plans/{id}. No deploy needed.
 * On "إلغاء" we collapse without saving.
 *
 * Each plan also shows its active-subscriber count for at-a-glance impact.
 */

const PLAN_ICONS: Record<PlanCode, LucideIcon> = {
  free:         Sparkles,
  basic:        Briefcase,
  professional: Crown,
  enterprise:   Building2,
}

const AI_LEVELS    = ['limited', 'full', 'priority'] as const
const ANAL_LEVELS  = ['basic', 'intermediate', 'advanced', 'advanced_export'] as const
const SUP_LEVELS   = ['email_72h', 'email_48h', 'email_24h', 'dedicated_whatsapp'] as const

export default function AdminPlansTab() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const t = (ar: string, en: string) => (isRTL ? ar : en)

  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const reload = () => {
    setLoading(true)
    adminSubscriptionApi.plans()
      .then((r: any) => setPlans(r.data ?? []))
      .catch(() => toast.error(t('فشل تحميل الباقات', 'Failed to load plans')))
      .finally(() => setLoading(false))
  }
  useEffect(reload, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-navy" size={28} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-navy">{t('الباقات', 'Plans')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t(
              'عدّل الأسعار والميزات مباشرة — التغييرات تظهر فوراً للمستخدمين.',
              'Edit prices and features directly — changes go live instantly.'
            )}
          </p>
        </div>
        <button
          onClick={reload}
          className="text-xs text-gray-500 hover:text-navy"
        >
          {t('تحديث', 'Refresh')}
        </button>
      </div>

      {plans.map((plan) => (
        <PlanRow
          key={plan.id}
          plan={plan}
          expanded={expandedId === plan.id}
          onToggle={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
          onSaved={(updated) => {
            setPlans((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
            setExpandedId(null)
          }}
        />
      ))}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
function PlanRow({
  plan, expanded, onToggle, onSaved,
}: {
  plan: Plan
  expanded: boolean
  onToggle: () => void
  onSaved: (p: Plan) => void
}) {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const t = (ar: string, en: string) => (isRTL ? ar : en)
  const Icon = PLAN_ICONS[plan.code]

  // Local form state — copies of editable fields
  const [draft, setDraft] = useState({
    name_ar:       plan.name_ar,
    name_en:       plan.name_en,
    tagline_ar:    plan.tagline_ar ?? '',
    tagline_en:    plan.tagline_en ?? '',
    price_monthly: plan.price_monthly,
    price_yearly:  plan.price_yearly,
    is_active:     plan.is_active,
    features:      { ...plan.features } as PlanFeatures,
  })
  const [saving, setSaving] = useState(false)

  // Reset draft whenever the plan changes externally (e.g. reload)
  useEffect(() => {
    setDraft({
      name_ar:       plan.name_ar,
      name_en:       plan.name_en,
      tagline_ar:    plan.tagline_ar ?? '',
      tagline_en:    plan.tagline_en ?? '',
      price_monthly: plan.price_monthly,
      price_yearly:  plan.price_yearly,
      is_active:     plan.is_active,
      features:      { ...plan.features },
    })
  }, [plan])

  const setFeature = <K extends keyof PlanFeatures>(key: K, val: PlanFeatures[K]) =>
    setDraft((d) => ({ ...d, features: { ...d.features, [key]: val } }))

  const save = async () => {
    setSaving(true)
    try {
      const res: any = await adminSubscriptionApi.updatePlan(plan.id, draft)
      toast.success(t('تم الحفظ ✓', 'Saved ✓'))
      onSaved(res.data ?? { ...plan, ...draft } as Plan)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t('فشل الحفظ', 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-start"
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center
          ${plan.code === 'free'         ? 'bg-gray-100 text-gray-600' :
            plan.code === 'basic'        ? 'bg-navy/10 text-navy' :
            plan.code === 'professional' ? 'bg-emerald-bg text-emerald-dark' :
                                           'bg-amber-50 text-amber-700'}`}>
          <Icon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-navy text-sm">
              {isRTL ? plan.name_ar : plan.name_en}
            </span>
            <span className="text-xs text-gray-400 font-mono">{plan.code}</span>
            {!plan.is_active && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-semibold">
                <EyeOff size={10} /> {t('معطّلة', 'Disabled')}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {plan.code === 'free' || plan.price_monthly === 0
              ? t('مجاناً', 'Free')
              : t(`${plan.price_monthly} ر.س/شهر · ${plan.price_yearly} ر.س/سنة`,
                  `${plan.price_monthly} SAR/mo · ${plan.price_yearly} SAR/yr`)}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <UsersIcon size={12} />
            {plan.subscriptions_count ?? 0}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Inline editor */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-5">

          {/* Status toggle */}
          <Field label={t('الحالة', 'Status')}>
            <button
              onClick={() => setDraft({ ...draft, is_active: !draft.is_active })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                ${draft.is_active
                  ? 'bg-emerald-bg text-emerald-dark border border-emerald/20'
                  : 'bg-gray-200 text-gray-600 border border-gray-300'}`}
            >
              {draft.is_active
                ? <><Eye size={12} /> {t('مفعّلة (تظهر للمستخدمين)', 'Active (visible)')}</>
                : <><EyeOff size={12} /> {t('معطّلة (مخفية)', 'Disabled (hidden)')}</>}
            </button>
          </Field>

          {/* Names */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={t('الاسم بالعربي', 'Arabic name')}>
              <input value={draft.name_ar} onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })}
                className="input text-sm" />
            </Field>
            <Field label={t('الاسم بالإنجليزي', 'English name')}>
              <input value={draft.name_en} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                className="input text-sm" />
            </Field>
            <Field label={t('وصف عربي', 'Arabic tagline')}>
              <input value={draft.tagline_ar} onChange={(e) => setDraft({ ...draft, tagline_ar: e.target.value })}
                className="input text-sm" />
            </Field>
            <Field label={t('وصف إنجليزي', 'English tagline')}>
              <input value={draft.tagline_en} onChange={(e) => setDraft({ ...draft, tagline_en: e.target.value })}
                className="input text-sm" />
            </Field>
          </div>

          {/* Prices */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={t('السعر الشهري (ر.س)', 'Monthly price (SAR)')}>
              <input type="number" min={0} value={draft.price_monthly}
                onChange={(e) => setDraft({ ...draft, price_monthly: Math.max(0, parseInt(e.target.value || '0')) })}
                className="input text-sm" />
            </Field>
            <Field label={t('السعر السنوي (ر.س)', 'Yearly price (SAR)')}>
              <input type="number" min={0} value={draft.price_yearly}
                onChange={(e) => setDraft({ ...draft, price_yearly: Math.max(0, parseInt(e.target.value || '0')) })}
                className="input text-sm" />
            </Field>
          </div>

          {/* Features — numeric */}
          <SectionHeader>{t('حدود الاستخدام', 'Usage limits')}</SectionHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <NumField  label={t('أقصى عدد إعلانات شهرياً', 'Max listings / month')}
                      value={draft.features.max_listings}
                      onChange={(v) => setFeature('max_listings', v)}
                      hint={t('استخدم -1 لجعلها غير محدودة', 'Use -1 for unlimited')} />
            <NumField  label={t('إعلانات مميّزة شهرياً', 'Featured / month')}
                      value={draft.features.max_featured_per_month}
                      onChange={(v) => setFeature('max_featured_per_month', v)}
                      hint={t('-1 = غير محدود', '-1 = unlimited')} />
            <NumField  label={t('حسابات فرعية', 'Sub-accounts')}
                      value={draft.features.max_sub_users}
                      onChange={(v) => setFeature('max_sub_users', v)} />
          </div>

          {/* Features — booleans */}
          <SectionHeader>{t('الميزات', 'Features')}</SectionHeader>
          <div className="grid sm:grid-cols-2 gap-2">
            <Toggle label={t('إعلانات M&A', 'M&A listings')}
                    on={draft.features.has_ma} onChange={(v) => setFeature('has_ma', v)} />
            <Toggle label={t('تثبيت إعلان', 'Pin listing')}
                    on={draft.features.has_pin} onChange={(v) => setFeature('has_pin', v)} />
            <Toggle label={t('تجديد آلي للإعلانات', 'Auto-renew listings')}
                    on={draft.features.auto_renew_listings} onChange={(v) => setFeature('auto_renew_listings', v)} />
            <Toggle label={t('شارة "موثوق"', 'Trusted badge')}
                    on={draft.features.has_trusted_badge} onChange={(v) => setFeature('has_trusted_badge', v)} />
            <Toggle label={t('Blind bidding', 'Blind bidding')}
                    on={draft.features.has_blind_bidding} onChange={(v) => setFeature('has_blind_bidding', v)} />
            <Toggle label={t('وصول API', 'API access')}
                    on={draft.features.api_access} onChange={(v) => setFeature('api_access', v)} />
          </div>

          {/* Features — enums */}
          <SectionHeader>{t('المستويات', 'Tier levels')}</SectionHeader>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label={t('أدوات AI', 'AI tools')}>
              <select className="input text-sm"
                value={draft.features.ai_tools_level}
                onChange={(e) => setFeature('ai_tools_level', e.target.value as PlanFeatures['ai_tools_level'])}>
                {AI_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label={t('الإحصائيات', 'Analytics')}>
              <select className="input text-sm"
                value={draft.features.analytics_level}
                onChange={(e) => setFeature('analytics_level', e.target.value as PlanFeatures['analytics_level'])}>
                {ANAL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label={t('الدعم الفني', 'Support')}>
              <select className="input text-sm"
                value={draft.features.support_level}
                onChange={(e) => setFeature('support_level', e.target.value as PlanFeatures['support_level'])}>
                {SUP_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button onClick={onToggle}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              {t('إلغاء', 'Cancel')}
            </button>
            <button onClick={save} disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald hover:bg-emerald-dark disabled:opacity-60 inline-flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {t('حفظ التغييرات', 'Save changes')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tiny presentational helpers ─────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-1">{children}</h4>
}

function NumField({ label, value, onChange, hint }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string
}) {
  return (
    <Field label={label}>
      <input type="number" value={value}
        onChange={(e) => onChange(parseInt(e.target.value || '0'))}
        className="input text-sm" />
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </Field>
  )
}

function Toggle({ label, on, onChange }: {
  label: string; on: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors
        ${on
          ? 'bg-emerald-bg border border-emerald/20 text-emerald-dark'
          : 'bg-white border border-gray-200 text-gray-500'}`}
    >
      <span className="text-start">{label}</span>
      <span className={`w-8 h-4 rounded-full relative transition-colors shrink-0
        ${on ? 'bg-emerald' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all
          ${on ? 'end-0.5' : 'start-0.5'}`} />
      </span>
    </button>
  )
}
