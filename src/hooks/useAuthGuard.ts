'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useAuthStore } from '@/store/auth'

/**
 * Redirects to login if the user is not authenticated.
 * Waits for Zustand to finish rehydrating from localStorage
 * before deciding — prevents false logout on page load.
 */
export function useAuthGuard() {
  const router         = useRouter()
  const locale         = useLocale()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const _hasHydrated   = useAuthStore((s) => s._hasHydrated)

  useEffect(() => {
    if (!_hasHydrated) return          // store not ready yet — wait
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login`)
    }
  }, [isAuthenticated, _hasHydrated, locale, router])

  return { isAuthenticated, isReady: _hasHydrated }
}
