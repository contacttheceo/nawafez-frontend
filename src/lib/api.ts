import axios from 'axios';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Token helpers ────────────────────────────────────────────────────────────
const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('nawafez_token') : null;

// ─── Request interceptor — attach Bearer token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor — unwrap data & handle 401 / 403 verified ──────────
api.interceptors.response.use(
  (response) => response.data,      // always return the JSON body directly
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear both the token key AND the Zustand-persisted auth store
      localStorage.removeItem('nawafez_token');
      localStorage.removeItem('nawafez-auth');
      const locale = document.documentElement.lang ?? 'ar';
      window.location.href = `/${locale}/auth/login`;
    }
    // 403 with reason=email_not_verified → bubble up a clear flag so UI can
    // render the "verify your email" prompt instead of a generic error toast.
    if (error.response?.status === 403 && error.response?.data?.reason === 'email_not_verified') {
      // Attach a friendly flag — components can check err.isEmailNotVerified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(error as any).isEmailNotVerified = true
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    name_ar: string;
    name_en: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }): Promise<{ token: string; user: any; message: string }> =>
    api.post('/auth/register', data),

  login: (data: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: any }> =>
    api.post('/auth/login', data),

  logout: (): Promise<{ message: string }> =>
    api.post('/auth/logout'),

  me: (): Promise<{ data: any }> =>
    api.get('/auth/me'),

  forgotPassword: (email: string): Promise<{ message: string }> =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> =>
    api.post('/auth/reset-password', data),

  verifyEmail: (id: string, hash: string): Promise<{ message: string }> =>
    api.get(`/auth/verify-email/${id}/${hash}`),

  resendVerification: (): Promise<{ message: string }> =>
    api.post('/auth/resend-verification'),
};

// ─── Listings ─────────────────────────────────────────────────────────────────
export const listingsApi = {
  getAll: (params?: Record<string, any>): Promise<any> =>
    api.get('/listings', { params }),

  getOne: (id: number): Promise<{ data: any }> =>
    api.get(`/listings/${id}`),

  create: (data: FormData): Promise<{ data: any; message: string }> =>
    api.post('/listings', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: FormData): Promise<{ data: any; message: string }> =>
    api.post(`/listings/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: number): Promise<{ message: string }> =>
    api.delete(`/listings/${id}`),

  pause: (id: number): Promise<{ message: string; status: string }> =>
    api.patch(`/listings/${id}/pause`),

  unpause: (id: number): Promise<{ message: string; status: string }> =>
    api.patch(`/listings/${id}/unpause`),

  renew: (id: number): Promise<{ message: string; expires_at: string; status: string }> =>
    api.patch(`/listings/${id}/renew`),

  getFeatured: (): Promise<{ data: any[] }> =>
    api.get('/listings/featured'),

  recordView: (id: number): Promise<{ views: number }> =>
    api.post(`/listings/${id}/view`),
};

// ─── Interactions ─────────────────────────────────────────────────────────────
export const interactionsApi = {
  bookmark: (listingId: number): Promise<any> =>
    api.post(`/listings/${listingId}/bookmark`),

  removeBookmark: (listingId: number): Promise<any> =>
    api.delete(`/listings/${listingId}/bookmark`),

  getBookmarks: (): Promise<any> =>
    api.get('/bookmarks'),

  submitBid: (
    listingId: number,
    data: { amount: number; message?: string }
  ): Promise<any> =>
    api.post(`/listings/${listingId}/bid`, data),

  getBids: (listingId: number): Promise<{
    bid_count: number;
    highest_bid: number | null;
    bids: Array<{ amount: number; message: string | null; submitted_at: string }>;
  }> =>
    api.get(`/listings/${listingId}/bids`),

  report: (
    listingId: number,
    data: { reason: string; details?: string }
  ): Promise<any> =>
    api.post(`/listings/${listingId}/report`, data),

  saveSearch: (data: {
    name: string;
    filters: Record<string, any>;
  }): Promise<any> =>
    api.post('/saved-searches', data),

  getSavedSearches: (): Promise<any> =>
    api.get('/saved-searches'),

  deleteSavedSearch: (id: number): Promise<any> =>
    api.delete(`/saved-searches/${id}`),
};

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesApi = {
  getInbox: (): Promise<{ data: any[] }> =>
    api.get('/messages'),

  getThread: (otherUserId: number, listingId: number): Promise<{ data: any[] }> =>
    api.get(`/messages/${otherUserId}/${listingId}`),

  send: (data: {
    to_user_id: number;
    listing_id: number;
    body: string;
  }): Promise<any> =>
    api.post('/messages', data),
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const userApi = {
  getMyListings: (page = 1): Promise<any> =>
    api.get(`/user/listings?page=${page}`),

  getDashboardStats: (): Promise<{
    stats: Record<string, number>;
    recent_listings: any[];
  }> =>
    api.get('/user/dashboard'),

  updateProfile: (data: {
    name_ar?: string;
    name_en?: string;
    phone?: string;
    password?: string;
    password_confirmation?: string;
  }): Promise<any> =>
    api.put('/user/profile', data),

  uploadAvatar: (data: FormData): Promise<{ avatar_path: string }> =>
    api.post('/user/avatar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAvatar: (): Promise<{ message: string }> =>
    api.delete('/user/avatar'),

  getMyBids: (): Promise<{
    data: Array<{
      id: number;
      amount: number;
      message: string | null;
      submitted_at: string;
      listing: {
        id: number;
        title_ar: string;
        title_en: string | null;
        section: string;
        status: string;
        price: number | null;
      } | null;
    }>;
  }> =>
    api.get('/user/bids'),

  uploadBusinessVerification: (data: FormData): Promise<any> =>
    api.post('/user/business-verification', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAccount: (password: string): Promise<any> =>
    api.delete('/user/account', { data: { password } }),
};

// ─── Plans & Subscriptions ───────────────────────────────────────────────────
import type { Plan, SubscriptionSnapshot, BillingCycle, PlanCode } from '@/types'

export const plansApi = {
  list: () => api.get<{ data: Plan[] }>('/plans'),
}

export const subscriptionApi = {
  current: () => api.get<{ data: SubscriptionSnapshot }>('/user/subscription'),

  requestUpgrade: (planCode: PlanCode, cycle: BillingCycle, notes?: string) =>
    api.post('/user/subscription/upgrade-request', {
      plan_code: planCode,
      billing_cycle: cycle,
      notes,
    }),

  cancel: () => api.post('/user/subscription/cancel'),
}

export const adminSubscriptionApi = {
  list:    (params?: { status?: string; plan?: string; page?: number }) =>
    api.get('/admin/subscriptions', { params }),
  pending: () => api.get('/admin/subscriptions/pending'),
  update:  (id: number, action: 'extend'|'cancel'|'activate', extendDays?: number) =>
    api.patch(`/admin/subscriptions/${id}`, { action, extend_days: extendDays }),
  grantPlan: (userId: number, planCode: PlanCode, cycle: BillingCycle, note?: string) =>
    api.post(`/admin/users/${userId}/grant-plan`, {
      plan_code: planCode, billing_cycle: cycle, note,
    }),
  plans:        () => api.get('/admin/plans'),
  updatePlan:   (id: number, fields: Partial<Plan>) =>
    api.patch(`/admin/plans/${id}`, fields),
}

// ─── Push subscriptions (Web Push) ───────────────────────────────────────────
export const pushApi = {
  subscribe: (sub: {
    endpoint:    string
    p256dh?:     string
    auth?:       string
    user_agent?: string
  }) => api.post('/user/push-subscriptions', sub),

  unsubscribe: (endpoint: string) =>
    api.delete('/user/push-subscriptions', { data: { endpoint } }),

  list: () => api.get<{ data: Array<{ id: number; endpoint: string; created_at: string }> }>(
    '/user/push-subscriptions'
  ),
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export const statsApi = {
  get: (): Promise<{
    total_listings: number;
    total_users: number;
    sections: Record<string, number>;
  }> => api.get('/stats'),
};

export interface ListingComment {
  id: number;
  listing_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  is_official_answer: boolean;
  is_marked_helpful: boolean;
  upvotes_count: number;
  viewer_voted?: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name_ar: string | null;
    name_en: string | null;
    avatar_url?: string | null;
    avatar?: string | null;
    role: string;
    is_trusted_payer: boolean;
  };
  replies?: ListingComment[];
}

export type CommentSort = 'newest' | 'votes' | 'official';

export const commentsApi = {
  getAll: (listingId: number, page = 1, sort?: CommentSort): Promise<{
    data: ListingComment[];
    meta: { current_page: number; last_page: number; total: number };
  }> => {
    const params: any = { page };
    if (sort) params.sort = sort;
    return api.get(`/listings/${listingId}/comments`, { params });
  },

  add: (listingId: number, body: string, parentId?: number): Promise<{ message: string; data: ListingComment }> =>
    api.post(`/listings/${listingId}/comments`, { body, parent_id: parentId ?? null }),

  delete: (listingId: number, commentId: number): Promise<{ message: string }> =>
    api.delete(`/listings/${listingId}/comments/${commentId}`),

  /* ── Q&A interactions ── */
  toggleVote: (commentId: number): Promise<{ upvotes_count: number; voted: boolean }> =>
    api.post(`/comments/${commentId}/vote`),

  markHelpful: (commentId: number): Promise<{ message: string; is_marked_helpful: boolean }> =>
    api.post(`/comments/${commentId}/mark-helpful`),

  unmarkHelpful: (commentId: number): Promise<{ message: string; is_marked_helpful: boolean }> =>
    api.post(`/comments/${commentId}/unmark-helpful`),

  report: (commentId: number, reason: string, details?: string): Promise<{ message: string }> =>
    api.post(`/comments/${commentId}/report`, { reason, details }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: (): Promise<any> =>
    api.get('/admin/dashboard'),

  getAnalytics: (): Promise<any> =>
    api.get('/admin/analytics'),

  getListings: (params?: {
    status?: string;
    section?: string;
    page?: number;
    search?: string;
  }): Promise<any> =>
    api.get('/admin/listings', { params }),

  approveListing: (id: number): Promise<any> =>
    api.patch(`/admin/listings/${id}/approve`),

  rejectListing: (id: number, reason: string): Promise<any> =>
    api.patch(`/admin/listings/${id}/reject`, { reason }),

  toggleFeatured: (id: number): Promise<any> =>
    api.patch(`/admin/listings/${id}/feature`),

  getVerifications: (): Promise<any> =>
    api.get('/admin/verifications'),

  approveVerification: (id: number): Promise<any> =>
    api.post(`/admin/verifications/${id}/approve`),

  rejectVerification: (id: number, reason: string): Promise<any> =>
    api.post(`/admin/verifications/${id}/reject`, { reason }),

  getReports: (params?: { page?: number }): Promise<any> =>
    api.get('/admin/reports', { params }),

  resolveReport: (id: number): Promise<any> =>
    api.patch(`/admin/reports/${id}/resolve`),

  getUsers: (params?: {
    search?: string;
    role?: string;
    page?: number;
  }): Promise<any> =>
    api.get('/admin/users', { params }),

  toggleTrustedPayer: (id: number): Promise<any> =>
    api.patch(`/admin/users/${id}/trusted-payer`),

  // Manual email verification — for users who can't receive the email
  manuallyVerifyEmail: (id: number, note?: string): Promise<any> =>
    api.patch(`/admin/users/${id}/verify-email`, { note }),

  // Admin-triggered resend of the verification email
  adminResendVerification: (id: number): Promise<{ sent: boolean; message: string }> =>
    api.post(`/admin/users/${id}/resend-verification`),

  /* ── Phase 2: bulk actions ── */
  bulkApproveListings: (ids: number[]): Promise<any> =>
    api.post('/admin/listings/bulk-approve', { ids }),

  bulkRejectListings: (ids: number[], reason: string): Promise<any> =>
    api.post('/admin/listings/bulk-reject', { ids, reason }),

  /* ── Phase 2: suspend / delete users ── */
  suspendUser: (id: number, reason: string): Promise<any> =>
    api.patch(`/admin/users/${id}/suspend`, { reason }),

  unsuspendUser: (id: number): Promise<any> =>
    api.patch(`/admin/users/${id}/unsuspend`),

  deleteUser: (id: number): Promise<any> =>
    api.delete(`/admin/users/${id}`),

  /* ── Phase 2: audit log ── */
  getAuditLogs: (params?: {
    admin_id?: number;
    action?: string;
    target_type?: string;
    target_id?: number;
    from?: string;
    to?: string;
    page?: number;
  }): Promise<any> =>
    api.get('/admin/audit-logs', { params }),

  /* ── Forum: comments moderation ── */
  getComments: (params?: { reported?: boolean | number; listing_id?: number; search?: string; page?: number }): Promise<any> =>
    api.get('/admin/comments', { params }),

  deleteComment: (id: number): Promise<{ message: string }> =>
    api.delete(`/admin/comments/${id}`),

  markCommentOfficial: (id: number): Promise<{ message: string; is_official_answer: boolean }> =>
    api.post(`/admin/comments/${id}/mark-official`),

  unmarkCommentOfficial: (id: number): Promise<{ message: string; is_official_answer: boolean }> =>
    api.post(`/admin/comments/${id}/unmark-official`),
};

export const aiApi = {
  // Calls Next.js API route (not Laravel) — Vercel has no outbound restrictions
  // Extract structured fields from free Arabic/English text
  extractListing: async (data: { text: string }): Promise<{
    section: string;
    listing_type: string;
    fields: Record<string, string>;
    missing: string[];
    summary_ar: string;
  }> => {
    const res = await fetch('/api/ai/extract-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw { response: { data: json } };
    return json;
  },

  writeListing: async (data: {
    section: string;
    listing_type?: string;
    fields: Record<string, string>;
    original_text?: string;
  }): Promise<{
    data: {
      title_ar: string;
      title_en: string;
      description_ar: string;
      description_en: string;
    };
  }> => {
    const res = await fetch('/api/ai/write-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw { response: { data: json } };
    return json;
  },
};

export default api;
