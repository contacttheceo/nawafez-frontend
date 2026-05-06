'use client';

import { useEffect } from 'react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

/**
 * Validates the persisted auth token against the backend on every app load.
 * If the token is expired or invalid, clears local auth state silently.
 */
export default function AuthSync() {
  const { token, isAuthenticated, setUser, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    authApi.me()
      .then((res) => {
        setUser(res.data ?? res);
      })
      .catch(() => {
        // Token invalid / expired — clear local state
        clearAuth();
      });
  }, []); // Run once on mount

  return null;
}
