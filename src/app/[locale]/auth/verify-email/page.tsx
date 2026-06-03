'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function VerifyEmailPage() {
  const locale   = useLocale();
  const isRTL    = locale === 'ar';
  const params   = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [resending, setResending] = useState(false);

  const id   = params.get('id')   ?? '';
  const hash = params.get('hash') ?? '';

  useEffect(() => {
    if (!id || !hash) { setStatus('idle'); return; }
    setStatus('loading');
    authApi.verifyEmail(id, hash)
      .then(() => {
        setStatus('success');
        toast.success(isRTL ? 'تم التحقق من بريدك الإلكتروني ✓' : 'Email verified successfully ✓');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [id, hash]);

  const resendVerification = async () => {
    if (!isAuthenticated) return;
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success(isRTL ? 'تم إرسال رابط التحقق' : 'Verification email sent');
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Something went wrong');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center" aria-label="نوافذ">
            <Image
              src="/logo-transparent.png"
              alt="نوافذ"
              width={140}
              height={110}
              priority
              className="h-14 w-auto"
            />
          </Link>
        </div>

        <div className="card p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="animate-spin text-navy mx-auto mb-4" size={40} />
              <h2 className="text-lg font-bold text-navy">
                {isRTL ? 'جارٍ التحقق...' : 'Verifying...'}
              </h2>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald" size={32} />
              </div>
              <h2 className="text-xl font-bold text-navy mb-2">
                {isRTL ? 'تم التحقق بنجاح!' : 'Email Verified!'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {isRTL
                  ? 'تم التحقق من بريدك الإلكتروني بنجاح. يمكنك الآن الاستفادة من جميع مزايا نوافذ.'
                  : 'Your email has been verified. You can now enjoy all Nwafiz features.'}
              </p>
              <Link href={`/${locale}/dashboard`} className="btn-primary w-full text-center block">
                {isRTL ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard'}
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="text-red-500" size={32} />
              </div>
              <h2 className="text-xl font-bold text-red-600 mb-2">
                {isRTL ? 'فشل التحقق' : 'Verification Failed'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {isRTL
                  ? 'الرابط منتهي الصلاحية أو غير صالح. اطلب إرسال رابط جديد.'
                  : 'The link has expired or is invalid. Request a new verification email.'}
              </p>
              {isAuthenticated && (
                <button onClick={resendVerification} disabled={resending}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
                  <Mail size={16} />
                  {resending
                    ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...')
                    : (isRTL ? 'إعادة إرسال رابط التحقق' : 'Resend Verification Email')}
                </button>
              )}
              {!isAuthenticated && (
                <Link href={`/${locale}/auth/login`} className="btn-primary w-full text-center block">
                  {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
              )}
            </>
          )}

          {status === 'idle' && (
            <>
              <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-navy" size={32} />
              </div>
              <h2 className="text-xl font-bold text-navy mb-2">
                {isRTL ? 'تحقق من بريدك الإلكتروني' : 'Verify Your Email'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {isRTL
                  ? 'أرسلنا رابط التحقق إلى بريدك الإلكتروني. تحقق من صندوق الوارد والمهملات.'
                  : "We sent a verification link to your email. Check your inbox and spam folder."}
              </p>
              {isAuthenticated && (
                <button onClick={resendVerification} disabled={resending}
                  className="btn-navy w-full flex items-center justify-center gap-2 disabled:opacity-60">
                  <Mail size={16} />
                  {resending
                    ? (isRTL ? 'جارٍ الإرسال...' : 'Sending...')
                    : (isRTL ? 'إعادة إرسال رابط التحقق' : 'Resend Verification Email')}
                </button>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href={`/${locale}`} className="hover:text-gray-600 transition">
            {isRTL ? '← العودة للرئيسية' : '← Back to Home'}
          </Link>
        </p>
      </div>
    </div>
  );
}
