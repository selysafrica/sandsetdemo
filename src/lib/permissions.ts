import type { Role } from '@/types/domain'

export type Capability =
  | 'console.view'
  | 'licencies.manage'
  | 'royalties.manage'
  | 'kit.publish'
  | 'platform.settings'
  | 'tenant.view'
  | 'dossiers.create'
  | 'dossiers.viewAll'
  | 'dossiers.assign'
  | 'users.manage'
  | 'branding.edit'
  | 'royalties.viewOwn'
  | 'declarations.send'
  | 'kit.work'
  | 'training.billing'
  | 'billing.manage'

const MATRIX: Record<Role, Capability[]> = {
  ADMIN_CONCESSIONNAIRE: ['console.view', 'licencies.manage', 'royalties.manage', 'kit.publish', 'platform.settings'],
  LICENCIE_ADMIN: [
    'tenant.view',
    'dossiers.create',
    'dossiers.viewAll',
    'dossiers.assign',
    'users.manage',
    'branding.edit',
    'royalties.viewOwn',
    'declarations.send',
    'kit.work',
    'training.billing',
  ],
  LICENCIE_USER: ['tenant.view', 'kit.work', 'training.billing'],
  ENTREPRISE: ['kit.work', 'billing.manage'],
}

export function can(role: Role | undefined, capability: Capability) {
  return role ? MATRIX[role].includes(capability) : false
}

export function homePath(role: Role) {
  switch (role) {
    case 'ADMIN_CONCESSIONNAIRE':
      return '/console'
    case 'ENTREPRISE':
      return '/espace'
    default:
      return '/app'
  }
}
