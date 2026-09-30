import type { Clause, ClauseAssessment, Score } from '@/types/domain'

export const SCORE_LABELS: Record<Score, string> = {
  0: 'Non traité',
  1: 'Initié',
  2: 'Partiel',
  3: 'Largement couvert',
  4: 'Conforme',
}

export const SCORE_HINTS: Record<Score, string> = {
  0: "Aucune disposition en place pour cette exigence.",
  1: 'Démarche amorcée, non formalisée ni appliquée.',
  2: 'Dispositions partielles ou appliquées de façon irrégulière.',
  3: 'Dispositions en place, quelques preuves manquantes.',
  4: 'Exigence satisfaite, preuves disponibles et à jour.',
}

export const GAP_THRESHOLD = 2

export interface CoverageResult {
  coverage: number
  evaluated: number
  applicable: number
  total: number
  gaps: number
}

export function computeCoverage(clauses: Clause[], assessments: ClauseAssessment[]): CoverageResult {
  const byClause = new Map(assessments.map((a) => [a.clauseId, a]))
  let weighted = 0
  let max = 0
  let evaluated = 0
  let applicable = 0
  let gaps = 0
  for (const clause of clauses) {
    const a = byClause.get(clause.id)
    if (a && !a.applicable) continue
    applicable++
    max += 4 * clause.poids
    if (a && a.score !== null) {
      evaluated++
      weighted += a.score * clause.poids
      if (a.score <= GAP_THRESHOLD) gaps++
    }
  }
  return {
    coverage: max === 0 ? 0 : Math.round((weighted / max) * 100),
    evaluated,
    applicable,
    total: clauses.length,
    gaps,
  }
}

export function coverageByChapter(clauses: Clause[], assessments: ClauseAssessment[]) {
  const chapters = [...new Set(clauses.map((c) => c.chapitre))].sort((a, b) => a - b)
  return chapters.map((chapitre) => {
    const cs = clauses.filter((c) => c.chapitre === chapitre)
    return { chapitre, ...computeCoverage(cs, assessments) }
  })
}

export function coverageTone(value: number): 'danger' | 'warning' | 'brand' | 'success' {
  if (value < 40) return 'danger'
  if (value < 70) return 'warning'
  if (value < 90) return 'brand'
  return 'success'
}
