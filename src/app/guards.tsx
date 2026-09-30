import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { db } from '@/mocks/db'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { homePath } from '@/lib/permissions'
import type { Role } from '@/types/domain'

export function RequireAuth({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const user = useCurrentUser()
  const location = useLocation()
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  if (!roles.includes(user.role)) return <Navigate to={homePath(user.role)} replace />
  if ((user.role === 'LICENCIE_ADMIN' || user.role === 'LICENCIE_USER') && db.licencies.find((l) => l.id === user.tenantId)?.status === 'SUSPENDU')
    return <Navigate to="/suspendu" replace />
  return <>{children}</>
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const user = useCurrentUser()
  if (user) return <Navigate to={homePath(user.role)} replace />
  return <>{children}</>
}
