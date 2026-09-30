import { describe, expect, it } from 'vitest'
import type { Clause, ClauseAssessment, RoyaltyGrid } from '@/types/domain'
import { computeCoverage } from './coverage'
import { buildLedger, computeBreakdown } from './royalties'
import { habilitationAlert } from './alerts'
import { overallProgress } from './progress'

const clause = (id: string, poids: 1 | 2 | 3): Clause => ({
  id,
  code: id,
  chapitre: 4,
  titre: id,
  exigence: '',
  guide: [],
  poids,
  nouveaute2026: false,
})

const assess = (clauseId: string, score: ClauseAssessment['score'], applicable = true): ClauseAssessment => ({
  id: clauseId,
  dossierId: 'd',
  clauseId,
  score,
  applicable,
  constat: '',
  preuves: '',
})

describe('coverage', () => {
  it('weights scores and excludes non-applicable clauses', () => {
    const clauses = [clause('a', 1), clause('b', 3), clause('c', 2)]
    const result = computeCoverage(clauses, [assess('a', 4), assess('b', 2), assess('c', null, false)])
    expect(result.applicable).toBe(2)
    expect(result.evaluated).toBe(2)
    expect(result.coverage).toBe(Math.round(((4 * 1 + 2 * 3) / (4 * 1 + 4 * 3)) * 100))
    expect(result.gaps).toBe(1)
  })

  it('counts unevaluated clauses in the denominator', () => {
    expect(computeCoverage([clause('a', 1), clause('b', 1)], [assess('a', 4)]).coverage).toBe(50)
  })
})

const grid: RoyaltyGrid = {
  version: 1,
  T: 1_000_000,
  currency: 'XOF',
  entryFeeCoef: { CABINET: 1, FORMATION: 0.8, INSTITUTION: 1.5, PME: 0.5, ETI: 0.75 },
  annualFixedCoef: 0.4,
  exclusivityMarkupPct: 25,
  caFormationPct: 8,
  programmeForfaitCoef: 0.3,
  annualDiscountPct: 15,
  plans: [],
  updatedAt: '',
  updatedBy: '',
}

describe('royalties', () => {
  it('anchors every component on T', () => {
    const b = computeBreakdown(grid, { segment: 'CABINET', exclusivite: true, caSessions: 10_000_000 })
    expect(b.droitEntree).toBe(1_000_000)
    expect(b.annuelle).toBe(400_000)
    expect(b.majoration).toBe(100_000)
    expect(b.variable).toBe(800_000)
    expect(b.forfait).toBe(300_000)
    expect(b.premiereAnnee).toBe(2_600_000)
    expect(b.anneesSuivantes).toBe(1_600_000)
  })

  it('flags late lines and partial payments', () => {
    const today = new Date('2026-06-01')
    const ledger = buildLedger(
      [
        { id: 'l1', licencieId: 'x', type: 'REDEVANCE_ANNUELLE', periode: '2026', montantDu: 100, dueDate: '2026-05-01' },
        { id: 'l2', licencieId: 'x', type: 'FORFAIT_PROGRAMME', periode: '2026', montantDu: 100, dueDate: '2026-07-01' },
      ],
      [{ id: 'p', licencieId: 'x', royaltyLineId: 'l2', montant: 40, date: '2026-05-10', mode: 'VIREMENT', reference: '' }],
      today,
    )
    expect(ledger[0].status).toBe('EN_RETARD')
    expect(ledger[0].joursRetard).toBe(31)
    expect(ledger[1].status).toBe('PARTIEL')
    expect(ledger[1].solde).toBe(60)
  })
})

describe('alerts', () => {
  const today = new Date('2026-01-01')
  it('opens the planning window 12 months before expiry', () => {
    expect(habilitationAlert({ expireLe: '2027-06-01' }, today)).toBe('OK')
    expect(habilitationAlert({ expireLe: '2026-11-01' }, today)).toBe('A_PLANIFIER')
    expect(habilitationAlert({ expireLe: '2026-02-15' }, today)).toBe('URGENT')
    expect(habilitationAlert({ expireLe: '2025-12-01' }, today)).toBe('EXPIREE')
  })
})

describe('progress', () => {
  it('applies the module weights', () => {
    expect(overallProgress({ gap: 100, plan: 50, documents: 0, trainings: 100 })).toBe(60)
  })
})
