import { ApiError, db, delay, persist } from '@/mocks/db'
import type { PaymentMode, RoyaltyGrid } from '@/types/domain'
import { buildLedger, computeBreakdown, ledgerTotals } from '@/lib/calculations/royalties'
import { currentUser, fullName, requireRole } from './scope'

function ledgerFor(licencieId?: string) {
  const lines = licencieId ? db.royaltyLines.filter((l) => l.licencieId === licencieId) : db.royaltyLines
  const payments = licencieId ? db.payments.filter((p) => p.licencieId === licencieId) : db.payments
  return buildLedger(lines, payments).sort((a, b) => b.dueDate.localeCompare(a.dueDate))
}

export const royaltiesService = {
  async grid(): Promise<RoyaltyGrid> {
    currentUser()
    return delay(db.grid)
  },

  async gridHistory() {
    requireRole('ADMIN_CONCESSIONNAIRE')
    return delay(db.gridHistory)
  },

  async saveGrid(grid: RoyaltyGrid) {
    const admin = requireRole('ADMIN_CONCESSIONNAIRE')
    const next = { ...grid, version: db.grid.version + 1, updatedAt: new Date().toISOString(), updatedBy: fullName(admin) }
    db.grid = next
    db.gridHistory.push({ version: next.version, T: next.T, at: next.updatedAt, by: next.updatedBy })
    db.accessLogs.unshift({ id: `log_${Date.now()}`, userName: fullName(admin), role: admin.role, action: 'Modification de la grille de redevances', sensitive: true, ip: '41.207.12.84', device: 'Navigateur', at: next.updatedAt })
    persist()
    return delay(next)
  },

  async ledger(licencieId?: string) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    return delay(ledgerFor(licencieId))
  },

  async payments(licencieId?: string) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const list = licencieId ? db.payments.filter((p) => p.licencieId === licencieId) : db.payments
    return delay([...list].sort((a, b) => b.date.localeCompare(a.date)))
  },

  async reminders(licencieId?: string) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const list = licencieId ? db.reminders.filter((r) => r.licencieId === licencieId) : db.reminders
    return delay([...list].sort((a, b) => b.sentAt.localeCompare(a.sentAt)))
  },

  async recordPayment(input: { licencieId: string; allocations: { lineId: string; montant: number }[]; date: string; mode: PaymentMode; reference: string }) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    if (!input.allocations.length) throw new ApiError(400, 'Sélectionnez au moins une échéance.')
    for (const a of input.allocations) {
      db.payments.push({ id: `pay_${Date.now()}_${a.lineId}`, licencieId: input.licencieId, royaltyLineId: a.lineId, montant: a.montant, date: input.date, mode: input.mode, reference: input.reference })
    }
    const lic = db.licencies.find((l) => l.id === input.licencieId)
    const total = input.allocations.reduce((s, a) => s + a.montant, 0)
    db.activity.unshift({ id: `a_${Date.now()}`, scope: 'network', kind: 'payment', label: `Encaissement ${lic?.raisonSociale} — ${total.toLocaleString('fr-FR')} FCFA`, actor: fullName(currentUser()), at: new Date().toISOString() })
    persist()
    return delay(total)
  },

  async sendReminder(licencieIds: string[], niveau: 1 | 2 | 3) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    for (const id of licencieIds) {
      const montant = ledgerTotals(ledgerFor(id)).retard
      db.reminders.push({ id: `rem_${Date.now()}_${id}`, licencieId: id, sentAt: new Date().toISOString(), niveau, montant, opened: false })
    }
    persist()
    return delay(licencieIds.length, 500, 900)
  },

  async setAutoReminders(enabled: boolean) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    db.settings.autoReminders = enabled
    persist()
    return delay(enabled)
  },

  /** Licensee's own view: only its tenant. */
  async ownLedger() {
    const user = requireRole('LICENCIE_ADMIN')
    const lic = db.licencies.find((l) => l.id === user.tenantId)!
    const ledger = ledgerFor(lic.id)
    const breakdown = computeBreakdown(db.grid, { segment: lic.segment, exclusivite: lic.exclusivite, caSessions: lic.indicators.caSessionsDeclare })
    const payments = db.payments.filter((p) => p.licencieId === lic.id).sort((a, b) => b.date.localeCompare(a.date))
    return delay({ ledger, breakdown, payments, totals: ledgerTotals(ledger), licencie: lic })
  },
}
