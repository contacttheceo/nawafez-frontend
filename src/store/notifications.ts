import { create } from 'zustand'

interface NotificationState {
  unreadMessages: number
  setUnreadMessages: (n: number) => void
  clearThreadUnread: (count: number) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadMessages: 0,

  setUnreadMessages: (n) => set({ unreadMessages: Math.max(0, n) }),

  clearThreadUnread: (count) =>
    set((s) => ({ unreadMessages: Math.max(0, s.unreadMessages - count) })),
}))
