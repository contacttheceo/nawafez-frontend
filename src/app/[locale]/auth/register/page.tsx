'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
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
  const locale  = useLocale();
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isRTL   = locale === 'ar';

  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      setAuth(res.user, res.token);
      localStorage.setItem('nawafez_token', res.token);
      toast.success(isRTL ? 'تم إنشاء حسابك بنجاح! 🎉' : 'Account created! 🎉');
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isRTL ? 'حدث خطأ، حاول مجدداً.' : 'Something went wrong.');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

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
          href={`/${locale}/auth/login`}
          className="text-sm text-emerald font-semibold hover:text-emerald-dark transition-colors"
        >
          {isRTL ? 'دخول' : 'Login'}
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-navy">
              {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isRTL ? 'انضم إلى منصة نوافذ للخدمات اللوجستية' : 'Join the Nawafez logistics marketplace'}
            </p>
          </div>

          <div className="card p-6 space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isRTL ? 'الاسم بالعربية' : 'Name in Arabic'} *
                  </label>
                  <input
                    {...register('name_ar', { required: true })}
                    className="input text-sm"
                    placeholder={isRTL ? 'اسمك بالعربية' : 'Arabic name'}
                    dir="rtl"
                  />
                  {errors.name_ar && <p className="text-red-500 text-xs mt-0.5">{isRTL ? 'مطلوب' : 'Required'}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isRTL ? 'الاسم بالإنجليزية' : 'Name in English'} *
                  </label>
                  <input
                    {...register('name_en', { required: true })}
                    className="input text-sm"
                    placeholder="English name"
                    dir="ltr"
                  />
                  {errors.name_en && <p className="text-red-500 text-xs mt-0.5">{isRTL ? 'مطلوب' : 'Required'}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  {...register('email', { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })}
                  className="input text-sm"
                  placeholder="you@company.com"
                  dir="ltr"
                />
                {errors.email && <p className="text-red-500 text-xs mt-0.5">{isRTL ? 'بريد إلكتروني غير صالح' : 'Invalid email'}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {isRTL ? 'رقم الجوال (اختياري)' : 'Phone (optional)'}
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="input text-sm"
                  placeholder="+966 5X XXX XXXX"
                  dir="ltr"
                />
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isRTL ? 'كلمة المرور' : 'Password'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      {...register('password', { required: true, minLength: 8 })}
                      className="input text-sm pe-9"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute inset-y-0 end-2.5 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-0.5">{isRTL ? '8 أحرف على الأقل' : 'Min 8 chars'}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'} *
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    {...register('password_confirmation', {
                      required: true,
                      validate: (val) => val === watch('password') || (isRTL ? 'غير متطابقتان' : 'No match'),
                    })}
                    className="input text-sm"
                    placeholder="••••••••"
                  />
                  {errors.password_confirmation && <p className="text-red-500 text-xs mt-0.5">{errors.password_confirmation.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 mt-2 disabled:opacity-60"
              >
                {isLoading
                  ? (isRTL ? 'جارٍ الإنشاء...' : 'Creating...')
                  : (isRTL ? 'إنشاء الحساب' : 'Create Account')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 pt-2 border-t border-gray-100">
              {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <Link href={`/${locale}/auth/login`} className="text-emerald font-semibold hover:text-emerald-dark">
                {isRTL ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
