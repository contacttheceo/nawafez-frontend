'use client'

import { useEffect } from 'react'

/**
 * Register /sw.js on first mount.
 *
 * Why a dedicated component instead of inline `<script>`:
 *   - We want this to no-op in dev (the sw is `disable: true` in next.config),
 *     in private/incognito (registration would throw), and on browsers without
 *     SW support — none of those should crash the page.
 *   - Errors are silently caught — a failed registration must never break the
 *     app shell. Worst case the site behaves like a normal SPA.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Wait for the page to be idle so the SW install doesn't compete with
    // first-paint network work.
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('[sw] registration failed', err))
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
    }
  }, [])

  return null
}
