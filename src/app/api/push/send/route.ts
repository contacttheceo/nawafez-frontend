/**
 * POST /api/push/send  — internal endpoint, called by the Laravel backend.
 *
 * Auth: requires header `X-Internal-Secret: <PUSH_INTERNAL_SECRET>`.
 * Body: { subscriptions: PushSubscription[], payload: { title, body, ... } }
 *
 * We host this on the Vercel side (not Laravel) because:
 *   - The `web-push` library is mature in Node, not in PHP (minishlink/web-push
 *     works but composer install on Freehostia shared hosting is painful)
 *   - Vercel Edge runs close to FCM/APNs endpoints — lower send latency
 *
 * Failure handling:
 *   - 410 (Gone) or 404 from push service → return that subscription as expired
 *     so Laravel can prune it from the DB on its next maintenance pass.
 */

import { NextRequest, NextResponse } from 'next/server'
import webpush, { PushSubscription, WebPushError } from 'web-push'

export const runtime = 'nodejs'  // web-push uses Node crypto
export const dynamic = 'force-dynamic'

// One-time VAPID setup per cold-start
let vapidConfigured = false
function ensureVapid() {
  if (vapidConfigured) return
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const prv = process.env.VAPID_PRIVATE_KEY
  const sub = process.env.VAPID_SUBJECT ?? 'mailto:support@nwafizlogi.com'
  if (!pub || !prv) throw new Error('VAPID keys not configured')
  webpush.setVapidDetails(sub, pub, prv)
  vapidConfigured = true
}

type PushPayload = {
  title: string
  body?: string
  url?: string        // where to navigate when tapped
  tag?: string        // group/replace notifications with same tag
  icon?: string
  badge?: string
}

type SendBody = {
  subscriptions: PushSubscription[]
  payload:       PushPayload
}

type SendResult = {
  endpoint: string
  ok:       boolean
  status?:  number
  expired?: boolean   // 410/404 → backend should delete
  error?:   string
}

export async function POST(req: NextRequest) {
  // 1. Auth — shared secret with the Laravel backend
  const secret = req.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.PUSH_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Parse body
  let body: SendBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!Array.isArray(body.subscriptions) || body.subscriptions.length === 0) {
    return NextResponse.json({ error: 'no subscriptions' }, { status: 400 })
  }
  if (!body.payload?.title) {
    return NextResponse.json({ error: 'payload.title required' }, { status: 400 })
  }

  try {
    ensureVapid()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  const payloadStr = JSON.stringify(body.payload)
  const TTL_SECONDS = 60 * 60 * 24   // 1 day — drop if undelivered after that

  // 3. Send in parallel — push services are independent, no need to serialize
  const results: SendResult[] = await Promise.all(
    body.subscriptions.map(async (sub): Promise<SendResult> => {
      try {
        await webpush.sendNotification(sub, payloadStr, {
          TTL:     TTL_SECONDS,
          urgency: 'normal',
        })
        return { endpoint: sub.endpoint, ok: true }
      } catch (err) {
        const e = err as WebPushError
        const expired = e.statusCode === 410 || e.statusCode === 404
        return {
          endpoint: sub.endpoint,
          ok:       false,
          status:   e.statusCode,
          expired,
          error:    e.body ?? e.message,
        }
      }
    })
  )

  const sent     = results.filter((r) => r.ok).length
  const expired  = results.filter((r) => r.expired).map((r) => r.endpoint)
  const failed   = results.filter((r) => !r.ok && !r.expired)

  return NextResponse.json({
    sent,
    total: results.length,
    expired,        // backend should prune these subscriptions
    failed_count: failed.length,
    results,
  })
}
