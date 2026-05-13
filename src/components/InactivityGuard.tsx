'use client';

import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { useLocale } from 'next-intl';
import { LogOut, RefreshCw } from 'lucide-react';

export default function InactivityGuard() {
  const locale = useLocale();
  const isRTL  = locale === 'ar';
  const { showWarning, secondsLeft, stayLoggedIn } = useInactivityLogout();

  if (!showWarning) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Icon */}
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogOut size={28} className="text-amber-600" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-navy mb-2">
          {isRTL ? 'هل لا تزال هنا؟' : 'Still there?'}
        </h2>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-4 leading-relaxed">
          {isRTL
            ? 'لم نلاحظ أي نشاط منذ فترة. سيتم تسجيل خروجك تلقائياً خلال:'
            : 'No activity detected. You will be logged out automatically in:'}
        </p>

        {/* Countdown */}
        <div className="text-4xl font-black text-amber-500 mb-6 tabular-nums">
          {timeStr}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={stayLoggedIn}
            className="flex items-center justify-center gap-2 w-full bg-navy text-white
                       font-bold py-3 rounded-xl hover:bg-navy/90 transition"
          >
            <RefreshCw size={16} />
            {isRTL ? 'ابقَ مسجلاً الدخول' : 'Stay Logged In'}
          </button>
        </div>
      </div>
    </div>
  );
}
