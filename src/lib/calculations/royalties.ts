import type { Licencie, Payment, RoyaltyGrid, RoyaltyLine, RoyaltyType, Segment } from '@/types/domain'
import { differenceInCalendarDays, parseISO } from 'date-fns'

export const ROYALTY_LABELS: Record<RoyaltyType, string> = {
  DROIT_ENTREE: "Droit d'entrée",
  REDEVANCE_ANNUELLE: 'Redevance annuelle fixe',
  MAJORATION_EXCLUSIVITE: 'Majoration exclusivité',
  VARIABLE_CA: 'Variable sur CA sessions',
  FORFAIT_PROGRAMME: 'Forfait programme',
}

export interface RoyaltyBreakdown {
  droitEntree: number
  annuelle: number
  majoration: number
  variable: number
  forfait: number
  premiereAnnee: number
  anneesSuivantes: number
}

export function computeBreakdown(
  grid: RoyaltyGrid,
  input: { segment: Segment; exclusivite: boolean; caSessions: number },
): RoyaltyBreakdown {
  const droitEntree = grid.T * grid.entryFeeCoef[input.segment]
  const annuelle = grid.T * grid.annualFixedCoef
  const majoration = input.exclusivite ? annuelle * (grid.exclusivityMarkupPct / 100) : 0
  const variable = input.caSessions * (grid.caFormationPct / 100)
  const forfait = grid.T * grid.programmeForfaitCoef
  const recurring = annuelle + majoration + variable + forfait
  return {
    droitEntree,
    annuelle,
    majoration,
    variable,
    forfait,
    premiereAnnee: droitEntree + recurring,
    anneesSuivantes: recurring,
  }
}

export function estimateNetworkAnnual(grid: RoyaltyGrid, licencies: Licencie[]) {
  return licencies
    .filter((l) => l.status !== 'SUSPENDU')
    .reduce(
      (acc, l) =>
        acc +
        computeBreakdown(grid, {
          segment: l.segment,
          exclusivite: l.exclusivite,
          caSessions: l.indicators.caSessionsDeclare,
        }).anneesSuivantes,
      0,
    )
}

export type LineStatus = 'A_VENIR' | 'PARTIEL' | 'SOLDE' | 'EN_RETARD'

export interface LedgerLine extends RoyaltyLine {
  paye: number
  solde: number
  status: LineStatus
  joursRetard: number
}

export function buildLedger(lines: RoyaltyLine[], payments: Payment[], today = new Date()): LedgerLine[] {
  const paidByLine = new Map<string, number>()
  for (const p of payments) paidByLine.set(p.royaltyLineId, (paidByLine.get(p.royaltyLineId) ?? 0) + p.montant)
  return lines.map((line) => {
    const paye = paidByLine.get(line.id) ?? 0
    const solde = Math.max(0, line.montantDu - paye)
    const late = differenceInCalendarDays(today, parseISO(line.dueDate))
    let status: LineStatus
    if (solde === 0) status = 'SOLDE'
    else if (late > 0) status = 'EN_RETARD'
    else if (paye > 0) status = 'PARTIEL'
    else status = 'A_VENIR'
    return { ...line, paye, solde, status, joursRetard: status === 'EN_RETARD' ? late : 0 }
  })
}

export function ledgerTotals(ledger: LedgerLine[]) {
  const du = ledger.reduce((a, l) => a + l.montantDu, 0)
  const encaisse = ledger.reduce((a, l) => a + l.paye, 0)
  const retard = ledger.filter((l) => l.status === 'EN_RETARD').reduce((a, l) => a + l.solde, 0)
  return { du, encaisse, solde: du - encaisse, retard }
}
