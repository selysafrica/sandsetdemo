import { ApiError, db } from '@/mocks/db'
import { useSession } from '@/stores/session.store'
import type { Dossier, Role, User } from '@/types/domain'

export function currentUser(): User {
  const id = useSession.getState().userId
  const user = db.users.find((u) => u.id === id)
  if (!user) throw new ApiError(401, 'Session expirée')
  return user
}

export function requireRole(...roles: Role[]) {
  const user = currentUser()
  if (!roles.includes(user.role)) throw new ApiError(403, 'Accès refusé')
  return user
}

/** Tenant isolation: the Console never reads client content; users only reach their own tenant. */
export function assertDossierAccess(dossier: Dossier | undefined): Dossier {
  if (!dossier) throw new ApiError(404, 'Dossier introuvable')
  const user = currentUser()
  if (user.role === 'ADMIN_CONCESSIONNAIRE') throw new ApiError(403, 'La Console ne consulte aucun contenu client')
  if (user.tenantId !== dossier.tenantId) throw new ApiError(403, 'Ce dossier appartient à un autre espace')
  if (user.role === 'LICENCIE_USER' && !dossier.assignedUserIds.includes(user.id))
    throw new ApiError(403, "Ce dossier ne vous est pas affecté")
  return dossier
}

export function dossierById(id: string) {
  return assertDossierAccess(db.dossiers.find((d) => d.id === id))
}

export function visibleDossiers(): Dossier[] {
  const user = currentUser()
  if (user.role === 'ADMIN_CONCESSIONNAIRE') throw new ApiError(403, 'La Console ne consulte aucun contenu client')
  return db.dossiers.filter(
    (d) => d.tenantId === user.tenantId && (user.role !== 'LICENCIE_USER' || d.assignedUserIds.includes(user.id)),
  )
}

export function fullName(u: Pick<User, 'firstName' | 'lastName'>) {
  return `${u.firstName} ${u.lastName}`
}
