import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  userId: string | null
  pending2faUserId: string | null
  impersonatorId: string | null
  failedAttempts: number
  expired: boolean
  setUser: (userId: string | null) => void
  setPending2fa: (userId: string | null) => void
  startImpersonation: (adminId: string, targetUserId: string) => void
  stopImpersonation: () => void
  registerFailure: () => number
  resetFailures: () => void
  setExpired: (expired: boolean) => void
  logout: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      userId: null,
      pending2faUserId: null,
      impersonatorId: null,
      failedAttempts: 0,
      expired: false,
      setUser: (userId) => set({ userId, pending2faUserId: null, failedAttempts: 0, expired: false }),
      setPending2fa: (pending2faUserId) => set({ pending2faUserId }),
      startImpersonation: (adminId, targetUserId) => set({ impersonatorId: adminId, userId: targetUserId }),
      stopImpersonation: () => {
        const { impersonatorId } = get()
        if (impersonatorId) set({ userId: impersonatorId, impersonatorId: null })
      },
      registerFailure: () => {
        const failedAttempts = get().failedAttempts + 1
        set({ failedAttempts })
        return failedAttempts
      },
      resetFailures: () => set({ failedAttempts: 0 }),
      setExpired: (expired) => set({ expired }),
      logout: () => set({ userId: null, pending2faUserId: null, impersonatorId: null, expired: false }),
    }),
    { name: 'standset-session' },
  ),
)
