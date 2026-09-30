import { addYears, formatISO, parseISO } from 'date-fns'
import { db, delay, persist } from '@/mocks/db'
import type { Audit, AuditResult } from '@/types/domain'
import { fullName, requireRole } from './scope'

export const habilitationsService = {
  async list(licencieId?: string) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const habilitations = licencieId ? db.habilitations.filter((h) => h.licencieId === licencieId) : db.habilitations
    const audits = licencieId ? db.audits.filter((a) => a.licencieId === licencieId) : db.audits
    return delay({
      habilitations: [...habilitations].sort((a, b) => a.expireLe.localeCompare(b.expireLe)),
      audits: [...audits].sort((a, b) => b.date.localeCompare(a.date)),
    })
  },

  async add(input: { licencieId: string; intitule: string; delivreeLe: string; dureeAns: number; auditeur: string }) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const h = {
      id: `hab_${Date.now()}`,
      licencieId: input.licencieId,
      intitule: input.intitule,
      delivreeLe: input.delivreeLe,
      expireLe: formatISO(addYears(parseISO(input.delivreeLe), input.dureeAns), { representation: 'date' }),
      auditeur: input.auditeur,
    }
    db.habilitations.push(h)
    persist()
    return delay(h)
  },

  async addAudit(input: { licencieId: string; date: string; auditeur: string; resultat: AuditResult; constats: string[]; suspensionProposee: boolean }) {
    const admin = requireRole('ADMIN_CONCESSIONNAIRE')
    const audit: Audit = { id: `aud_${Date.now()}`, ...input }
    db.audits.push(audit)
    const lic = db.licencies.find((l) => l.id === input.licencieId)
    db.activity.unshift({ id: `a_${Date.now()}`, scope: 'network', kind: 'status', label: `Audit ${lic?.raisonSociale} — ${input.resultat.replace('_', ' ').toLowerCase()}`, actor: fullName(admin), at: new Date().toISOString() })
    persist()
    return delay(audit)
  },
}
