// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'guest' | 'individual' | 'business' | 'admin'

export interface User {
  id: number
  name_ar: string
  name_en: string
  email: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  is_trusted_payer: boolean
  email_verified_at: string | null
  business_verification: BusinessVerification | null
  subscription_data: SubscriptionData | null
  created_at: string
}

export interface BusinessVerification {
  cr_number: string
  cr_image_path: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  reviewed_at: string | null
}

export interface SubscriptionData {
  plan: 'basic' | 'professional' | 'enterprise'
  started_at: string
  expires_at: string
  auto_renew: boolean
  listings_used: number
}

// ─── Listings ────────────────────────────────────────────────────────────────

export type ListingSection = 'ma' | 'fleet' | 'contracts' | 'jobs' | 'forum'
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'expired' | 'sold' | 'rejected'
export type TransactionType = 'cash' | 'transfer' | 'monthly_rent' | 'agency_offer' | 'bid'

export interface Listing {
  id: number
  user_id: number
  section: ListingSection
  listing_type: string
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  city: string
  region: string | null
  price: number | null
  price_type?: string | null
  currency: 'SAR'
  status: ListingStatus
  rejection_reason?: string | null
  contact_phone?: string | null
  dynamic_data: Record<string, unknown>
  media: MediaItem[]
  images?: string[]
  is_featured: boolean
  is_financing_eligible: boolean
  is_ready_to_operate: boolean
  expires_at: string
  views_count: number
  user?: ListingUser
  created_at?: string
  updated_at?: string
}

export interface MediaItem {
  path: string
  type: 'image' | 'pdf'
  is_primary: boolean
}

export interface ListingUser {
  id: number
  name_ar: string
  name_en: string
  is_trusted_payer: boolean
  role: UserRole
  avatar_url?: string | null
}

// ─── Interactions ─────────────────────────────────────────────────────────────

export type InteractionType = 'bid' | 'saved_search' | 'bookmark' | 'alert' | 'report' | 'message'

export interface Interaction {
  id: number
  user_id: number
  listing_id: number | null
  type: InteractionType
  data: Record<string, unknown>
  status: string
  created_at: string
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface ListingFilters {
  section?: ListingSection
  city?: string
  transaction_type?: TransactionType
  price_min?: number
  price_max?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'featured'
  page?: number
  search?: string
}
