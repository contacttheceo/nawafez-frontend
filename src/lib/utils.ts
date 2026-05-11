import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build a full storage URL from a relative path returned by the backend.
 * Backend stores e.g. "avatars/1/photo.jpg"
 * Frontend builds: https://backend-domain.com/storage/avatars/1/photo.jpg
 */
export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  // Strip cache-buster if present before checking prefix
  const cleanPath = path.split('?')[0]
  if (cleanPath.startsWith('http')) return path  // already a full URL
  const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000')
    .replace(/\/api$/, '')                        // strip trailing /api
  // uploads/ paths are served directly from public/ — no /storage/ prefix needed
  if (cleanPath.startsWith('uploads/')) return `${base}/${path}`
  return `${base}/storage/${path}`
}

export function formatDistanceToNow(dateStr: string | undefined | null, locale: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (locale === 'ar') {
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays === 1) return 'أمس'
    if (diffDays < 7) return `منذ ${diffDays} أيام`
    return date.toLocaleDateString('ar-SA')
  } else {
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US')
  }
}

export function formatPrice(price: number | null | undefined, locale: string): string {
  if (price == null) return ''
  return price.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US') + ' ر.س'
}
