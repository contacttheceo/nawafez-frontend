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

// ─── Plans & Subscriptions (new, full schema) ──────────────────────────────
export type PlanCode = 'free' | 'basic' | 'professional' | 'enterprise'
export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired' | 'suspended'

export interface PlanFeatures {
  max_listings: number              // -1 = unlimited
  max_featured_per_month: number    // -1 = unlimited
  has_ma: boolean
  has_pin: boolean
  auto_renew_listings: boolean
  has_trusted_badge: boolean
  has_blind_bidding: boolean
  ai_tools_level: 'limited' | 'full' | 'priority'
  analytics_level: 'basic' | 'intermediate' | 'advanced' | 'advanced_export'
  support_level: 'email_72h' | 'email_48h' | 'email_24h' | 'dedicated_whatsapp'
  api_access: boolean
  max_sub_users: number
}

export interface Plan {
  id: number
  code: PlanCode
  name_ar: string
  name_en: string
  tagline_ar: string | null
  tagline_en: string | null
  price_monthly: number   // SAR (whole riyals)
  price_yearly: number
  features: PlanFeatures
  display_order: number
  is_active: boolean
  is_default: boolean
  badge_color: 'gray' | 'navy' | 'emerald' | 'gold' | null
  subscriptions_count?: number      // admin endpoint only
}

export interface Subscription {
  id: number
  user_id: number
  plan_id: number
  status: SubscriptionStatus
  billing_cycle: BillingCycle
  started_at: string | null
  expires_at: string | null
  cancelled_at: string | null
  auto_renew: boolean
  source: string | null
  plan?: Plan
}

export interface SubscriptionUsage {
  period_yyyymm: string
  listings_posted: number
  featured_used: number
  pins_used: number
}

export interface SubscriptionSnapshot {
  subscription: Subscription
  plan: Plan
  usage: SubscriptionUsage
  limits: {
    max_listings: number | null
    remaining: number | null
    days_until_expiry: number | null
  }
}

// ─── Listings ────────────────────────────────────────────────────────────────

export type ListingSection = 'ma' | 'fleet' | 'contracts' | 'jobs' | 'forum'
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'expired' | 'sold' | 'rejected'
export type TransactionType = 'cash' | 'transfer' | 'monthly_rent' | 'agency_offer' | 'bid'

export type ForumCategory = 'legal' | 'financial' | 'operational' | 'logistics'

export interface Listing {
  id: number
  user_id: number
  section: ListingSection
  listing_type: string
  forum_category?: ForumCategory | null
  comments_count?: number
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
