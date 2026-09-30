import { useTeam } from '@/hooks/queries'
import type { DossierSummary } from '@/services/dossiers.service'

/** People who can own a task or document on this dossier. */
export function useResponsables(summary: DossierSummary) {
  const { data: team = [] } = useTeam()
  const names = new Set<string>()
  summary.team.forEach((m) => names.add(m.name))
  team.forEach((m) => names.add(m.name))
  names.add(summary.dossier.responsableQualite)
  return [...names]
}
