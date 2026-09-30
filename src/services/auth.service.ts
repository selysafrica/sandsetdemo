import { ApiError, db, delay, persist } from '@/mocks/db'
import { DEMO_2FA_CODE, DEMO_PASSWORD } from '@/mocks/data/network.seed'
import { useSession } from '@/stores/session.store'
import type { User } from '@/types/domain'
import { currentUser, fullName } from './scope'

export type LoginResult = { kind: 'ok'; user: User } | { kind: '2fa' } | { kind: 'suspended' }

function tenantSuspended(user: User) {
  if (user.role !== 'LICENCIE_ADMIN' && user.role !== 'LICENCIE_USER') return false
  return db.licencies.find((l) => l.id === user.tenantId)?.status === 'SUSPENDU'
}

function logAccess(user: User, action: string, sensitive = false) {
  if (user.role !== 'ADMIN_CONCESSIONNAIRE') return
  db.accessLogs.unshift({
    id: `log_${Date.now()}`,
    userName: fullName(user),
    role: user.role,
    action,
    sensitive,
    ip: '41.207.12.84',
    device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Navigateur · poste de travail',
    at: new Date().toISOString(),
  })
  persist()
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    await delay(null, 350, 700)
    const session = useSession.getState()
    if (session.failedAttempts >= db.settings.lockAfterFailures)
      throw new ApiError(429, 'Trop de tentatives. Réessayez dans 15 minutes.')
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user || password !== DEMO_PASSWORD || user.status === 'DESACTIVE') {
      session.registerFailure()
      throw new ApiError(401, 'Courriel ou mot de passe incorrect.')
    }
    if (tenantSuspended(user)) return { kind: 'suspended' }
    if (user.twoFactorEnabled) {
      session.setPending2fa(user.id)
      return { kind: '2fa' }
    }
    user.lastLoginAt = new Date().toISOString()
    logAccess(user, 'Connexion réussie')
    session.setUser(user.id)
    return { kind: 'ok', user }
  },

  async verify2fa(code: string): Promise<User> {
    await delay(null, 300, 500)
    const session = useSession.getState()
    const user = db.users.find((u) => u.id === session.pending2faUserId)
    if (!user) throw new ApiError(401, 'Session de vérification expirée.')
    if (code !== DEMO_2FA_CODE) throw new ApiError(401, 'Code invalide. Vérifiez votre application.')
    logAccess(user, 'Validation 2FA')
    session.setUser(user.id)
    return user
  },

  /** Demo persona switch: bypasses password and 2FA, never available in production. */
  switchPersona(userId: string) {
    const user = db.users.find((u) => u.id === userId)
    if (!user) return
    useSession.getState().setUser(user.id)
  },

  async impersonate(licencieId: string) {
    const admin = currentUser()
    const target = db.users.find((u) => u.tenantId === licencieId && u.role === 'LICENCIE_ADMIN')
    if (!target) throw new ApiError(404, 'Aucun administrateur pour ce licencié')
    const lic = db.licencies.find((l) => l.id === licencieId)
    logAccess(admin, `Connexion en tant que ${lic?.branding.nomCommercial} (impersonation)`, true)
    await delay(null)
    useSession.getState().startImpersonation(admin.id, target.id)
    return target
  },

  async requestReset(email: string) {
    await delay(email, 400, 800)
  },

  async resetPassword(password: string) {
    await delay(password, 400, 700)
  },

  async changePassword(current: string, next: string) {
    await delay(null)
    if (current !== DEMO_PASSWORD) throw new ApiError(400, 'Mot de passe actuel incorrect.')
    return next
  },

  async setTwoFactor(enabled: boolean, code?: string) {
    await delay(null)
    if (enabled && code !== DEMO_2FA_CODE) throw new ApiError(400, 'Code invalide.')
    const user = db.users.find((u) => u.id === currentUser().id)!
    user.twoFactorEnabled = enabled
    persist()
  },

  async updateProfile(patch: Partial<Pick<User, 'firstName' | 'lastName' | 'title' | 'phone'>>) {
    const user = db.users.find((u) => u.id === currentUser().id)!
    Object.assign(user, patch)
    persist()
    return delay(user)
  },
}
