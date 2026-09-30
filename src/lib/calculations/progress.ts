import type { DossierDocument, Task, TrainingPath, TrainingSession } from '@/types/domain'

export const PHASE_COUNT = 6

export interface PhaseProgress {
  phase: number
  done: number
  total: number
  pct: number
}

export function phaseProgress(tasks: Task[]): PhaseProgress[] {
  return Array.from({ length: PHASE_COUNT }, (_, i) => {
    const phase = i + 1
    const ts = tasks.filter((t) => t.phase === phase)
    const done = ts.filter((t) => t.status === 'TERMINEE').length
    return { phase, done, total: ts.length, pct: ts.length ? Math.round((done / ts.length) * 100) : 0 }
  })
}

export function currentPhase(progress: PhaseProgress[]) {
  const p = progress.find((x) => x.pct < 100)
  return p ? p.phase : PHASE_COUNT
}

export function planProgress(tasks: Task[]) {
  if (!tasks.length) return 0
  return Math.round((tasks.filter((t) => t.status === 'TERMINEE').length / tasks.length) * 100)
}

export function documentsProgress(docs: DossierDocument[]) {
  if (!docs.length) return 0
  const score = docs.reduce((a, d) => a + (d.status === 'VALIDE' ? 1 : d.status === 'EN_COURS' ? 0.4 : 0), 0)
  return Math.round((score / docs.length) * 100)
}

export function trainingProgress(paths: TrainingPath[], sessions: TrainingSession[]) {
  if (!paths.length) return 0
  const perPath = paths.map((p) => {
    const covered = new Set(sessions.filter((s) => s.pathId === p.id).flatMap((s) => s.moduleIds))
    return p.modules.length ? covered.size / p.modules.length : 0
  })
  return Math.round((perPath.reduce((a, b) => a + b, 0) / paths.length) * 100)
}

export const PROGRESS_WEIGHTS = { gap: 0.3, plan: 0.4, documents: 0.2, trainings: 0.1 }

export function overallProgress(parts: { gap: number; plan: number; documents: number; trainings: number }) {
  return Math.round(
    parts.gap * PROGRESS_WEIGHTS.gap +
      parts.plan * PROGRESS_WEIGHTS.plan +
      parts.documents * PROGRESS_WEIGHTS.documents +
      parts.trainings * PROGRESS_WEIGHTS.trainings,
  )
}
