'use client'

import { useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Truck, Calculator, ArrowRight, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

/**
 * Truck monthly operating cost calculator.
 *
 * Targets high-intent Arabic searches like "تكلفة تشغيل شاحنة" and
 * "مصاريف شاحنة شهرياً". The output is a real breakdown a fleet owner
 * would actually screenshot and share on WhatsApp.
 *
 * Numbers are grounded in real Saudi market ranges pulled from listings
 * on the platform + fuel/insurance/maintenance industry data.
 */

interface CategoryDefault {
  key: string
  label_ar: string
  label_en: string
  emoji: string
  // Consumption + fuel type
  fuel_type: 'diesel' | 'gasoline'
  km_per_liter: number
  // Insurance monthly baseline (SAR)
  insurance_monthly: [number, number]
  // Maintenance monthly (SAR)
  maintenance_monthly: [number, number]
  // Tire replacement cost / months
  tire_cost: number
  tire_months: number
  // Government fees per year (registration + inspection)
  annual_fees: number
  filter: string
}

const CATEGORIES: CategoryDefault[] = [
  { key: 'light',   label_ar: 'دينا خفيفة (1-3 طن)',    label_en: 'Light truck (1-3T)',   emoji: '🛻',
    fuel_type: 'diesel', km_per_liter: 8.5,
    insurance_monthly: [250, 400], maintenance_monthly: [300, 600],
    tire_cost: 3000, tire_months: 18, annual_fees: 800, filter: 'دينا' },
  { key: 'medium',  label_ar: 'شاحنة متوسطة (5-12 طن)', label_en: 'Medium truck (5-12T)', emoji: '🚚',
    fuel_type: 'diesel', km_per_liter: 5.5,
    insurance_monthly: [400, 650], maintenance_monthly: [600, 1200],
    tire_cost: 6500, tire_months: 15, annual_fees: 1200, filter: 'شاحنة' },
  { key: 'heavy',   label_ar: 'تريلة + قاطرة',           label_en: 'Tractor + trailer',    emoji: '🚛',
    fuel_type: 'diesel', km_per_liter: 3.2,
    insurance_monthly: [700, 1100], maintenance_monthly: [900, 1800],
    tire_cost: 14000, tire_months: 14, annual_fees: 2400, filter: 'تريلة' },
  { key: 'dump',    label_ar: 'قلاب 18-24 م³',           label_en: 'Dump truck 18-24m³',   emoji: '🏗️',
    fuel_type: 'diesel', km_per_liter: 4.0,
    insurance_monthly: [550, 900], maintenance_monthly: [800, 1500],
    tire_cost: 10000, tire_months: 12, annual_fees: 1600, filter: 'قلاب' },
  { key: 'reefer',  label_ar: 'شاحنة مبرّدة',           label_en: 'Refrigerated truck',   emoji: '❄️',
    fuel_type: 'diesel', km_per_liter: 4.8,
    insurance_monthly: [650, 1000], maintenance_monthly: [1000, 2000],
    tire_cost: 8500, tire_months: 15, annual_fees: 1800, filter: 'مبرّدة' },
  { key: 'tanker',  label_ar: 'صهريج مياه',              label_en: 'Water tanker',          emoji: '💧',
    fuel_type: 'diesel', km_per_liter: 4.5,
    insurance_monthly: [500, 800], maintenance_monthly: [700, 1400],
    tire_cost: 7500, tire_months: 16, annual_fees: 1400, filter: 'صهريج' },
]

// Fuel prices (SAR/liter) — official Aramco 2026
const FUEL_PRICES = { diesel: 1.66, gasoline: 2.33 }

export default function OperatingCostCalculatorPage() {
  const locale = useLocale()
  const isAr   = locale === 'ar'

  const [category, setCategory] = useState<string>('medium')
  const [kmPerMonth, setKmPerMonth] = useState<number>(4000)
  const [driverSalary, setDriverSalary] = useState<number>(4500)
  const [financeMonthly, setFinanceMonthly] = useState<number>(0)
  const [premiumMaintenance, setPremiumMaintenance] = useState(false)

  const rate = CATEGORIES.find(c => c.key === category)!

  const calc = useMemo(() => {
    const liters = kmPerMonth / rate.km_per_liter
    const fuelCost = Math.round(liters * FUEL_PRICES[rate.fuel_type])

    const insuranceLow  = rate.insurance_monthly[0]
    const insuranceHigh = rate.insurance_monthly[1]
    const insuranceMid  = Math.round((insuranceLow + insuranceHigh) / 2)

    const maintFactor = premiumMaintenance ? 1.35 : 1
    const maintLow  = Math.round(rate.maintenance_monthly[0] * maintFactor)
    const maintHigh = Math.round(rate.maintenance_monthly[1] * maintFactor)
    const maintMid  = Math.round((maintLow + maintHigh) / 2)

    const tireMonthly = Math.round(rate.tire_cost / rate.tire_months)
    const feesMonthly = Math.round(rate.annual_fees / 12)

    const totalLow  = fuelCost + insuranceLow  + maintLow  + tireMonthly + feesMonthly + driverSalary + financeMonthly
    const totalHigh = fuelCost + insuranceHigh + maintHigh + tireMonthly + feesMonthly + driverSalary + financeMonthly
    const totalMid  = Math.round((totalLow + totalHigh) / 2)

    return {
      fuel: fuelCost, liters: Math.round(liters),
      insuranceLow, insuranceHigh, insuranceMid,
      maintLow, maintHigh, maintMid,
      tireMonthly, feesMonthly,
      driverSalary, financeMonthly,
      totalLow, totalHigh, totalMid,
      revenuePerKm: {
        // Break-even revenue: sum / km/month (SAR per km driven)
        low:  totalLow  / kmPerMonth,
        high: totalHigh / kmPerMonth,
      },
    }
  }, [rate, kmPerMonth, driverSalary, financeMonthly, premiumMaintenance])

  const t = (ar: string, en: string) => (isAr ? ar : en)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calculator className="text-white" size={26} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-navy mb-2">
              {t('حاسبة تكلفة تشغيل شاحنة شهرياً', 'Truck Monthly Operating Cost Calculator')}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              {t(
                'اعرف تكلفة تشغيل شاحنتك الفعلية شهرياً — الوقود، التأمين، الصيانة، الإطارات، رسوم الجهات، الراتب، والتمويل — بأرقام السوق السعودي.',
                'Know your truck\'s real monthly cost — fuel, insurance, maintenance, tires, government fees, salary, and financing — with real Saudi market numbers.'
              )}
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Form (left, 3 cols) */}
            <div className="lg:col-span-3 space-y-4">

              {/* Category */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-navy mb-3">
                  {t('1. نوع الشاحنة', '1. Truck Category')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={`p-3 rounded-xl border text-sm text-start transition
                        ${category === c.key ? 'border-emerald bg-emerald/10 text-navy font-bold' : 'border-gray-200 hover:border-emerald'}`}
                    >
                      <div className="text-2xl mb-1">{c.emoji}</div>
                      <div className="text-xs leading-snug">{isAr ? c.label_ar : c.label_en}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Usage */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-navy mb-3">
                  {t('2. الاستخدام الشهري', '2. Monthly Usage')}
                </h3>
                <label className="block text-xs text-gray-600 mb-1">
                  {t('المسافة الشهرية (كم)', 'Kilometers per month')}
                </label>
                <input
                  type="range"
                  min={500} max={20000} step={500}
                  value={kmPerMonth}
                  onChange={e => setKmPerMonth(Number(e.target.value))}
                  className="w-full accent-emerald"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">500</span>
                  <span className="text-navy font-bold">{kmPerMonth.toLocaleString()} كم</span>
                  <span className="text-gray-500">20,000</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t(
                    `= ${Math.round(kmPerMonth / rate.km_per_liter)} لتر ديزل شهرياً (استهلاك ${rate.km_per_liter} كم/لتر)`,
                    `= ${Math.round(kmPerMonth / rate.km_per_liter)}L diesel/month (${rate.km_per_liter} km/L)`
                  )}
                </p>
              </div>

              {/* Driver + finance */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-navy mb-3">
                  {t('3. مصاريف إضافية', '3. Additional Expenses')}
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {t('راتب السائق', 'Driver salary')}
                    </label>
                    <input
                      type="number" min={0} step={500}
                      value={driverSalary}
                      onChange={e => setDriverSalary(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-emerald focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {t('قسط تمويل شهري', 'Monthly loan payment')}
                    </label>
                    <input
                      type="number" min={0} step={500}
                      value={financeMonthly}
                      onChange={e => setFinanceMonthly(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-emerald focus:outline-none"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={premiumMaintenance}
                    onChange={e => setPremiumMaintenance(e.target.checked)}
                    className="w-4 h-4 accent-emerald"
                  />
                  <span className="text-xs text-gray-700">
                    {t('صيانة وقائية دورية (يرفع 35% لكن يوفر الأعطال)', 'Preventive maintenance (+35% but avoids breakdowns)')}
                  </span>
                </label>
              </div>
            </div>

            {/* Results (right, 2 cols) */}
            <div className="lg:col-span-2 space-y-4">

              {/* Total */}
              <div className="bg-gradient-to-br from-navy to-navy/90 text-white rounded-2xl p-6">
                <p className="text-xs opacity-80 mb-1">
                  {t('التكلفة الإجمالية شهرياً', 'Total monthly cost')}
                </p>
                <div className="text-3xl sm:text-4xl font-black mb-1 leading-none">
                  {calc.totalLow.toLocaleString()} –
                </div>
                <div className="text-3xl sm:text-4xl font-black leading-none">
                  {calc.totalHigh.toLocaleString()}
                  <span className="text-base font-normal opacity-70 ms-1">{t('ر.س', 'SAR')}</span>
                </div>
                <p className="text-xs opacity-70 mt-3">
                  {t(`المتوسط ~ ${calc.totalMid.toLocaleString()} ر.س`, `Avg ~ ${calc.totalMid.toLocaleString()} SAR`)}
                </p>
              </div>

              {/* Breakdown */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-navy mb-3">
                  {t('التفصيل', 'Breakdown')}
                </h3>
                <div className="space-y-2 text-sm">
                  <Row label={t('⛽ الوقود', '⛽ Fuel')}                  value={calc.fuel} />
                  <Row label={t('🛡️ التأمين', '🛡️ Insurance')}          value={calc.insuranceMid} range={`${calc.insuranceLow}–${calc.insuranceHigh}`} />
                  <Row label={t('🔧 الصيانة', '🔧 Maintenance')}        value={calc.maintMid} range={`${calc.maintLow}–${calc.maintHigh}`} />
                  <Row label={t('🛞 الإطارات', '🛞 Tires')}              value={calc.tireMonthly} />
                  <Row label={t('📋 رسوم حكومية', '📋 Gov. fees')}      value={calc.feesMonthly} />
                  {driverSalary > 0 && <Row label={t('👤 السائق', '👤 Driver')}  value={driverSalary} />}
                  {financeMonthly > 0 && <Row label={t('🏦 التمويل', '🏦 Finance')} value={financeMonthly} />}
                </div>
              </div>

              {/* Revenue per km hint */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-bold text-amber-900 mb-1">
                    {t('نقطة التعادل', 'Break-even')}
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {t(
                      `لتغطية التكلفة تحتاج ${calc.revenuePerKm.low.toFixed(2)}-${calc.revenuePerKm.high.toFixed(2)} ريال/كم كإيراد. أي عرض تحته يعني خسارة.`,
                      `To cover cost you need ${calc.revenuePerKm.low.toFixed(2)}-${calc.revenuePerKm.high.toFixed(2)} SAR per km revenue. Anything below is a loss.`
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <Link
              href={`/${locale}/listings?section=fleet`}
              className="flex items-center justify-between bg-emerald text-white rounded-2xl p-5 hover:bg-emerald-600 transition group"
            >
              <div>
                <p className="text-xs opacity-90">{t('شاهد إعلانات فعلية', 'See real listings')}</p>
                <p className="font-black text-lg">{t('شاحنات للبيع/إيجار', 'Trucks for sale/rent')}</p>
              </div>
              <ArrowRight className="group-hover:translate-x-1 transition rtl:rotate-180" />
            </Link>
            <Link
              href={`/${locale}/tools/rental-calculator`}
              className="flex items-center justify-between bg-navy text-white rounded-2xl p-5 hover:opacity-90 transition group"
            >
              <div>
                <p className="text-xs opacity-90">{t('حاسبة أخرى', 'Another calculator')}</p>
                <p className="font-black text-lg">{t('تكلفة إيجار شاحنة', 'Truck rental cost')}</p>
              </div>
              <ArrowRight className="group-hover:translate-x-1 transition rtl:rotate-180" />
            </Link>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 mt-6 text-center max-w-2xl mx-auto leading-relaxed">
            {t(
              '* الأرقام تقديرية بناءً على أسعار السوق السعودي ومنصة نوافذ 2026. الاستهلاك الفعلي يعتمد على الموديل، حمولة الرحلات، حالة الطرق، وأسلوب القيادة.',
              '* Estimates based on Saudi 2026 market prices and Nwafiz platform data. Actual consumption varies by model, load, road conditions, and driving style.'
            )}
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Row({ label, value, range }: { label: string; value: number; range?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-2 last:pb-0">
      <span className="text-gray-700">{label}</span>
      <div className="text-end">
        <span className="font-bold text-navy">{value.toLocaleString()}</span>
        <span className="text-xs text-gray-500 ms-1">ر.س</span>
        {range && <div className="text-[10px] text-gray-400 mt-0.5">{range}</div>}
      </div>
    </div>
  )
}
