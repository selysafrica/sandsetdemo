import { ApiError, db, delay, persist } from '@/mocks/db'
import type { Branding, UserProfile } from '@/types/domain'
import { currentUser, fullName, requireRole } from './scope'

function myLicencie() {
  const user = currentUser()
  const lic = db.licencies.find((l) => l.id === user.tenantId)
  if (!lic) throw new ApiError(403, 'Aucun tenant licencié')
  return lic
}

export const tenantService = {
  /** Synchronous read used by layouts to theme the instance. */
  current() {
    const user = currentUser()
    if (user.role === 'LICENCIE_ADMIN' || user.role === 'LICENCIE_USER') return { kind: 'licencie' as const, licencie: myLicencie() }
    if (user.role === 'ENTREPRISE') return { kind: 'entreprise' as const, enterprise: db.enterprises.find((e) => e.id === user.tenantId)! }
    return { kind: 'concessionnaire' as const }
  },

  brandingForSubdomain(sub: string | null) {
    if (!sub) return null
    return db.licencies.find((l) => l.branding.subdomain === sub && l.status !== 'SUSPENDU')?.branding ?? null
  },

  async users() {
    const user = requireRole('LICENCIE_ADMIN')
    const users = db.users.filter((u) => u.tenantId === user.tenantId)
    return delay(
      users.map((u) => ({
        ...u,
        dossiers: db.dossiers.filter((d) => d.tenantId === user.tenantId && d.assignedUserIds.includes(u.id)).map((d) => ({ id: d.id, clientName: d.clientName })),
      })),
    )
  },

  /** Lightweight team list for selects (consultants can see colleagues' names). */
  async team() {
    const user = currentUser()
    if (user.role === 'ENTREPRISE') return delay([{ id: user.id, name: fullName(user), profile: undefined as UserProfile | undefined }])
    return delay(
      db.users
        .filter((u) => u.tenantId === user.tenantId && u.status !== 'DESACTIVE')
        .map((u) => ({ id: u.id, name: fullName(u), profile: u.profile, load: db.dossiers.filter((d) => d.assignedUserIds.includes(u.id)).length })),
      60,
      150,
    )
  },

  async invite(input: { firstName: string; lastName: string; email: string; profile: UserProfile; dossierIds: string[] }[]) {
    const admin = requireRole('LICENCIE_ADMIN')
    for (const i of input) {
      if (db.users.some((u) => u.email.toLowerCase() === i.email.toLowerCase())) throw new ApiError(409, `${i.email} a déjà un compte.`)
      const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      db.users.push({ id, firstName: i.firstName, lastName: i.lastName, email: i.email, role: i.profile === 'ADMIN' ? 'LICENCIE_ADMIN' : 'LICENCIE_USER', profile: i.profile, tenantId: admin.tenantId, twoFactorEnabled: false, status: 'INVITE' })
      for (const d of db.dossiers.filter((x) => i.dossierIds.includes(x.id) && x.tenantId === admin.tenantId)) d.assignedUserIds.push(id)
    }
    persist()
    return delay(input.length, 400, 700)
  },

  async setUserStatus(userId: string, status: 'ACTIF' | 'DESACTIVE') {
    const admin = requireRole('LICENCIE_ADMIN')
    const u = db.users.find((x) => x.id === userId && x.tenantId === admin.tenantId)
    if (!u) throw new ApiError(404, 'Utilisateur introuvable')
    if (u.id === admin.id) throw new ApiError(400, 'Vous ne pouvez pas désactiver votre propre compte.')
    u.status = status
    if (status === 'DESACTIVE') for (const d of db.dossiers) d.assignedUserIds = d.assignedUserIds.filter((x) => x !== userId)
    persist()
    return delay(u)
  },

  async setUserDossiers(userId: string, dossierIds: string[]) {
    const admin = requireRole('LICENCIE_ADMIN')
    for (const d of db.dossiers.filter((x) => x.tenantId === admin.tenantId)) {
      const has = d.assignedUserIds.includes(userId)
      if (dossierIds.includes(d.id) && !has) d.assignedUserIds.push(userId)
      if (!dossierIds.includes(d.id) && has) d.assignedUserIds = d.assignedUserIds.filter((x) => x !== userId)
    }
    persist()
    return delay(true)
  },

  async resendInvite(userId: string) {
    requireRole('LICENCIE_ADMIN')
    return delay(userId, 300, 600)
  },

  async saveBranding(branding: Branding, completeOnboarding = false) {
    requireRole('LICENCIE_ADMIN')
    const lic = myLicencie()
    lic.branding = branding
    if (completeOnboarding) lic.onboarded = true
    persist()
    return delay(lic)
  },

  async checkSubdomain(sub: string) {
    const lic = myLicencie()
    const taken = db.licencies.some((l) => l.id !== lic.id && l.branding.subdomain === sub)
    return delay(!taken && /^[a-z0-9-]{3,30}$/.test(sub), 300, 600)
  },

  async verifyDomain() {
    const lic = myLicencie()
    lic.branding.domainStatus = 'ACTIF'
    persist()
    return delay(true, 900, 1400)
  },

  async declarations() {
    const user = requireRole('LICENCIE_ADMIN')
    const lic = myLicencie()
    const dossiers = db.dossiers.filter((d) => d.tenantId === user.tenantId)
    const ids = new Set(dossiers.map((d) => d.id))
    const quarterStart = new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString()
    const q = Math.floor(new Date().getMonth() / 3) + 1
    return delay({
      history: db.declarations.filter((d) => d.licencieId === lic.id).sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
      current: {
        periode: `T${q} ${new Date().getFullYear()}`,
        dossiersActifs: dossiers.filter((d) => d.status === 'ACTIF').length,
        sessions: db.sessions.filter((s) => ids.has(s.dossierId) && s.date >= quarterStart.slice(0, 10)).length,
        caSuggested: db.sessions.filter((s) => ids.has(s.dossierId) && s.date >= quarterStart.slice(0, 10)).reduce((a, s) => a + (s.caFacture ?? 0), 0),
      },
      pct: db.grid.caFormationPct,
    })
  },

  async declare(input: { periode: string; dossiersActifs: number; sessions: number; caSessions: number }) {
    requireRole('LICENCIE_ADMIN')
    const lic = myLicencie()
    if (db.declarations.some((d) => d.licencieId === lic.id && d.periode === input.periode)) throw new ApiError(409, 'Cette période a déjà été déclarée.')
    db.declarations.push({ id: `decl_${Date.now()}`, licencieId: lic.id, ...input, sentAt: new Date().toISOString() })
    lic.indicators.dossiersActifs = input.dossiersActifs
    lic.indicators.sessionsFormation += input.sessions
    persist()
    return delay(true, 500, 800)
  },

  async activity() {
    const user = currentUser()
    return delay(db.activity.filter((a) => a.scope === user.tenantId).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10))
  },
}
