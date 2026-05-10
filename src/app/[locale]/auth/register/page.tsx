'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import {
  Eye, EyeOff, ArrowRight, ArrowLeft,
  User, Mail, Phone, Lock, Loader2,
} from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

type FormData = {
  name_ar: string
  name_en: string
  email: string
  phone: string
  password: string
  password_confirmation: string
}

export default function RegisterPage() {
  const locale  = useLocale()
  const router  = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isRTL   = locale === 'ar'

  const [showPass, setShowPass]   = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await authApi.register(data)
      setAuth(res.user, res.token)
      localStorage.setItem('nawafez_token', res.token)
      toast.success(isRTL ? 'تم إنشاء حسابك بنجاح! 🎉' : 'Account created! 🎉')
      router.push(`/${locale}/dashboard`)
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isRTL ? 'حدث خطأ، حاول مجدداً.' : 'Something went wrong.')
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const BackArrow = isRTL ? ArrowRight : ArrowLeft

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-[#1E3A8A] flex flex-col">

      {/* Top Bar */}
      <div className="px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
        >
          <BackArrow size={15} />
          {isRTL ? 'رجوع' : 'Back'}
        </button>

        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-lg
                          flex items-center justify-center text-white font-black text-base">
            ن
          </div>
          <span className="font-black text-white text-lg">نوافذ</span>
        </Link>

        <Link
          href={`/${locale}/auth/login`}
          className="text-sm text-emerald-light font-semibold hover:text-white transition-colors"
        >
          {isRTL ? 'دخول' : 'Login'}
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-2xl">

          {/* ─── Left panel (Desktop only) ─────────────────────────────── */}
          <div className="hidden lg:flex flex-col justify-between bg-white/5 backdrop-blur-sm
                          border border-white/10 w-5/12 p-10">
            {/* Brand */}
            <div>
              <div className="w-14 h-14 bg-emerald/20 border border-emerald/40 rounded-2xl
                              flex items-center justify-center text-3xl font-black text-white mb-6">
                ن
              </div>
              <h2 className="text-2xl font-black text-white leading-snug mb-3">
                {isRTL
                  ? 'انضم لأكبر مجتمع لوجستي في السعودية'
                  : "Join Saudi Arabia's Largest Logistics Community"}
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                {isRTL
                  ? 'التسجيل مجاني. نشر الإعلانات مجاني. ابدأ الآن وتواصل مع آلاف الشركات.'
                  : 'Free to join. Free to post. Start connecting with thousands of companies today.'}
              </p>

              {/* Benefits */}
              <div className="space-y-4">
                {(isRTL ? [
                  { icon: '🚛', title: '5 أقسام متخصصة',    sub: 'أسطول، عقود، وظائف، استحواذ، منتدى' },
                  { icon: '🤝', title: '+٩٥M ريال صفقات',   sub: 'حجم الصفقات المنجزة على المنصة'      },
                  { icon: '🏙️', title: '21 مدينة سعودية',   sub: 'تغطية كاملة لجميع المناطق'            },
                  { icon: '⚡', title: 'نشر فوري',            sub: 'إعلانك يظهر في ثوانٍ بعد النشر'      },
                ] : [
                  { icon: '🚛', title: '5 Specialized Sections', sub: 'Fleet, Contracts, Jobs, M&A, Forum'    },
                  { icon: '🤝', title: '+95M SAR in Deals',       sub: 'Total deal volume on the platform'    },
                  { icon: '🏙️', title: '21 Saudi Cities',          sub: 'Full regional coverage'               },
                  { icon: '⚡', title: 'Instant Publishing',        sub: 'Your listing goes live in seconds'    },
                ]).map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{item.icon}</span>
                    <div>
                      <div className="text-white font-bold text-sm">{item.title}</div>
                      <div className="text-white/40 text-xs">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom note */}
            <p className="text-white/30 text-xs mt-8">
              🔒 {isRTL ? 'بياناتك محمية ومشفرة بالكامل' : 'Your data is fully encrypted'}
            </p>
          </div>

          {/* ─── Right panel — Form ─────────────────────────────────────── */}
          <div className="flex-1 bg-white p-8 lg:p-10">

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl font-black text-navy">
                {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {isRTL ? 'انضم إلى منصة نوافذ — مجانًا' : 'Join Nawafez platform — it\'s free'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Names grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Arabic name */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    {isRTL ? 'الاسم بالعربية' : 'Arabic Name'} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      {...register('name_ar', { required: true })}
                      dir="rtl"
                      placeholder={isRTL ? 'اسمك بالعربية' : 'Arabic name'}
                      className={`input ps-9 text-sm ${errors.name_ar ? 'border-red-400' : ''}`}
                    />
                  </div>
                  {errors.name_ar && (
                    <p className="text-red-500 text-xs mt-0.5">{isRTL ? 'مطلوب' : 'Required'}</p>
                  )}
                </div>

                {/* English name */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    {isRTL ? 'الاسم بالإنجليزية' : 'English Name'} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      {...register('name_en', { required: true })}
                      dir="ltr"
                      placeholder="English name"
                      className={`input ps-9 text-sm ${errors.name_en ? 'border-red-400' : ''}`}
                    />
                  </div>
                  {errors.name_en && (
                    <p className="text-red-500 text-xs mt-0.5">{isRTL ? 'مطلوب' : 'Required'}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    dir="ltr"
                    placeholder="you@company.com"
                    {...register('email', {
                      required: true,
                      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    })}
                    className={`input ps-9 text-sm ${errors.email ? 'border-red-400' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {isRTL ? 'بريد إلكتروني غير صالح' : 'Invalid email address'}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  {isRTL ? 'رقم الجوال' : 'Phone Number'}
                  <span className="text-gray-300 font-normal ms-1">
                    ({isRTL ? 'اختياري' : 'optional'})
                  </span>
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="+966 5X XXX XXXX"
                    {...register('phone')}
                    className="input ps-9 text-sm"
                  />
                </div>
              </div>

              {/* Password grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    {isRTL ? 'كلمة المرور' : 'Password'} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password', { required: true, minLength: 8 })}
                      className={`input ps-9 pe-9 text-sm ${errors.password ? 'border-red-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={isRTL ? 'إظهار / إخفاء' : 'Toggle visibility'}
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-0.5">
                      {isRTL ? '8 أحرف على الأقل' : 'Min 8 characters'}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password_confirmation', {
                        required: true,
                        validate: (val) =>
                          val === watch('password') ||
                          (isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'),
                      })}
                      className={`input ps-9 text-sm ${errors.password_confirmation ? 'border-red-400' : ''}`}
                    />
                  </div>
                  {errors.password_confirmation && (
                    <p className="text-red-500 text-xs mt-0.5">
                      {errors.password_confirmation.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2
                           text-base rounded-xl disabled:opacity-60 disabled:cursor-not-allowed
                           hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-emerald/20 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {isRTL ? 'جارٍ الإنشاء...' : 'Creating account...'}
                  </>
                ) : (
                  isRTL ? 'إنشاء الحساب مجاناً' : 'Create Free Account'
                )}
              </button>

              {/* Terms note */}
              <p className="text-center text-xs text-gray-400 leading-relaxed">
                {isRTL
                  ? 'بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية'
                  : 'By registering, you agree to our Terms of Service and Privacy Policy'}
              </p>
            </form>

            {/* Login link */}
            <p className="text-center text-sm text-gray-400 mt-5 pt-5 border-t border-gray-100">
              {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <Link
                href={`/${locale}/auth/login`}
                className="text-emerald font-bold hover:text-emerald-dark transition-colors"
              >
                {isRTL ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
