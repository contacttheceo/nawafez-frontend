'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

type FormData = { email: string; password: string }

export default function LoginPage() {
  const t      = useTranslations('auth')
  const te     = useTranslations('errors')
  const locale = useLocale()
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data)
      // api.ts unwraps response.data → res = { token, user }
      setAuth(res.user, res.token)
      localStorage.setItem('nawafez_token', res.token)
      toast.success(locale === 'ar' ? 'مرحباً بك!' : 'Welcome back!')
      router.push(`/${locale}/dashboard`)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? te('server_error')
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center
                            text-white font-black text-xl">ن</div>
            <span className="font-black text-navy text-2xl">نوافذ</span>
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-black text-navy mb-1">{t('login_title')}</h1>
          <p className="text-gray-400 text-sm mb-6">{t('login_sub')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                {t('email')}
              </label>
              <input
                type="email"
                className="input"
                placeholder="example@domain.com"
                {...register('email', { required: true })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{te('required')}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-600">{t('password')}</label>
                <Link href={`/${locale}/auth/forgot-password`}
                  className="text-xs text-emerald hover:text-emerald-dark">
                  {t('forgot')}
                </Link>
              </div>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('password', { required: true, minLength: 8 })}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{te('password_min')}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-navy w-full py-3 mt-2"
            >
              {isSubmitting
                ? (locale === 'ar' ? 'جارٍ الدخول...' : 'Signing in...')
                : t('login_btn')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t('no_account')}{' '}
            <Link href={`/${locale}/auth/register`}
              className="text-emerald font-semibold hover:text-emerald-dark">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
