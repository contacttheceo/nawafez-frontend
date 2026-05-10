import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
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
      _hasHydrated:    false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      setUser: (user) =>
        set({ user }),

      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      setHasHydrated: (v) =>
        set({ _hasHydrated: v }),
    }),
    {
      name:    'nawafez-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      // ✅ الآن isAuthenticated يُحفظ أيضاً
      partialize: (state) => ({
        token:           state.token,
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // ✅ بعد قراءة localStorage نُخبر التطبيق أن الـ store جاهز
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
