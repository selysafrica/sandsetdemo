import { db, delay, persist } from '@/mocks/db'
import type { Database } from '@/mocks/db'
import { buildLedger, ledgerTotals } from '@/lib/calculations/royalties'
import { habilitationAlert } from '@/lib/calculations/alerts'
import { currentUser, requireRole } from './scope'

export const systemService = {
  async settings() {
    requireRole('ADMIN_CONCESSIONNAIRE')
    return delay(db.settings)
  },

  async saveSettings(patch: Partial<Database['settings']>) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    Object.assign(db.settings, patch)
    persist()
    return delay(db.settings)
  },

  async testRestore() {
    requireRole('ADMIN_CONCESSIONNAIRE')
    return delay({ ok: true, durationSeconds: 42 }, 400, 600)
  },

  async accessLogs() {
    requireRole('ADMIN_CONCESSIONNAIRE')
    return delay([...db.accessLogs].sort((a, b) => b.at.localeCompare(a.at)))
  },

  async imports() {
    requireRole('ADMIN_CONCESSIONNAIRE')
    return delay([...db.imports].sort((a, b) => b.at.localeCompare(a.at)))
  },

  async activity(scope: string) {
    currentUser()
    return delay(db.activity.filter((a) => a.scope === scope).sort((a, b) => b.at.localeCompare(a.at)))
  },

  /** Network dashboard: aggregates only. */
  async networkOverview() {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const active = db.licencies.filter((l) => l.status === 'HABILITE')
    const ledger = buildLedger(db.royaltyLines, db.payments)
    const year = new Date().getFullYear().toString()
    const yearLedger = ledger.filter((l) => l.dueDate.startsWith(year))
    const totals = ledgerTotals(yearLedger)
    const lateLicencies = new Set(ledger.filter((l) => l.status === 'EN_RETARD').map((l) => l.licencieId))
    const habAlerts = db.habilitations
      .map((h) => ({ h, level: habilitationAlert(h) }))
      .filter((x) => x.level !== 'OK')
    const majorAudits = db.audits.filter((a) => a.resultat === 'ECART_MAJEUR')
    const pending = db.licencies.filter((l) => l.status === 'EN_ATTENTE')
    const now = new Date()
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const lines = ledger.filter((l) => l.dueDate.startsWith(key))
      const byType = (t: string) => lines.filter((l) => l.type === t).reduce((s, l) => s + l.montantDu, 0)
      const encaisse = db.payments.filter((p) => p.date.startsWith(key)).reduce((s, p) => s + p.montant, 0)
      const f = 0.55 + (i / 11) * 0.45
      return {
        key,
        date: d.toISOString(),
        entree: byType('DROIT_ENTREE'),
        annuelle: byType('REDEVANCE_ANNUELLE') + byType('MAJORATION_EXCLUSIVITE'),
        variable: byType('VARIABLE_CA'),
        forfait: byType('FORFAIT_PROGRAMME'),
        encaisse,
        dossiers: Math.round(db.licencies.reduce((s, l) => s + l.indicators.dossiersActifs, 0) * f + db.enterprises.length * f),
        sessions: Math.round(db.licencies.reduce((s, l) => s + l.indicators.sessionsFormation, 0) / 12 * (0.7 + ((i * 5) % 7) / 10)),
      }
    })
    const segments = (['CABINET', 'FORMATION', 'INSTITUTION', 'PME', 'ETI'] as const).map((s) => ({
      segment: s,
      count: db.licencies.filter((l) => l.segment === s && l.status !== 'SUSPENDU').length,
      dossiers: db.licencies.filter((l) => l.segment === s).reduce((a, l) => a + l.indicators.dossiersActifs, 0),
    }))
    const countries = Object.entries(
      db.licencies.reduce<Record<string, number>>((acc, l) => ((acc[l.pays] = (acc[l.pays] ?? 0) + 1), acc), {}),
    )
      .map(([pays, count]) => ({ pays, count }))
      .sort((a, b) => b.count - a.count)
    return delay({
      habilites: active.length,
      enAttente: pending.length,
      suspendus: db.licencies.filter((l) => l.status === 'SUSPENDU').length,
      dossiersActifs: db.licencies.reduce((s, l) => s + l.indicators.dossiersActifs, 0) + db.enterprises.filter((e) => e.subscriptionStatus === 'ACTIF').length,
      sessions: db.licencies.reduce((s, l) => s + l.indicators.sessionsFormation, 0),
      caDeclare: db.licencies.reduce((s, l) => s + l.indicators.caSessionsDeclare, 0),
      totals,
      lateCount: lateLicencies.size,
      alertsCount: habAlerts.length + lateLicencies.size + majorAudits.length + pending.length,
      months,
      segments,
      countries,
      todo: [
        ...habAlerts.map(({ h, level }) => ({ kind: 'habilitation' as const, level, licencieId: h.licencieId, label: h.intitule, date: h.expireLe })),
        ...[...lateLicencies].map((id) => ({ kind: 'retard' as const, level: 'URGENT' as const, licencieId: id, label: 'Échéances en retard', date: '', amount: ledgerTotals(ledger.filter((l) => l.licencieId === id)).retard })),
        ...pending.map((l) => ({ kind: 'attente' as const, level: 'A_PLANIFIER' as const, licencieId: l.id, label: 'En attente de validation', date: l.dateEntree })),
        ...majorAudits.map((a) => ({ kind: 'audit' as const, level: 'URGENT' as const, licencieId: a.licencieId, label: 'Audit : écart majeur', date: a.date })),
      ],
      enterprises: {
        actifs: db.enterprises.filter((e) => e.subscriptionStatus === 'ACTIF').length,
        total: db.enterprises.length,
      },
    })
  },
}
