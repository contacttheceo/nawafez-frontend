'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Page Error]', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Image src="/logo.png" alt="نوافذ" width={140} height={110} priority />
        </div>

        <div className="card p-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="text-red-400 w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-navy mb-2">
            حدث خطأ في الصفحة
          </h1>
          <p className="text-gray-500 text-sm mb-2">
            حدث خطأ غير متوقع أثناء تحميل هذه الصفحة.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-start">
              <p className="text-xs font-mono text-red-700 break-all">{error.message}</p>
            </div>
          )}

          {error.digest && (
            <p className="text-xs text-gray-300 mb-5" dir="ltr">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={reset}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <RefreshCw size={14} />
              إعادة المحاولة
            </button>
            <Link href="/" className="btn-navy text-sm flex items-center gap-2">
              <Home size={14} />
              الصفحة الرئيسية
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني.
        </p>
      </div>
    </div>
  );
}
