import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = Cookies.get('nawafez_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('nawafez_token')
      if (typeof window !== 'undefined') {
        window.location.href = '/ar/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    name_ar: string
    name_en: string
    email: string
    password: string
    password_confirmation: string
    phone?: string
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: {
    token: string
    email: string
    password: string
    password_confirmation: string
  }) => api.post('/auth/reset-password', data),

  verifyEmail: (url: string) => api.get(url),
}

// ─── Listings ─────────────────────────────────────────────────────────────────
export const listingsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/listings', { params }),

  getOne: (id: number) => api.get(`/listings/${id}`),

  create: (data: FormData) =>
    api.post('/listings', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: FormData) =>
    api.post(`/listings/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: number) => api.delete(`/listings/${id}`),

  getFeatured: () => api.get('/listings/featured'),

  recordView: (id: number) => api.post(`/listings/${id}/view`),
}

// ─── Interactions ─────────────────────────────────────────────────────────────
export const interactionsApi = {
  bookmark: (listingId: number) =>
    api.post('/interactions/bookmark', { listing_id: listingId }),

  removeBookmark: (listingId: number) =>
    api.delete(`/interactions/bookmark/${listingId}`),

  getBookmarks: () => api.get('/interactions/bookmarks'),

  submitBid: (listingId: number, file: File) => {
    const form = new FormData()
    form.append('listing_id', String(listingId))
    form.append('pdf', file)
    return api.post('/interactions/bid', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  report: (listingId: number, reason: string, details?: string) =>
    api.post('/interactions/report', { listing_id: listingId, reason, details }),

  saveSearch: (filters: Record<string, unknown>) =>
    api.post('/interactions/saved-search', { filters }),

  getSavedSearches: () => api.get('/interactions/saved-searches'),
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messagesApi = {
  getInbox: () => api.get('/messages/inbox'),

  getThread: (userId: number, listingId?: number) =>
    api.get('/messages/thread', { params: { user_id: userId, listing_id: listingId } }),

  send: (data: { recipient_id: number; listing_id?: number; body: string }) =>
    api.post('/messages', data),
}

// ─── User ─────────────────────────────────────────────────────────────────────
export const userApi = {
  updateProfile: (data: { name_ar: string; name_en: string; phone?: string }) =>
    api.put('/user/profile', data),

  uploadBusinessVerification: (crImage: File, crNumber: string) => {
    const form = new FormData()
    form.append('cr_image', crImage)
    form.append('cr_number', crNumber)
    return api.post('/user/verification', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteAccount: () => api.delete('/user/account'),

  getMyListings: () => api.get('/user/listings'),

  getDashboardStats: () => api.get('/user/dashboard'),
}

export default api
