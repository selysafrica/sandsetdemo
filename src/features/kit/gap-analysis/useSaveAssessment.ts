import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { qk, workspaceKeys } from '@/hooks/queries'
import { assessmentsService } from '@/services/workspace.service'
import type { ClauseAssessment } from '@/types/domain'

type Patch = Partial<Pick<ClauseAssessment, 'score' | 'applicable' | 'constat' | 'preuves'>>

const pending = new Map<string, { dossierId: string; clauseId: string; patch: Patch }>()

async function flush() {
  const items = [...pending.values()]
  pending.clear()
  for (const it of items) await assessmentsService.save(it.dossierId, it.clauseId, it.patch)
  return items.length
}

/** Optimistic save; queued locally when offline and replayed when the network returns. */
export function useSaveAssessment(dossierId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    const onOnline = async () => {
      const n = await flush()
      if (n) {
        toast.success(`${n} évaluation${n > 1 ? 's' : ''} synchronisée${n > 1 ? 's' : ''}`)
        for (const k of workspaceKeys(dossierId)) qc.invalidateQueries({ queryKey: k })
      }
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [dossierId, qc])

  return useCallback(
    async (clauseId: string, patch: Patch) => {
      qc.setQueryData<ClauseAssessment[]>(qk.assessments(dossierId), (old) => old?.map((a) => (a.clauseId === clauseId ? { ...a, ...patch, evaluatedAt: new Date().toISOString() } : a)))
      if (!navigator.onLine) {
        const key = `${dossierId}:${clauseId}`
        pending.set(key, { dossierId, clauseId, patch: { ...pending.get(key)?.patch, ...patch } })
        return 'queued' as const
      }
      try {
        await assessmentsService.save(dossierId, clauseId, patch)
        for (const k of workspaceKeys(dossierId)) qc.invalidateQueries({ queryKey: k })
        return 'saved' as const
      } catch (e) {
        toast.error((e as Error).message)
        qc.invalidateQueries({ queryKey: qk.assessments(dossierId) })
        return 'error' as const
      }
    },
    [dossierId, qc],
  )
}
