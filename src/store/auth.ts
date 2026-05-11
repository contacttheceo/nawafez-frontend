import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface AuthState {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  expiresAt:       number | null;   // Unix timestamp ms — session deadline
  _hasHydrated:    boolean;

  setAuth:         (user: User, token: string) => void;
  setUser:         (user: User) => void;
  clearAuth:       () => void;
  setHasHydrated:  (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      expiresAt:       null,
      _hasHydrated:    false,

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          expiresAt: Date.now() + SESSION_MS,
        }),

      setUser: (user) =>
        set({ user }),

      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false, expiresAt: null }),

      setHasHydrated: (v) =>
        set({ _hasHydrated: v }),
    }),
    {
      name:    'nawafez-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      partialize: (state) => ({
        token:           state.token,
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
        expiresAt:       state.expiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Auto-logout if session has expired on the frontend
          if (state.expiresAt && Date.now() > state.expiresAt) {
            state.clearAuth();
            if (typeof window !== 'undefined') {
              localStorage.removeItem('nawafez_token');
            }
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);
