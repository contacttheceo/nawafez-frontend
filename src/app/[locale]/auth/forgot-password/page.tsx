'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';

type FormData = { email: string };

export default function ForgotPasswordPage() {
  const locale  = useLocale();
  const router  = useRouter();
  const isRTL   = locale === 'ar';

  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (isRTL ? 'حدث خطأ، حاول مجدداً.' : 'Something went wrong.');
      toast.error(msg);
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
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">

          {sent ? (
            /* Success State */
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-navy mb-2">
                {isRTL ? 'تم إرسال الرابط!' : 'Link Sent!'}
              </h2>
              <p className="text-gray-500 text-sm mb-1">
                {isRTL
                  ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى:'
                  : 'Password reset link sent to:'}
              </p>
              <p className="text-navy font-semibold text-sm mb-6" dir="ltr">{sentEmail}</p>
              <p className="text-gray-400 text-xs mb-6">
                {isRTL
                  ? 'تحقق من صندوق الوارد (أو مجلد الرسائل غير المرغوب فيها).'
                  : 'Check your inbox (or spam folder) for the reset link.'}
              </p>
              <Link
                href={`/${locale}/auth/login`}
                className="btn-navy w-full block text-center py-3 text-sm"
              >
                {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Mail className="text-navy w-7 h-7" />
                </div>
                <h1 className="text-2xl font-black text-navy">
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  {isRTL
                    ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين'
                    : 'Enter your email and we\'ll send you a reset link'}
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
                      {...register('email', {
                        required: true,
                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      })}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {isRTL ? 'أدخل بريداً إلكترونياً صالحاً' : 'Enter a valid email'}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-navy w-full py-3 mt-2 disabled:opacity-60"
                  >
                    {isSubmitting
                      ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...')
                      : (isRTL ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link')}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-4 pt-4 border-t border-gray-100">
                  {isRTL ? 'تذكرت كلمة المرور؟' : 'Remember your password?'}{' '}
                  <Link href={`/${locale}/auth/login`} className="text-emerald font-semibold hover:text-emerald-dark">
                    {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
