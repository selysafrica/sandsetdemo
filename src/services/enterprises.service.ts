import { addMonths, formatISO } from 'date-fns'
import { ApiError, db, delay, persist } from '@/mocks/db'
import { LATEST_KIT_VERSION_ID } from '@/mocks/data/socle.seed'
import type { Enterprise, Periodicity, Plan } from '@/types/domain'
import { currentUser, requireRole } from './scope'
import { seedDossierWorkspace } from './dossiers.service'

export function planPrice(plan: Plan, periodicity: Periodicity) {
  const p = db.grid.plans.find((x) => x.id === plan)!
  return periodicity === 'ANNUEL' ? Math.round(p.monthly * 12 * (1 - db.grid.annualDiscountPct / 100)) : p.monthly
}

export interface SignupInput {
  raisonSociale: string
  secteur: string
  effectif: string
  pays: string
  ville: string
  certifie: boolean
  certificateExpiry?: string
  sites: number
  firstName: string
  lastName: string
  fonction: string
  email: string
  phone: string
  plan: Plan
  periodicity: Periodicity
  payment: { kind: 'CARTE' | 'MOBILE_MONEY'; label: string }
}

export const enterprisesService = {
  async list() {
    requireRole('ADMIN_CONCESSIONNAIRE')
    return delay(db.enterprises)
  },

  async get(id: string) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const e = db.enterprises.find((x) => x.id === id)
    if (!e) throw new ApiError(404, 'Entreprise introuvable')
    return delay({ enterprise: e, invoices: db.invoices.filter((i) => i.enterpriseId === id) })
  },

  async setStatus(id: string, status: Enterprise['subscriptionStatus']) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const e = db.enterprises.find((x) => x.id === id)!
    e.subscriptionStatus = status
    persist()
    return delay(e)
  },

  async mine() {
    const user = requireRole('ENTREPRISE')
    const e = db.enterprises.find((x) => x.id === user.tenantId)!
    return delay({
      enterprise: e,
      invoices: db.invoices.filter((i) => i.enterpriseId === e.id).sort((a, b) => b.date.localeCompare(a.date)),
      plans: db.grid.plans,
      discount: db.grid.annualDiscountPct,
    })
  },

  async changePlan(plan: Plan, periodicity: Periodicity) {
    const user = requireRole('ENTREPRISE')
    const e = db.enterprises.find((x) => x.id === user.tenantId)!
    e.plan = plan
    e.periodicity = periodicity
    persist()
    return delay(e)
  },

  async updatePayment(payment: Enterprise['paymentMethod']) {
    const user = requireRole('ENTREPRISE')
    const e = db.enterprises.find((x) => x.id === user.tenantId)!
    e.paymentMethod = payment
    if (e.subscriptionStatus === 'IMPAYE') e.subscriptionStatus = 'ACTIF'
    persist()
    return delay(e, 800, 1200)
  },

  async cancel() {
    const user = requireRole('ENTREPRISE')
    const e = db.enterprises.find((x) => x.id === user.tenantId)!
    e.subscriptionStatus = 'RESILIE'
    persist()
    return delay(e)
  },

  async retryInvoice(invoiceId: string) {
    currentUser()
    const inv = db.invoices.find((i) => i.id === invoiceId)!
    inv.status = 'PAYEE'
    persist()
    return delay(inv, 900, 1400)
  },

  async signup(input: SignupInput) {
    await delay(null, 500, 800)
    if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase()))
      throw new ApiError(409, 'Un compte existe déjà avec ce courriel.')
    const n = db.enterprises.length + 1
    const id = `ent_${Date.now()}`
    const dossierId = `dos_${id}`
    const today = new Date()
    const enterprise: Enterprise = {
      id,
      ref: `ENT-${String(n).padStart(4, '0')}`,
      raisonSociale: input.raisonSociale,
      secteur: input.secteur,
      effectif: input.effectif,
      pays: input.pays,
      ville: input.ville,
      plan: input.plan,
      periodicity: input.periodicity,
      subscriptionStatus: 'ACTIF',
      subscribedAt: formatISO(today, { representation: 'date' }),
      nextBillingAt: formatISO(addMonths(today, input.periodicity === 'ANNUEL' ? 12 : 1), { representation: 'date' }),
      dossierId,
      paymentMethod: input.payment,
      certificateExpiry: input.certificateExpiry,
      progress: 0,
    }
    db.enterprises.push(enterprise)
    const userId = `usr_${id}`
    db.users.push({ id: userId, firstName: input.firstName, lastName: input.lastName, email: input.email, role: 'ENTREPRISE', tenantId: id, title: input.fonction, phone: input.phone, twoFactorEnabled: false, status: 'ACTIF', lastLoginAt: today.toISOString() })
    db.invoices.push({ id: `inv_${id}`, number: `FAC-2026-${String(2000 + n).padStart(5, '0')}`, enterpriseId: id, date: formatISO(today, { representation: 'date' }), amount: planPrice(input.plan, input.periodicity), status: 'PAYEE' })
    db.dossiers.push({
      id: dossierId,
      ref: `DOS-${String(db.dossiers.length + 41).padStart(4, '0')}`,
      tenantId: id,
      clientName: input.raisonSociale,
      secteur: input.secteur,
      effectif: input.effectif,
      siteCount: input.sites,
      ville: input.ville,
      responsableQualite: `${input.firstName} ${input.lastName}`,
      responsableEmail: input.email,
      certifie2015: input.certifie,
      certificateExpiry: input.certificateExpiry,
      assignedUserIds: [userId],
      kitVersionId: LATEST_KIT_VERSION_ID,
      createdAt: today.toISOString(),
      targetAuditDate: formatISO(addMonths(today, 12), { representation: 'date' }),
      status: 'ACTIF',
    })
    seedDossierWorkspace(dossierId, `${input.firstName} ${input.lastName}`)
    persist()
    return { enterprise, userId }
  },
}
