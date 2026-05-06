'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth Error]', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="card p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>

          <h1 className="text-xl font-black text-navy mb-2">
            حدث خطأ غير متوقع
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {process.env.NODE_ENV === 'development'
              ? error.message
              : 'يرجى المحاولة مرة أخرى أو التواصل مع الدعم.'}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <RefreshCw size={14} />
              إعادة المحاولة
            </button>
            <Link href="/" className="btn-secondary text-sm">
              الصفحة الرئيسية
            </Link>
          </div>

          {error.digest && (
            <p className="text-xs text-gray-300 mt-4" dir="ltr">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
