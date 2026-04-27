'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

type FormData = {
  name_ar: string;
  name_en: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

export default function RegisterPage() {
  const t      = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [showPass, setShowPass]    = useState(false);
  const [isLoading, setIsLoading]  = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      setAuth(res.user, res.token);
      toast.success(locale === 'ar' ? 'تم إنشاء حسابك بنجاح!' : 'Account created successfully!');
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (locale === 'ar' ? 'حدث خطأ، حاول مجدداً.' : 'Something went wrong.');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-emerald-bg flex items-center justify-center py-12 px-4">
      <div className="card w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald/10 mb-4">
            <UserPlus className="text-emerald w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-navy">
            {locale === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {locale === 'ar' ? 'انضم إلى منصة نوافذ للخدمات اللوجستية' : 'Join the Nawafez logistics marketplace'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'ar' ? 'الاسم بالعربية' : 'Name in Arabic'} *
              </label>
              <input
                {...register('name_ar', {
                  required: locale === 'ar' ? 'الاسم بالعربية مطلوب' : 'Arabic name is required',
                })}
                className="input"
                placeholder={locale === 'ar' ? 'اسمك بالعربية' : 'Your name in Arabic'}
                dir="rtl"
              />
              {errors.name_ar && (
                <p className="text-red-500 text-xs mt-1">{errors.name_ar.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'ar' ? 'الاسم بالإنجليزية' : 'Name in English'} *
              </label>
              <input
                {...register('name_en', {
                  required: locale === 'ar' ? 'الاسم بالإنجليزية مطلوب' : 'English name is required',
                })}
                className="input"
                placeholder="Your name in English"
                dir="ltr"
              />
              {errors.name_en && (
                <p className="text-red-500 text-xs mt-1">{errors.name_en.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
            </label>
            <input
              type="email"
              {...register('email', {
                required: locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: locale === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email',
                },
              })}
              className="input"
              placeholder="you@company.com"
              dir="ltr"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'ar' ? 'رقم الجوال (اختياري)' : 'Phone Number (optional)'}
            </label>
            <input
              type="tel"
              {...register('phone')}
              className="input"
              placeholder="+966 5X XXX XXXX"
              dir="ltr"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'ar' ? 'كلمة المرور' : 'Password'} *
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                {...register('password', {
                  required: locale === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required',
                  minLength: {
                    value: 8,
                    message: locale === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Minimum 8 characters',
                  },
                })}
                className="input pe-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} *
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              {...register('password_confirmation', {
                required: locale === 'ar' ? 'تأكيد كلمة المرور مطلوب' : 'Please confirm your password',
                validate: (val) =>
                  val === watch('password') ||
                  (locale === 'ar' ? 'كلمتا المرور غير متطابقتان' : 'Passwords do not match'),
              })}
              className="input"
              placeholder="••••••••"
            />
            {errors.password_confirmation && (
              <p className="text-red-500 text-xs mt-1">{errors.password_confirmation.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading
              ? (locale === 'ar' ? 'جارٍ الإنشاء…' : 'Creating…')
              : (locale === 'ar' ? 'إنشاء الحساب' : 'Create Account')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          {locale === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
          <Link href={`/${locale}/auth/login`} className="text-emerald font-medium hover:underline">
            {locale === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
          </Link>
        </p>
      </div>
    </main>
  );
}
