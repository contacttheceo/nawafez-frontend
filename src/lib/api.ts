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

// ─── Response interceptor — unwrap data & handle 401 ─────────────────────────
api.interceptors.response.use(
  (response) => response.data,      // always return the JSON body directly
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('nawafez_token');
      const locale = document.documentElement.lang ?? 'ar';
      window.location.href = `/${locale}/auth/login`;
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
  getMyListings: (): Promise<any> =>
    api.get('/user/listings'),

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

  uploadBusinessVerification: (data: FormData): Promise<any> =>
    api.post('/user/business-verification', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAccount: (password: string): Promise<any> =>
    api.delete('/user/account', { data: { password } }),
};

// ─── Stats ────────────────────────────────────────────────────────────────────
export const statsApi = {
  get: (): Promise<{
    total_listings: number;
    total_users: number;
    sections: Record<string, number>;
  }> => api.get('/stats'),
};

export default api;
