'use client'

import { useEffect, useState, useRef } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Sparkles, FileText, MessageSquare, Search, BarChart3, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

/* ── Feature cards data ──────────────────────────────────────────── */
const FEATURES_AR = [
  {
    icon:  Search,
    color: 'from-violet-500 to-purple-600',
    bg:    'bg-violet-50 border-violet-100',
    iconBg: 'bg-violet-100 text-violet-600',
    title: 'بحث ذكي بالجملة الطبيعية',
    desc:  'اكتب "شاحنة مبردة للإيجار في جدة بأقل من 8000" — يضبط الفلاتر تلقائياً بدون نقرة واحدة',
    badge: '✨ في صفحة البحث',
    href:  '/ar/listings',
  },
  {
    icon:  Sparkles,
    color: 'from-emerald-500 to-teal-600',
    bg:    'bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-100 text-emerald-600',
    title: 'كاتب الإعلانات الذكي',
    desc:  'أدخل البيانات الأساسية وضغطة واحدة تحوّلها لإعلان احترافي بالعربي والإنجليزي',
    badge: '✨ عند إنشاء إعلان',
    href:  '/ar/listings/create',
  },
  {
    icon:  MessageSquare,
    color: 'from-blue-500 to-indigo-600',
    bg:    'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'ردود رسائل مقترحة',
    desc:  'AI يقترح 3 ردود مهنية مناسبة للسياق — نقرة واحدة ترسلها',
    badge: '✨ في صفحة الرسائل',
    href:  '/ar/messages',
  },
  {
    icon:  FileText,
    color: 'from-amber-500 to-orange-600',
    bg:    'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100 text-amber-600',
    title: 'محلل العقود الذكي',
    desc:  'ارفع PDF عقدك — يلخّص البنود الرئيسية ويكشف بنود الخطورة خلال ثوانٍ',
    badge: '✨ في أدوات AI',
    href:  '/ar/tools',
  },
  {
    icon:  BarChart3,
    color: 'from-pink-500 to-rose-600',
    bg:    'bg-pink-50 border-pink-100',
    iconBg: 'bg-pink-100 text-pink-600',
    title: 'مستشار تحسين الإعلانات',
    desc:  'نصائح ذكية مخصصة لكل إعلان: "أضف صوراً لمضاعفة المشاهدات" و"السعر أعلى من السوق 20%"',
    badge: '✨ في لوحة التحكم',
    href:  '/ar/dashboard',
  },
]

const FEATURES_EN = [
  {
    icon:  Search,
    color: 'from-violet-500 to-purple-600',
    bg:    'bg-violet-50 border-violet-100',
    iconBg: 'bg-violet-100 text-violet-600',
    title: 'Natural Language Search',
    desc:  'Type "refrigerated truck for rent in Jeddah under 8000" — filters set automatically, no clicks needed',
    badge: '✨ On search page',
    href:  '/en/listings',
  },
  {
    icon:  Sparkles,
    color: 'from-emerald-500 to-teal-600',
    bg:    'bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-100 text-emerald-600',
    title: 'AI Listing Writer',
    desc:  'Enter basic info, one click turns it into a professional bilingual listing',
    badge: '✨ When creating a listing',
    href:  '/en/listings/create',
  },
  {
    icon:  MessageSquare,
    color: 'from-blue-500 to-indigo-600',
    bg:    'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'Smart Reply Suggestions',
    desc:  'AI suggests 3 professional context-aware replies — tap to send instantly',
    badge: '✨ In messages',
    href:  '/en/messages',
  },
  {
    icon:  FileText,
    color: 'from-amber-500 to-orange-600',
    bg:    'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100 text-amber-600',
    title: 'AI Contract Analyzer',
    desc:  'Upload any PDF contract — key clauses and risk flags summarized in seconds',
    badge: '✨ In AI Tools',
    href:  '/en/tools',
  },
  {
    icon:  BarChart3,
    color: 'from-pink-500 to-rose-600',
    bg:    'bg-pink-50 border-pink-100',
    iconBg: 'bg-pink-100 text-pink-600',
    title: 'Listing Improvement Advisor',
    desc:  'Personalized tips per listing: "Add photos to 3× your views" and "Price is 20% above market"',
    badge: '✨ In dashboard',
    href:  '/en/dashboard',
  },
]

/* ── Typing Demo ─────────────────────────────────────────────────── */
const DEMO_TEXT_AR = 'شاحنة مرسيدس أكتروس 2020 للبيع بـ 180 ألف ريال، عداد 95 ألف كم، الرياض'
const DEMO_TEXT_EN = 'Mercedes Actros 2020 truck for sale, 180K SAR, 95K km, Riyadh'

const DEMO_FIELDS_AR = [
  { label: 'القسم',     value: 'أسطول'            },
  { label: 'النوع',     value: 'للبيع'            },
  { label: 'المركبة',  value: 'شاحنة'            },
  { label: 'الماركة',  value: 'مرسيدس'           },
  { label: 'السنة',    value: '2020'              },
  { label: 'السعر',    value: '180,000 ر.س'       },
  { label: 'العداد',   value: '95,000 كم'         },
  { label: 'المدينة',  value: 'الرياض'            },
]

const DEMO_FIELDS_EN = [
  { label: 'Section',   value: 'Fleet'             },
  { label: 'Type',      value: 'For Sale'          },
  { label: 'Vehicle',   value: 'Truck'             },
  { label: 'Brand',     value: 'Mercedes'          },
  { label: 'Year',      value: '2020'              },
  { label: 'Price',     value: '180,000 SAR'       },
  { label: 'Mileage',   value: '95,000 km'         },
  { label: 'City',      value: 'Riyadh'            },
]

function TypingDemo({ isRTL }: { isRTL: boolean }) {
  const FULL_TEXT   = isRTL ? DEMO_TEXT_AR : DEMO_TEXT_EN
  const DEMO_FIELDS = isRTL ? DEMO_FIELDS_AR : DEMO_FIELDS_EN

  type Phase = 'idle' | 'typing' | 'analyzing' | 'result' | 'clearing'
  const [phase,         setPhase]         = useState<Phase>('idle')
  const [displayedText, setDisplayedText] = useState('')
  const [visibleFields, setVisibleFields] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const addTimer = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }

  const runDemo = () => {
    clear()
    setPhase('idle')
    setDisplayedText('')
    setVisibleFields(0)

    // Phase 1: start typing after 800ms
    addTimer(() => {
      setPhase('typing')
      let i = 0
      const typeChar = () => {
        i++
        setDisplayedText(FULL_TEXT.slice(0, i))
        if (i < FULL_TEXT.length) {
          const delay = 30 + Math.random() * 25
          addTimer(typeChar, delay)
        } else {
          // Phase 2: analyzing
          addTimer(() => {
            setPhase('analyzing')
            // Phase 3: show fields one by one
            addTimer(() => {
              setPhase('result')
              DEMO_FIELDS.forEach((_, idx) => {
                addTimer(() => setVisibleFields(idx + 1), idx * 160)
              })
              // Phase 4: hold then clear
              addTimer(() => {
                setPhase('clearing')
                addTimer(runDemo, 1200)
              }, DEMO_FIELDS.length * 160 + 2800)
            }, 1400)
          }, 400)
        }
      }
      typeChar()
    }, 800)
  }

  useEffect(() => {
    runDemo()
    return clear
  }, [isRTL])

  return (
    <div className={`bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden
                     transition-opacity duration-700 ${phase === 'clearing' ? 'opacity-0' : 'opacity-100'}`}>
      {/* Header bar */}
      <div className="bg-gradient-to-r from-navy to-[#1E3A8A] px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <span className="text-white/60 text-[11px] mx-auto font-mono">
          {isRTL ? '✨ المحلل الذكي — نوافذ' : '✨ AI Extractor — Nwafiz'}
        </span>
      </div>

      {/* Input area */}
      <div className="px-4 pt-4 pb-3">
        <div className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wider">
          {isRTL ? 'اكتب وصف إعلانك' : 'Describe your listing'}
        </div>
        <div className={`min-h-[52px] bg-gray-50 rounded-xl border px-3 py-2.5 text-sm
                         font-mono leading-relaxed transition-colors
                         ${phase === 'analyzing' ? 'border-violet-400 bg-violet-50/30' : 'border-gray-200'}`}
             dir={isRTL ? 'rtl' : 'ltr'}>
          {displayedText}
          {(phase === 'typing') && (
            <span className="inline-block w-0.5 h-4 bg-navy ms-0.5 animate-[blink_0.8s_step-end_infinite]" />
          )}
          {!displayedText && phase === 'idle' && (
            <span className="text-gray-300">
              {isRTL ? 'اكتب وصفاً لإعلانك...' : 'Describe your listing...'}
            </span>
          )}
        </div>
      </div>

      {/* Analyzing indicator */}
      <div className={`px-4 transition-all duration-300 overflow-hidden
                       ${phase === 'analyzing' ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex items-center gap-2 py-2 text-violet-600 text-xs font-medium">
          <Loader2 size={13} className="animate-spin" />
          {isRTL ? 'يحلل ويستخرج البيانات...' : 'Analyzing and extracting fields...'}
        </div>
      </div>

      {/* Extracted fields */}
      <div className={`px-4 pb-4 transition-all duration-300
                       ${phase === 'result' || phase === 'clearing' ? 'opacity-100' : 'opacity-0'}`}>
        {phase === 'result' || phase === 'clearing' ? (
          <>
            <div className="text-[10px] text-emerald font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <CheckCircle2 size={11} />
              {isRTL ? 'تم الاستخراج بنجاح' : 'Extracted successfully'}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_FIELDS.slice(0, visibleFields).map((field) => (
                <div key={field.label}
                     className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5
                                animate-[fadeInScale_0.3s_ease-out]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald shrink-0" />
                  <span className="text-[10px] text-gray-400 shrink-0">{field.label}:</span>
                  <span className="text-[11px] font-bold text-navy truncate">{field.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

/* ── Main Section ────────────────────────────────────────────────── */
export default function AIFeaturesSection() {
  const locale  = useLocale()
  const isRTL   = locale === 'ar'
  const features = isRTL ? FEATURES_AR : FEATURES_EN
  const Arrow = isRTL ? ArrowLeft : ArrowRight

  return (
    <section className="relative bg-gradient-to-br from-[#3B4A65] via-[#526483] to-[#3B4A65]
                        py-24 px-6 overflow-hidden">

      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 start-1/4 w-96 h-96 bg-violet-600/10
                        rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 end-1/4 w-80 h-80 bg-emerald/8
                        rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite_2s]" />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2
                        w-64 h-64 bg-blue-600/8 rounded-full blur-2xl
                        animate-[pulse_7s_ease-in-out_infinite_1s]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30
                          text-violet-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-5">
            <Sparkles size={14} className="animate-[pulse_2s_ease-in-out_infinite]" />
            {isRTL ? 'مدعومة بالذكاء الاصطناعي' : 'Powered by AI'}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            {isRTL
              ? <>منصة لوجستية ذكية<br /><span className="text-violet-400">تعمل معك، لا بدلاً عنك</span></>
              : <>A Smart Logistics Platform<br /><span className="text-violet-400">that works with you, not for you</span></>
            }
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            {isRTL
              ? '5 أدوات ذكاء اصطناعي مدمجة مباشرة في مسار عملك اليومي'
              : '5 AI tools embedded directly in your daily workflow'}
          </p>
        </div>

        {/* Two-column layout: features list + live demo */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: feature cards */}
          <div className="space-y-3">
            {features.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.title}
                  className="group flex items-start gap-4 bg-white/5 hover:bg-white/10
                             border border-white/10 hover:border-white/20
                             rounded-2xl px-5 py-4 transition-all duration-300 cursor-pointer
                             animate-[fadeInLeft_0.5s_ease-out_both]"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color}
                                   flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-sm">{feat.title}</h3>
                      <span className="text-[9px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full shrink-0">
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-white/50 text-xs leading-relaxed">{feat.desc}</p>
                  </div>
                  <Arrow size={14} className="text-white/20 group-hover:text-white/60
                                              transition-colors shrink-0 mt-1" />
                </div>
              )
            })}

            {/* CTA */}
            <Link
              href={`/${locale}/tools`}
              className="flex items-center justify-center gap-2 w-full mt-4 py-3.5
                         bg-gradient-to-r from-violet-600 to-purple-600
                         hover:from-violet-500 hover:to-purple-500
                         text-white font-bold rounded-2xl transition-all duration-200
                         hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
            >
              <Sparkles size={16} />
              {isRTL ? 'استكشف جميع أدوات AI' : 'Explore all AI tools'}
              <Arrow size={14} />
            </Link>
          </div>

          {/* Right: live typing demo */}
          <div className="relative">
            {/* Glow behind the card */}
            <div className="absolute -inset-4 bg-violet-500/20 rounded-3xl blur-2xl" />

            {/* Demo label */}
            <div className="relative mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="text-white/40 text-xs font-mono uppercase tracking-wider">
                {isRTL ? 'عرض حي — المحلل الذكي' : 'Live demo — AI Extractor'}
              </span>
            </div>

            <div className="relative">
              <TypingDemo isRTL={isRTL} />
            </div>

            {/* Bottom hint */}
            <p className="text-center text-white/25 text-xs mt-4 font-mono">
              {isRTL
                ? '↑ محاكاة حية — جرّبه الآن في صفحة الإنشاء'
                : '↑ live simulation — try it now on create page'}
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
