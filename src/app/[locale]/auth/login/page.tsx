'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

type FormData = { email: string; password: string }

export default function LoginPage() {
  const locale  = useLocale()
  const router  = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isRTL   = locale === 'ar'

  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data)
      setAuth(res.user, res.token)
      localStorage.setItem('nawafez_token', res.token)
      toast.success(isRTL ? 'مرحباً بك! 👋' : 'Welcome back! 👋')
      router.push(`/${locale}/dashboard`)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (isRTL ? 'بيانات غير صحيحة' : 'Invalid credentials')
      toast.error(msg)
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
          href={`/${locale}/auth/register`}
          className="text-sm text-emerald-light font-semibold hover:text-white transition-colors"
        >
          {isRTL ? 'حساب جديد' : 'Register'}
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
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
                  ? 'منصة اللوجستيك B2B الأولى في السعودية'
                  : "Saudi Arabia's #1 B2B Logistics Platform"}
              </h2>
              <p className="text-white/50 text-sm leading-relaxed">
                {isRTL
                  ? 'تواصل مع شركات النقل والمستودعات وفرص الاستحواذ في مكان واحد.'
                  : 'Connect with trucking companies, warehouses, and M&A opportunities in one place.'}
              </p>
            </div>

            {/* Trust bullets */}
            <div className="space-y-4">
              {(isRTL ? [
                { icon: '🔒', text: 'بياناتك محمية ومشفرة بالكامل' },
                { icon: '✅', text: 'شركات موثّقة ومراجَعة يدوياً' },
                { icon: '⚡', text: 'وصول فوري لآلاف الفرص اللوجستية' },
              ] : [
                { icon: '🔒', text: 'Your data is fully encrypted' },
                { icon: '✅', text: 'Manually verified businesses only' },
                { icon: '⚡', text: 'Instant access to thousands of deals' },
              ]).map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-white/60 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right panel — Form ─────────────────────────────────────── */}
          <div className="flex-1 bg-white p-8 lg:p-10">

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-black text-navy">
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {isRTL ? 'أدخل بياناتك للدخول إلى حسابك' : 'Enter your credentials to continue'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    dir="ltr"
                    placeholder="example@domain.com"
                    className={`input ps-10 ${errors.email ? 'border-red-400 focus:ring-red-200' : ''}`}
                    {...register('email', { required: true })}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {isRTL ? 'البريد الإلكتروني مطلوب' : 'Email is required'}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-600">
                    {isRTL ? 'كلمة المرور' : 'Password'}
                  </label>
                  <Link
                    href={`/${locale}/auth/forgot-password`}
                    className="text-xs text-emerald hover:text-emerald-dark font-medium transition-colors"
                  >
                    {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`input ps-10 pe-10 ${errors.password ? 'border-red-400 focus:ring-red-200' : ''}`}
                    {...register('password', { required: true, minLength: 8 })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-400
                               hover:text-gray-600 transition-colors"
                    aria-label={isRTL ? 'إظهار / إخفاء كلمة المرور' : 'Toggle password visibility'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Minimum 8 characters'}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-navy w-full py-3.5 flex items-center justify-center gap-2
                           text-base rounded-xl disabled:opacity-60 disabled:cursor-not-allowed
                           hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-navy/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {isRTL ? 'جارٍ الدخول...' : 'Signing in...'}
                  </>
                ) : (
                  isRTL ? 'دخول' : 'Sign In'
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm text-gray-400 mt-6 pt-5 border-t border-gray-100">
              {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
              <Link
                href={`/${locale}/auth/register`}
                className="text-emerald font-bold hover:text-emerald-dark transition-colors"
              >
                {isRTL ? 'إنشاء حساب مجاناً' : 'Create free account'}
              </Link>
            </p>

            {/* Security note */}
            <p className="text-center text-xs text-gray-300 mt-4 flex items-center justify-center gap-1">
              🔒 {isRTL ? 'اتصال آمن ومشفر' : 'Secure encrypted connection'}
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
