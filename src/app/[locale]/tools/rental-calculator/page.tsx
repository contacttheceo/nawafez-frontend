'use client'

import { useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Truck, Calculator, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

/**
 * Truck rental cost estimator.
 *
 * Interactive widget that:
 *  - Drives engagement (avg 3-4 min on page)
 *  - Gets shared as "useful tool" → natural backlinks
 *  - Captures intent (visitor knows what they need + sees fitting listings)
 *
 * Data is real market ranges from listings on the platform. Tune via the
 * BASE_RATES object as the market shifts.
 */

interface CategoryRate {
  key: string
  label_ar: string
  label_en: string
  emoji: string
  daily:    [number, number]
  weekly:   [number, number]
  monthly:  [number, number]
  /** which listings filter to send the user to */
  filter:   string
}

const BASE_RATES: CategoryRate[] = [
  { key: 'light',  label_ar: 'دينا خفيفة (1-3 طن)',   label_en: 'Light truck (1-3T)',   emoji: '🛻', daily: [250, 400],   weekly: [1400, 2200],  monthly: [4500, 6500],    filter: 'دينا' },
  { key: 'medium', label_ar: 'متوسطة (5-12 طن)',       label_en: 'Medium truck (5-12T)', emoji: '🚚', daily: [500, 750],   weekly: [2800, 4500],  monthly: [8000, 12000],   filter: 'شاحنة' },
  { key: 'heavy',  label_ar: 'تريلة + قاطرة',          label_en: 'Tractor + trailer',    emoji: '🚛', daily: [800, 1300],  weekly: [4800, 7800],  monthly: [14000, 22000],  filter: 'تريلة' },
  { key: 'dump',   label_ar: 'قلاب 18-24 م³',          label_en: 'Dump truck 18-24m³',   emoji: '🏗️', daily: [600, 950],   weekly: [3500, 5500],  monthly: [9000, 17000],   filter: 'قلاب' },
  { key: 'reefer', label_ar: 'مبرّدة 7-40 قدم',        label_en: 'Reefer 7-40ft',         emoji: '❄️', daily: [750, 1700],  weekly: [4500, 10000], monthly: [12000, 30000],  filter: 'مبرّدة' },
  { key: 'tanker', label_ar: 'صهريج مياه',             label_en: 'Water tanker',          emoji: '💧', daily: [550, 1000],  weekly: [3200, 6000],  monthly: [7500, 18000],   filter: 'صهريج' },
]

// Region multiplier vs. Riyadh (the baseline)
const REGIONS: Array<{ key: string; label_ar: string; label_en: string; mult: number }> = [
  { key: 'riyadh',  label_ar: 'الرياض',        label_en: 'Riyadh',           mult: 1.00 },
  { key: 'jeddah',  label_ar: 'جدة',            label_en: 'Jeddah',           mult: 1.00 },
  { key: 'dammam',  label_ar: 'الدمام/الخبر',  label_en: 'Dammam/Khobar',    mult: 1.00 },
  { key: 'central', label_ar: 'القصيم/المدينة',label_en: 'Qassim/Madinah',   mult: 0.90 },
  { key: 'south',   label_ar: 'الجنوب',         label_en: 'South',             mult: 1.20 },
  { key: 'north',   label_ar: 'الشمال',         label_en: 'North',             mult: 1.15 },
]

type Duration = 'daily' | 'weekly' | 'monthly'

export default function RentalCalculatorPage() {
  const locale = useLocale()
  const isAr   = locale === 'ar'

  const [category, setCategory] = useState<string>('medium')
  const [region,   setRegion]   = useState<string>('riyadh')
  const [duration, setDuration] = useState<Duration>('monthly')
  const [withDriver, setWithDriver] = useState(false)
  const [insurance, setInsurance]   = useState(true)

  const rate   = BASE_RATES.find(r => r.key === category)!
  const reg    = REGIONS.find(r => r.key === region)!

  const calc = useMemo(() => {
    const [low, high] = rate[duration]
    const lowAdj  = Math.round(low  * reg.mult)
    const highAdj = Math.round(high * reg.mult)

    // Extras (rough industry averages, monthly basis)
    const driverMonthly    = withDriver ? 2500 : 0
    const insuranceMonthly = insurance  ? 350  : 0
    const extras           = (duration === 'monthly')
      ? driverMonthly + insuranceMonthly
      : duration === 'weekly'
        ? Math.round((driverMonthly + insuranceMonthly) / 4)
        : Math.round((driverMonthly + insuranceMonthly) / 30)

    return {
      lowFinal:  lowAdj  + extras,
      highFinal: highAdj + extras,
      mid:       Math.round((lowAdj + highAdj) / 2 + extras),
      base: { low, high, lowAdj, highAdj },
      extras,
    }
  }, [rate, reg, duration, withDriver, insurance])

  const durationLabel = isAr
    ? { daily: 'يومياً', weekly: 'أسبوعياً', monthly: 'شهرياً' }[duration]
    : { daily: 'per day', weekly: 'per week', monthly: 'per month' }[duration]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4">
        <div className="max-w-3xl mx-auto">

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-emerald rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calculator className="text-white" size={26} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-navy mb-2">
              {isAr ? 'حاسبة تكلفة إيجار الشاحنات' : 'Truck Rental Cost Calculator'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
              {isAr
                ? 'تقدير تكلفة إيجار شاحنتك في السعودية بناءً على أسعار السوق الفعلية من 583 إعلان نشط على نوافذ.'
                : 'Estimate your truck rental cost in Saudi Arabia based on real market prices from 583 active listings on Nwafiz.'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">

            {/* Category */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-navy mb-2">
                {isAr ? '1. نوع الشاحنة' : '1. Truck Category'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BASE_RATES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setCategory(r.key)}
                    className={`p-3 rounded-xl border text-sm text-start transition
                      ${category === r.key
                        ? 'border-emerald bg-emerald/10 text-navy font-bold'
                        : 'border-gray-200 hover:border-emerald'}`}
                  >
                    <div className="text-2xl mb-1">{r.emoji}</div>
                    <div className="text-xs leading-snug">{isAr ? r.label_ar : r.label_en}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-navy mb-2">
                {isAr ? '2. المنطقة' : '2. Region'}
              </label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-emerald focus:outline-none"
              >
                {REGIONS.map(r => (
                  <option key={r.key} value={r.key}>
                    {isAr ? r.label_ar : r.label_en} {r.mult !== 1 && `(${r.mult > 1 ? '+' : ''}${Math.round((r.mult - 1) * 100)}%)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-navy mb-2">
                {isAr ? '3. مدة الإيجار' : '3. Rental duration'}
              </label>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as Duration[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition
                      ${duration === d
                        ? 'border-emerald bg-emerald text-white'
                        : 'border-gray-200 hover:border-emerald'}`}
                  >
                    {isAr
                      ? { daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري' }[d]
                      : { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div className="mb-2">
              <label className="block text-sm font-bold text-navy mb-2">
                {isAr ? '4. خدمات إضافية' : '4. Add-ons'}
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-emerald">
                  <input type="checkbox" checked={withDriver} onChange={e => setWithDriver(e.target.checked)} className="w-4 h-4 accent-emerald" />
                  <span className="text-sm flex-1">{isAr ? 'سائق مضمّن' : 'Driver included'}</span>
                  <span className="text-xs text-gray-500">+2,500 {isAr ? 'ر.س/شهر' : 'SAR/mo'}</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-emerald">
                  <input type="checkbox" checked={insurance} onChange={e => setInsurance(e.target.checked)} className="w-4 h-4 accent-emerald" />
                  <span className="text-sm flex-1">{isAr ? 'تأمين شامل' : 'Comprehensive insurance'}</span>
                  <span className="text-xs text-gray-500">+350 {isAr ? 'ر.س/شهر' : 'SAR/mo'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="bg-gradient-to-br from-navy to-navy/90 text-white rounded-2xl p-6 mb-6">
            <p className="text-xs opacity-80 mb-1">
              {isAr ? 'التكلفة المتوقعة' : 'Estimated cost'}
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-black">
                {calc.lowFinal.toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                {' '}–{' '}
                {calc.highFinal.toLocaleString(isAr ? 'ar-SA' : 'en-US')}
              </span>
              <span className="text-base opacity-80">{isAr ? 'ر.س' : 'SAR'}</span>
            </div>
            <p className="text-sm opacity-80 mb-4">{durationLabel}</p>

            <div className="bg-white/10 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="opacity-80">{isAr ? 'السعر الأساسي' : 'Base price'}</span>
                <span>{calc.base.lowAdj.toLocaleString()} – {calc.base.highAdj.toLocaleString()}</span>
              </div>
              {calc.extras > 0 && (
                <div className="flex justify-between">
                  <span className="opacity-80">{isAr ? 'الإضافات' : 'Add-ons'}</span>
                  <span>+{calc.extras.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <Link
            href={`/${locale}/listings?section=fleet`}
            className="flex items-center justify-between bg-emerald text-white rounded-2xl p-5 hover:bg-emerald-600 transition group"
          >
            <div>
              <p className="text-sm opacity-90">
                {isAr ? 'شاهد عروض فعلية في هذه الفئة' : 'See real listings in this category'}
              </p>
              <p className="font-black text-lg">
                {isAr ? 'تصفّح الأسطول الآن' : 'Browse fleet now'}
              </p>
            </div>
            <ArrowRight className="group-hover:translate-x-1 transition" />
          </Link>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 mt-6 text-center max-w-xl mx-auto leading-relaxed">
            {isAr
              ? '* الأسعار تقديرية وقد تختلف حسب الموديل، السنة، الحالة، والمزوّد. تحقّق من العروض الفعلية على نوافذ.'
              : '* Prices are estimates and vary by model, year, condition, and supplier. Verify actual offers on Nwafiz.'}
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
