'use client'

import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

type FormData = { email: string; password: string }

export default function LoginPage() {
  const locale  = useLocale()
  const router  = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isRTL   = locale === 'ar'

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
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-navy transition-colors text-sm"
        >
          <BackArrow size={16} />
          {isRTL ? 'رجوع' : 'Back'}
        </button>

        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center text-white font-black text-base">
            ن
          </div>
          <span className="font-black text-navy text-lg">نوافذ</span>
        </Link>

        <Link
          href={`/${locale}/auth/register`}
          className="text-sm text-emerald font-semibold hover:text-emerald-dark transition-colors"
        >
          {isRTL ? 'حساب جديد' : 'Register'}
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-navy">
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isRTL ? 'أدخل بياناتك للدخول إلى حسابك' : 'Enter your credentials to continue'}
            </p>
          </div>

          <div className="card p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="example@domain.com"
                  dir="ltr"
                  {...register('email', { required: true })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{isRTL ? 'مطلوب' : 'Required'}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-600">
                    {isRTL ? 'كلمة المرور' : 'Password'}
                  </label>
                  <Link href={`/${locale}/auth/forgot-password`}
                    className="text-xs text-emerald hover:text-emerald-dark">
                    {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </Link>
                </div>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  {...register('password', { required: true, minLength: 8 })}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{isRTL ? '8 أحرف على الأقل' : 'Min 8 characters'}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-navy w-full py-3 mt-2"
              >
                {isSubmitting
                  ? (isRTL ? 'جارٍ الدخول...' : 'Signing in...')
                  : (isRTL ? 'دخول' : 'Sign In')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-4 pt-4 border-t border-gray-100">
              {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
              <Link href={`/${locale}/auth/register`}
                className="text-emerald font-semibold hover:text-emerald-dark">
                {isRTL ? 'إنشاء حساب' : 'Register'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
