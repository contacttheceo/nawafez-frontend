/// <reference lib="webworker" />
/**
 * Nawafez service worker — built from this file via @serwist/next into /sw.js.
 *
 * Strategy:
 *   - Static assets (icons, fonts, /_next/static/...) → CacheFirst (immutable)
 *   - HTML navigations → NetworkFirst with /offline fallback
 *   - API GETs            → NetworkFirst with 5s timeout, then cache
 *   - Images             → StaleWhileRevalidate (fresh in background)
 */
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting:     true,
  clientsClaim:    true,
  navigationPreload: true,
  runtimeCaching:  defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/ar/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
})

serwist.addEventListeners()

// ── Web Push handler (Phase 3 will wire backend; this is forward-compatible) ──
self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const payload = event.data.json() as {
      title?: string
      body?: string
      icon?: string
      badge?: string
      url?: string
      tag?: string
    }
    event.waitUntil(
      self.registration.showNotification(payload.title ?? 'نوافذ', {
        body:  payload.body  ?? '',
        icon:  payload.icon  ?? '/icons/icon-192.png',
        badge: payload.badge ?? '/icons/icon-192.png',
        tag:   payload.tag   ?? 'nwafiz-default',
        data:  { url: payload.url ?? '/' },
        // Help RTL Arabic look natural in the notification shade
        dir:   'auto',
        lang:  'ar',
      })
    )
  } catch {
    /* malformed payload — silent drop */
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string | undefined) ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing tab if one is open at the target
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
