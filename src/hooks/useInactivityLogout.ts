'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';

const IDLE_MS     = 60 * 60 * 1000;  // 1 hour idle → logout
const WARNING_MS  =  5 * 60 * 1000;  // show warning 5 min before logout
const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown',
  'scroll',    'touchstart', 'click',
] as const;

interface InactivityState {
  showWarning:  boolean;
  secondsLeft:  number;
  stayLoggedIn: () => void;
}

export function useInactivityLogout(): InactivityState {
  const { isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);

  const logoutTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (logoutTimer.current)  clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const logout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    router.push(`/${locale}/auth/login`);
  }, [clearAuth, clearAllTimers, locale, router]);

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    clearAllTimers();
    setShowWarning(false);
    setSecondsLeft(300);

    // Warn at (IDLE_MS - WARNING_MS)
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(300);
      countdownRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return s - 1;
        });
      }, 1_000);
    }, IDLE_MS - WARNING_MS);

    // Auto-logout at IDLE_MS
    logoutTimer.current = setTimeout(logout, IDLE_MS);
  }, [isAuthenticated, clearAllTimers, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      return;
    }

    ACTIVITY_EVENTS.forEach(e =>
      window.addEventListener(e, resetTimer, { passive: true })
    );
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach(e =>
        window.removeEventListener(e, resetTimer)
      );
      clearAllTimers();
    };
  }, [isAuthenticated, resetTimer, clearAllTimers]);

  return { showWarning, secondsLeft, stayLoggedIn: resetTimer };
}
