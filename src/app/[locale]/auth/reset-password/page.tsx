'use client';

import { Suspense, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { ArrowRight, ArrowLeft, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';

type FormData = {
  password: string;
  password_confirmation: string;
};

// useSearchParams() bails out of static rendering. Wrapping in a Suspense
// boundary is the canonical fix once static rendering is enabled on the
// locale layer.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald" size={32} /></div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const locale      = useLocale();
  const isRTL       = locale === 'ar';
  const router      = useRouter();
  const params      = useSearchParams();
  const [showPass,  setShowPass]  = useState(false);
  const [done,      setDone]      = useState(false);

  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    if (!token || !email) {
      toast.error(isRTL ? 'رابط غير صالح' : 'Invalid reset link');
      return;
    }
    try {
      await authApi.resetPassword({
        token,
        email,
        password:              data.password,
        password_confirmation: data.password_confirmation,
      });
      setDone(true);
      toast.success(isRTL ? 'تم تغيير كلمة المرور بنجاح ✓' : 'Password reset successfully ✓');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (isRTL ? 'الرابط منتهي أو غير صالح' : 'Link expired or invalid');
      toast.error(msg);
    }
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href={`/${locale}/auth/login`}
          className="flex items-center gap-2 text-gray-500 hover:text-navy transition text-sm">
          <BackArrow size={16} />
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </Link>
        <Link href={`/${locale}`} className="flex items-center" aria-label="نوافذ">
          <Image
            src="/logo-transparent.png"
            alt="نوافذ"
            width={100}
            height={78}
            priority
            className="h-9 w-auto"
          />
        </Link>
        <div className="w-20" />
      </div>

      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">

          {done ? (
            /* Success state */
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="text-emerald" size={28} />
              </div>
              <h2 className="text-xl font-bold text-navy mb-2">
                {isRTL ? 'تم تغيير كلمة المرور!' : 'Password Changed!'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {isRTL
                  ? 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
                  : 'You can now sign in with your new password.'}
              </p>
              <Link href={`/${locale}/auth/login`} className="btn-primary w-full text-center block">
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
            </div>
          ) : !token || !email ? (
            /* Invalid link */
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">🔗</div>
              <h2 className="text-xl font-bold text-red-600 mb-2">
                {isRTL ? 'رابط غير صالح' : 'Invalid Link'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {isRTL
                  ? 'هذا الرابط غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً.'
                  : 'This link is invalid or expired. Please request a new one.'}
              </p>
              <Link href={`/${locale}/auth/forgot-password`} className="btn-primary w-full text-center block">
                {isRTL ? 'طلب رابط جديد' : 'Request New Link'}
              </Link>
            </div>
          ) : (
            /* Reset form */
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-black text-navy">
                  {isRTL ? 'كلمة مرور جديدة' : 'New Password'}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  {isRTL
                    ? `إعادة تعيين كلمة مرور حساب ${email}`
                    : `Reset password for ${email}`}
                </p>
              </div>

              <div className="card p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {isRTL ? 'كلمة المرور الجديدة *' : 'New Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        className="input pe-9"
                        placeholder="••••••••"
                        {...register('password', { required: true, minLength: 8 })}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute inset-y-0 end-2.5 flex items-center text-gray-400">
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {isRTL ? '8 أحرف على الأقل' : 'Minimum 8 characters'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {isRTL ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}
                    </label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="input"
                      placeholder="••••••••"
                      {...register('password_confirmation', {
                        required: true,
                        validate: (val) => val === watch('password') || (isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'),
                      })}
                    />
                    {errors.password_confirmation && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.password_confirmation.message}
                      </p>
                    )}
                  </div>

                  <button type="submit" disabled={isSubmitting}
                    className="btn-navy w-full py-3 mt-2 disabled:opacity-60">
                    {isSubmitting
                      ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...')
                      : (isRTL ? 'تعيين كلمة المرور' : 'Reset Password')}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
