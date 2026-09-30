import { useMemo } from 'react'
import { db } from '@/mocks/db'
import { useSession } from '@/stores/session.store'
import { useUi } from '@/stores/ui.store'
import { can, type Capability } from '@/lib/permissions'
import type { Enterprise, Licencie, User } from '@/types/domain'

export function useCurrentUser(): User | null {
  const userId = useSession((s) => s.userId)
  const revision = useUi((s) => s.dataRevision)
  return useMemo(() => {
    void revision
    const u = db.users.find((x) => x.id === userId)
    return u ? { ...u } : null
  }, [userId, revision])
}

export function useCan(capability: Capability) {
  const user = useCurrentUser()
  return can(user?.role, capability)
}

/** Reads the tenant synchronously so layouts can theme before the first paint. */
export function useTenant(): { licencie?: Licencie; enterprise?: Enterprise } {
  const user = useCurrentUser()
  const revision = useUi((s) => s.dataRevision)
  return useMemo(() => {
    void revision
    if (!user?.tenantId) return {}
    const licencie = db.licencies.find((l) => l.id === user.tenantId)
    const enterprise = db.enterprises.find((e) => e.id === user.tenantId)
    return {
      licencie: licencie && structuredClone(licencie),
      enterprise: enterprise && structuredClone(enterprise),
    }
  }, [user, revision])
}
