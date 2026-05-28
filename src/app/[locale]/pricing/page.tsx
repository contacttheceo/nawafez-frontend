'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check, X, Crown, Building2, Briefcase, Sparkles,
  Loader2, Star, ArrowRight, ArrowLeft,
  type LucideIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { plansApi, subscriptionApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import type { Plan, PlanCode, BillingCycle, SubscriptionSnapshot } from '@/types'

const PLAN_ICONS: Record<PlanCode, LucideIcon> = {
  free:         Sparkles,
  basic:        Briefcase,
  professional: Crown,
  enterprise:   Building2,
}

const BADGE_TONE: Record<NonNullable<Plan['badge_color']>, { border: string; bg: string; text: string }> = {
  gray:    { border: 'border-gray-200',    bg: 'bg-white',           text: 'text-gray-600' },
  navy:    { border: 'border-navy/20',     bg: 'bg-navy/5',          text: 'text-navy' },
  emerald: { border: 'border-emerald/30',  bg: 'bg-emerald-bg',      text: 'text-emerald-dark' },
  gold:    { border: 'border-amber-300',   bg: 'bg-amber-50',        text: 'text-amber-700' },
}

export default function PricingPage() {
  const locale  = useLocale()
  const isRTL   = locale === 'ar'
  const router  = useRouter()
  const { isAuthenticated } = useAuthStore()
  const t = (ar: string, en: string) => (isRTL ? ar : en)
  const Arrow = isRTL ? ArrowLeft : ArrowRight

  const [plans,        setPlans]        = useState<Plan[]>([])
  const [current,      setCurrent]      = useState<SubscriptionSnapshot | null>(null)
  const [gracePeriod,  setGracePeriod]  = useState(true)        // default true → safe
  const [cycle,        setCycle]        = useState<BillingCycle>('monthly')
  const [loading,      setLoading]      = useState(true)
  const [upgrading,    setUpgrading]    = useState<PlanCode | null>(null)

  useEffect(() => {
    Promise.all([
      plansApi.list().then((r: any) => {
        // backend returns { data: Plan[], enforcement: { grace_period } }
        if (typeof r.enforcement?.grace_period === 'boolean') {
          setGracePeriod(r.enforcement.grace_period)
        }
        return r.data ?? []
      }),
      isAuthenticated ? subscriptionApi.current().then((r: any) => r.data ?? null).catch(() => null) : null,
    ])
      .then(([plansRes, curRes]) => {
        setPlans(plansRes)
        setCurrent(curRes)
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const handleSubscribe = async (planCode: PlanCode) => {
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login?next=/pricing`)
      return
    }
    if (planCode === 'enterprise') {
      // Enterprise = contact sales (open WhatsApp)
      window.open('https://wa.me/966556716705?text=' + encodeURIComponent(
        t('أرغب بالاشتراك في باقة المؤسسات', 'I am interested in the Enterprise plan')
      ), '_blank')
      return
    }

    setUpgrading(planCode)
    try {
      await subscriptionApi.requestUpgrade(planCode, cycle)
      toast.success(t(
        'تم استلام طلبك! سيتواصل معك فريق الإدارة خلال 24 ساعة لتفعيل الباقة.',
        'Request received! Our team will contact you within 24 hours to activate your plan.'
      ), { duration: 8000 })
      // Refresh current state
      subscriptionApi.current().then((r: any) => setCurrent(r.data ?? null)).catch(() => {})
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t('حدث خطأ، حاول مجدداً', 'Something went wrong, please try again'))
    } finally {
      setUpgrading(null)
    }
  }

  const yearlyDiscount = 16  // basic/pro/enterprise all have ~16% annual savings

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:py-12">

        {/* Grace-period banner — all features free during launch */}
        {gracePeriod && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-emerald to-emerald-dark p-5 sm:p-6 text-white shadow-lg">
            <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Sparkles size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-black text-lg sm:text-xl mb-1">
                  {t(
                    '🎉 جميع الميزات مجانية حالياً!',
                    '🎉 All features are free right now!'
                  )}
                </h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  {t(
                    'نحن في مرحلة الإطلاق — استمتع بكل ميزات Enterprise مجاناً دون أي حدود. الأسعار المعروضة أدناه ستُفعَّل لاحقاً مع إشعار مسبق لكل المستخدمين.',
                    "We're in launch mode — enjoy every Enterprise feature for free with no limits. The pricing below will activate later with advance notice to all users."
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-bg border border-emerald/20 text-emerald-dark text-xs font-semibold mb-4">
            <Star size={12} className="fill-current" />
            {t('باقات نوافذ', 'Nawafez Plans')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy mb-3">
            {t('اختر الباقة المناسبة لك', 'Choose the plan that fits you')}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {t(
              'ابدأ مجاناً وارتقِ متى احتجت — كل باقة تأتي بمزايا مصمّمة لشركات النقل واللوجستيك في السعودية.',
              'Start free and upgrade anytime — every tier is built around the needs of Saudi logistics businesses.'
            )}
          </p>
        </div>

        {/* Cycle toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setCycle('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors
                ${cycle === 'monthly' ? 'bg-navy text-white' : 'text-gray-600 hover:text-navy'}`}
            >
              {t('شهري', 'Monthly')}
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-colors
                ${cycle === 'yearly' ? 'bg-navy text-white' : 'text-gray-600 hover:text-navy'}`}
            >
              {t('سنوي', 'Yearly')}
              <span className="absolute -top-2 -end-2 px-1.5 py-0.5 rounded-full bg-emerald text-white text-[10px] font-bold">
                -{yearlyDiscount}%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-navy" size={32} />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {plans.map((plan) => {
              const Icon  = PLAN_ICONS[plan.code]
              const tone  = BADGE_TONE[plan.badge_color ?? 'gray']
              const price = cycle === 'monthly' ? plan.price_monthly : plan.price_yearly
              const isCurrent = current?.plan.code === plan.code
              const isPopular = plan.code === 'professional'
              const isUnlimited = plan.features.max_listings === -1

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 ${tone.border} ${tone.bg} p-6 flex flex-col
                              ${isPopular ? 'lg:scale-[1.03] shadow-xl' : 'shadow-sm'}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <span className="px-3 py-1 rounded-full bg-emerald text-white text-[11px] font-bold uppercase tracking-wide">
                        {t('الأكثر شيوعاً', 'Most Popular')}
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className={`flex items-center gap-2 mb-3 ${tone.text}`}>
                    <Icon size={20} />
                    <h3 className="font-black text-lg">
                      {isRTL ? plan.name_ar : plan.name_en}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 min-h-[2.5rem]">
                    {isRTL ? plan.tagline_ar : plan.tagline_en}
                  </p>

                  {/* Price */}
                  <div className="mb-5">
                    {plan.code === 'free' ? (
                      <div className="text-3xl font-black text-navy">
                        {t('مجاناً', 'Free')}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-navy">{price.toLocaleString()}</span>
                          <span className="text-sm text-gray-500 font-medium">{t('ر.س', 'SAR')}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {cycle === 'monthly' ? t('شهرياً', '/ month') : t('سنوياً', '/ year')}
                        </p>
                      </>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleSubscribe(plan.code)}
                    disabled={isCurrent || upgrading !== null}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors mb-5
                      ${isCurrent
                        ? 'bg-gray-100 text-gray-500 cursor-default'
                        : isPopular
                          ? 'bg-emerald hover:bg-emerald-dark text-white'
                          : plan.code === 'enterprise'
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-navy hover:bg-navy-dark text-white'}
                      disabled:opacity-60`}
                  >
                    {upgrading === plan.code ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isCurrent ? (
                      t('باقتك الحالية', 'Your current plan')
                    ) : plan.code === 'enterprise' ? (
                      <>{t('تواصل معنا', 'Contact us')} <Arrow size={14} /></>
                    ) : plan.code === 'free' ? (
                      t('ابدأ مجاناً', 'Start Free')
                    ) : (
                      <>{t('اشترك الآن', 'Subscribe')} <Arrow size={14} /></>
                    )}
                  </button>

                  {/* Features */}
                  <ul className="space-y-2.5 text-sm">
                    <Feature ok>
                      {isUnlimited
                        ? t('إعلانات غير محدودة', 'Unlimited listings')
                        : t(`${plan.features.max_listings} إعلانات شهرياً`, `${plan.features.max_listings} listings / month`)}
                    </Feature>
                    <Feature ok={plan.features.has_ma}>
                      {t('إعلانات بيع كيانات (M&A)', 'M&A listings')}
                    </Feature>
                    <Feature ok={plan.features.max_featured_per_month > 0}>
                      {plan.features.max_featured_per_month === -1
                        ? t('إعلانات مميّزة غير محدودة', 'Unlimited featured listings')
                        : plan.features.max_featured_per_month > 0
                          ? t(`${plan.features.max_featured_per_month} إعلانات مميّزة شهرياً`, `${plan.features.max_featured_per_month} featured / month`)
                          : t('بدون إعلانات مميّزة', 'No featured listings')}
                    </Feature>
                    <Feature ok={plan.features.has_trusted_badge}>
                      {t('شارة "موثوق" بجانب اسمك', '"Trusted" badge on profile')}
                    </Feature>
                    <Feature ok={plan.features.auto_renew_listings}>
                      {t('تجديد تلقائي للإعلانات', 'Auto-renew listings')}
                    </Feature>
                    <Feature ok={plan.features.has_blind_bidding}>
                      {t('تقديم عروض blind bidding', 'Blind bidding access')}
                    </Feature>
                    <Feature ok={plan.features.ai_tools_level !== 'limited'}>
                      {plan.features.ai_tools_level === 'priority'
                        ? t('أدوات AI أولوية', 'Priority AI tools')
                        : plan.features.ai_tools_level === 'full'
                          ? t('أدوات AI كاملة', 'Full AI tools')
                          : t('أدوات AI محدودة', 'Limited AI tools')}
                    </Feature>
                    <Feature ok={plan.features.api_access}>
                      {t('وصول API للمطوّرين', 'API access')}
                    </Feature>
                    <Feature ok>
                      {t(
                        plan.features.max_sub_users > 1
                          ? `${plan.features.max_sub_users} حسابات فرعية`
                          : 'حساب فردي',
                        plan.features.max_sub_users > 1
                          ? `${plan.features.max_sub_users} sub-accounts`
                          : 'Single account'
                      )}
                    </Feature>
                    <Feature ok>
                      {plan.features.support_level === 'dedicated_whatsapp'
                        ? t('دعم مخصّص عبر WhatsApp', 'Dedicated WhatsApp support')
                        : plan.features.support_level === 'email_24h'
                          ? t('دعم إيميل خلال 24 ساعة', '24h email support')
                          : plan.features.support_level === 'email_48h'
                            ? t('دعم إيميل خلال 48 ساعة', '48h email support')
                            : t('دعم إيميل خلال 72 ساعة', '72h email support')}
                    </Feature>
                  </ul>
                </div>
              )
            })}
          </div>
        )}

        {/* FAQ pointer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            {t('عندك أسئلة؟', 'Got questions?')}{' '}
            <Link href={`/${locale}/faq`} className="text-emerald-dark font-semibold hover:underline">
              {t('راجع الأسئلة الشائعة', 'Visit our FAQ')}
            </Link>{' '}
            {t('أو تواصل معنا مباشرة عبر', 'or reach us at')}{' '}
            <a href="mailto:support@nwafizlogi.com" className="text-emerald-dark font-semibold hover:underline">
              support@nwafizlogi.com
            </a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}

/** Small row used inside the feature list — checkmark or muted X */
function Feature({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      {ok
        ? <Check size={16} className="shrink-0 mt-0.5 text-emerald" />
        : <X size={16} className="shrink-0 mt-0.5 text-gray-300" />}
      <span className={ok ? 'text-gray-700' : 'text-gray-400 line-through'}>{children}</span>
    </li>
  )
}
