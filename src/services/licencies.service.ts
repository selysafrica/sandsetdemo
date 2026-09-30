import { addDays, formatISO } from 'date-fns'
import { ApiError, db, delay, persist } from '@/mocks/db'
import { LATEST_KIT_VERSION_ID } from '@/mocks/data/socle.seed'
import type { LicenceStatus, Licencie, Segment } from '@/types/domain'
import { buildLedger, ledgerTotals } from '@/lib/calculations/royalties'
import { habilitationAlert } from '@/lib/calculations/alerts'
import { currentUser, fullName, requireRole } from './scope'

export interface LicencieRow extends Licencie {
  solde: number
  retard: number
  habilitationExpire?: string
  habilitationAlert: ReturnType<typeof habilitationAlert> | null
}

function toRow(l: Licencie): LicencieRow {
  const ledger = buildLedger(
    db.royaltyLines.filter((r) => r.licencieId === l.id),
    db.payments.filter((p) => p.licencieId === l.id),
  )
  const totals = ledgerTotals(ledger)
  const habs = db.habilitations
    .filter((h) => h.licencieId === l.id)
    .sort((a, b) => a.expireLe.localeCompare(b.expireLe))
  const first = habs[0]
  return {
    ...l,
    solde: totals.solde,
    retard: totals.retard,
    habilitationExpire: first?.expireLe,
    habilitationAlert: first ? habilitationAlert(first) : null,
  }
}

export interface NewLicencieInput {
  raisonSociale: string
  nomCommercial: string
  segment: Segment
  pays: string
  territoire: string
  exclusivite: boolean
  contactName: string
  contactEmail: string
  contactPhone: string
}

export const licenciesService = {
  async list(): Promise<LicencieRow[]> {
    requireRole('ADMIN_CONCESSIONNAIRE')
    return delay(db.licencies.map(toRow))
  },

  async get(id: string): Promise<LicencieRow> {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const l = db.licencies.find((x) => x.id === id)
    if (!l) throw new ApiError(404, 'Licencié introuvable')
    return delay(toRow(l))
  },

  async exclusivityConflict(territoire: string) {
    return db.licencies.find(
      (l) => l.exclusivite && l.status !== 'SUSPENDU' && l.territoire.toLowerCase() === territoire.trim().toLowerCase(),
    )
  },

  async create(input: NewLicencieInput): Promise<Licencie> {
    const admin = requireRole('ADMIN_CONCESSIONNAIRE')
    const n = db.licencies.length + 1
    const today = formatISO(new Date(), { representation: 'date' })
    const lic: Licencie = {
      id: `lic_${Date.now()}`,
      ref: `LIC-${String(n).padStart(4, '0')}`,
      raisonSociale: input.raisonSociale,
      segment: input.segment,
      territoire: input.territoire,
      pays: input.pays,
      exclusivite: input.exclusivite,
      status: 'EN_ATTENTE',
      statusHistory: [{ status: 'EN_ATTENTE', at: today, by: fullName(admin) }],
      dateEntree: today,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      branding: {
        nomCommercial: input.nomCommercial || input.raisonSociale,
        accentColor: '#1f4fe0',
        logoText: (input.nomCommercial || input.raisonSociale).slice(0, 2).toUpperCase(),
        domainStatus: 'NON_CONFIGURE',
        email: input.contactEmail,
        phone: input.contactPhone,
        address: input.territoire,
      },
      kitVersionId: LATEST_KIT_VERSION_ID,
      indicators: { dossiersActifs: 0, sessionsFormation: 0, caSessionsDeclare: 0, usersCount: 1, pctDerniereVersion: 100 },
      onboarded: false,
      lastActivityAt: new Date().toISOString(),
    }
    db.licencies.push(lic)
    const [firstName, ...rest] = input.contactName.split(' ')
    db.users.push({
      id: `usr_${lic.id}_admin`,
      firstName,
      lastName: rest.join(' '),
      email: input.contactEmail,
      role: 'LICENCIE_ADMIN',
      profile: 'ADMIN',
      tenantId: lic.id,
      twoFactorEnabled: false,
      status: 'INVITE',
    })
    db.royaltyLines.push({
      id: `rl_${Date.now()}`,
      licencieId: lic.id,
      type: 'DROIT_ENTREE',
      periode: 'Entrée',
      montantDu: db.grid.T * db.grid.entryFeeCoef[input.segment],
      dueDate: formatISO(addDays(new Date(), 30), { representation: 'date' }),
    })
    db.activity.unshift({ id: `a_${Date.now()}`, scope: 'network', kind: 'create', label: `${lic.raisonSociale} enregistré`, actor: fullName(admin), at: new Date().toISOString() })
    persist()
    return delay(lic)
  },

  async changeStatus(id: string, status: LicenceStatus, motif: string, notify: boolean) {
    const admin = requireRole('ADMIN_CONCESSIONNAIRE')
    const l = db.licencies.find((x) => x.id === id)
    if (!l) throw new ApiError(404, 'Licencié introuvable')
    if (status === 'HABILITE' && !db.habilitations.some((h) => h.licencieId === id && h.expireLe > new Date().toISOString()))
      throw new ApiError(400, 'Aucune habilitation valide : ajoutez-en une avant d’habiliter ce licencié.')
    l.status = status
    l.statusHistory.push({ status, at: formatISO(new Date(), { representation: 'date' }), motif, by: fullName(admin) })
    db.activity.unshift({ id: `a_${Date.now()}`, scope: 'network', kind: 'status', label: `${l.raisonSociale} — statut ${status.toLowerCase().replace('_', ' ')}${notify ? ' (notifié)' : ''}`, actor: fullName(admin), at: new Date().toISOString() })
    persist()
    return delay(l)
  },

  impact(id: string) {
    return {
      users: db.users.filter((u) => u.tenantId === id).length,
      dossiers: db.licencies.find((l) => l.id === id)?.indicators.dossiersActifs ?? 0,
    }
  },

  async history(id: string) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const l = db.licencies.find((x) => x.id === id)!
    const events = [
      ...l.statusHistory.map((s) => ({ at: s.at, label: `Statut : ${s.status === 'HABILITE' ? 'Habilité' : s.status === 'SUSPENDU' ? 'Suspendu' : 'En attente'}${s.motif ? ` — ${s.motif}` : ''}`, actor: s.by, kind: 'status' as const })),
      ...db.payments.filter((p) => p.licencieId === id).map((p) => ({ at: p.date, label: `Encaissement ${p.reference}`, actor: 'Comptabilité', kind: 'payment' as const, amount: p.montant })),
      ...db.reminders.filter((r) => r.licencieId === id).map((r) => ({ at: r.sentAt, label: `Relance niveau ${r.niveau}`, actor: 'Système', kind: 'reminder' as const, amount: r.montant })),
      ...db.kitVersions.filter((v) => v.publishedAt && v.publishedAt > l.dateEntree).map((v) => ({ at: v.publishedAt!, label: `Version ${v.number} reçue`, actor: 'StandSet', kind: 'kit' as const })),
    ]
    return delay(events.sort((a, b) => b.at.localeCompare(a.at)))
  },

  /** Aggregated indicators over 12 months: synthetic, anonymised series. */
  indicatorSeries(id: string) {
    currentUser()
    const l = db.licencies.find((x) => x.id === id)!
    return Array.from({ length: 12 }, (_, i) => {
      const f = 0.45 + (i / 11) * 0.55
      return {
        month: i,
        dossiers: Math.round(l.indicators.dossiersActifs * f),
        sessions: Math.round((l.indicators.sessionsFormation / 12) * (0.6 + ((i * 7) % 5) / 5)),
      }
    })
  },
}
