/**
 * Client-side Web Push helpers — subscribe, unsubscribe, check status.
 *
 * The flow:
 *   1. User taps "تفعيل الإشعارات" → call `subscribeUser(token)`
 *   2. We request browser permission via `Notification.requestPermission()`
 *   3. We register a PushSubscription against our VAPID public key
 *   4. We POST the subscription JSON to Laravel `/api/user/push-subscriptions`
 *
 * Laravel stores it in `push_subscriptions`. When an event fires (new message,
 * new comment, etc.), Laravel calls Vercel `/api/push/send` which delivers
 * the actual notification via FCM/APNs.
 */

import { pushApi } from './api'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

export type PushSupportLevel =
  | 'unsupported'   // browser has no Push API at all
  | 'denied'        // user blocked permission
  | 'default'       // permission not yet requested
  | 'granted'       // permission granted but maybe not subscribed
  | 'subscribed'    // active subscription exists

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** Convert a URL-safe base64 VAPID key to a BufferSource for PushManager.subscribe. */
function urlBase64ToBufferSource(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  // Allocate ArrayBuffer explicitly — TS5 narrows Uint8Array to ArrayBufferLike
  // which is no longer assignable to BufferSource without this.
  const buffer  = new ArrayBuffer(raw.length)
  const view    = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; ++i) view[i] = raw.charCodeAt(i)
  return buffer
}

export async function getCurrentSupportLevel(): Promise<PushSupportLevel> {
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission === 'default') return 'default'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub ? 'subscribed' : 'granted'
}

/**
 * Request permission + create push subscription + sync with backend.
 * Returns true on success, throws on hard failure.
 */
export async function subscribeUser(): Promise<boolean> {
  if (!isPushSupported())   throw new Error('متصفّحك لا يدعم الإشعارات')
  if (!VAPID_PUBLIC)        throw new Error('Push not configured (no VAPID key)')

  // 1. Permission
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('تم رفض الإذن')

  // 2. Service-worker registration (already done by ServiceWorkerRegistrar,
  //    but we wait for it here to be sure)
  const reg = await navigator.serviceWorker.ready

  // 3. Re-use existing subscription if any
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,            // required by browsers
      applicationServerKey: urlBase64ToBufferSource(VAPID_PUBLIC),
    })
  }

  // 4. Persist on backend
  const json = sub.toJSON()
  if (!json.endpoint) throw new Error('Subscription has no endpoint')
  await pushApi.subscribe({
    endpoint:   json.endpoint,
    p256dh:     json.keys?.p256dh,
    auth:       json.keys?.auth,
    user_agent: navigator.userAgent.slice(0, 250),
  })

  return true
}

/** Unsubscribe locally + delete from backend. */
export async function unsubscribeUser(): Promise<void> {
  if (!isPushSupported()) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return

  const endpoint = sub.endpoint
  await sub.unsubscribe()
  try {
    await pushApi.unsubscribe(endpoint)
  } catch {
    /* even if backend delete fails, local unsubscribe succeeded */
  }
}
