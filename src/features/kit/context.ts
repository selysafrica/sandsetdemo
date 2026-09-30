import { useOutletContext } from 'react-router-dom'
import type { DossierSummary } from '@/services/dossiers.service'

export interface DossierContext {
  dossierId: string
  base: string
  summary: DossierSummary
  isEnterprise: boolean
  canManageTeam: boolean
  openNewVersion: () => void
}

export function useDossierContext() {
  return useOutletContext<DossierContext>()
}
