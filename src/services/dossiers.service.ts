import { addDays, formatISO } from 'date-fns'
import { ApiError, db, delay, persist } from '@/mocks/db'
import { LATEST_KIT_VERSION_ID } from '@/mocks/data/socle.seed'
import type { Dossier, KitVersion } from '@/types/domain'
import { computeCoverage } from '@/lib/calculations/coverage'
import {
  currentPhase,
  documentsProgress,
  overallProgress,
  phaseProgress,
  planProgress,
  trainingProgress,
} from '@/lib/calculations/progress'
import { diffSocle } from '@/lib/calculations/diff'
import { assertDossierAccess, currentUser, dossierById, fullName, requireRole, visibleDossiers } from './scope'

export interface DossierSummary {
  dossier: Dossier
  version: KitVersion
  coverage: ReturnType<typeof computeCoverage>
  phases: ReturnType<typeof phaseProgress>
  currentPhase: number
  progress: { gap: number; plan: number; documents: number; trainings: number; overall: number }
  lateTasks: number
  openTasks: number
  nextDue?: { titre: string; dueDate: string }
  docs: { A_CREER: number; EN_COURS: number; VALIDE: number; total: number }
  team: { id: string; name: string }[]
  hasNewerVersion: boolean
}

export function summarize(dossier: Dossier): DossierSummary {
  const version = db.kitVersions.find((v) => v.id === dossier.kitVersionId)!
  const assessments = db.assessments.filter((a) => a.dossierId === dossier.id)
  const tasks = db.tasks.filter((t) => t.dossierId === dossier.id)
  const docs = db.documents.filter((d) => d.dossierId === dossier.id)
  const sessions = db.sessions.filter((s) => s.dossierId === dossier.id)
  const coverage = computeCoverage(version.content.clauses, assessments)
  const phases = phaseProgress(tasks)
  const today = formatISO(new Date(), { representation: 'date' })
  const open = tasks.filter((t) => t.status !== 'TERMINEE').sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const parts = {
    gap: coverage.applicable ? Math.round((coverage.evaluated / coverage.applicable) * 100) : 0,
    plan: planProgress(tasks),
    documents: documentsProgress(docs),
    trainings: trainingProgress(version.content.trainings, sessions),
  }
  return {
    dossier,
    version,
    coverage,
    phases,
    currentPhase: currentPhase(phases),
    progress: { ...parts, overall: overallProgress(parts) },
    lateTasks: open.filter((t) => t.dueDate < today).length,
    openTasks: open.length,
    nextDue: open.find((t) => t.dueDate >= today),
    docs: {
      A_CREER: docs.filter((d) => d.status === 'A_CREER').length,
      EN_COURS: docs.filter((d) => d.status === 'EN_COURS').length,
      VALIDE: docs.filter((d) => d.status === 'VALIDE').length,
      total: docs.length,
    },
    team: dossier.assignedUserIds
      .map((id) => db.users.find((u) => u.id === id))
      .filter((u) => u !== undefined)
      .map((u) => ({ id: u.id, name: fullName(u) })),
    hasNewerVersion: dossier.kitVersionId !== LATEST_KIT_VERSION_ID && db.kitVersions.some((v) => v.id === LATEST_KIT_VERSION_ID),
  }
}

/** Creates assessments, template tasks and template documents for a new dossier. */
export function seedDossierWorkspace(dossierId: string, owner: string) {
  const dossier = db.dossiers.find((d) => d.id === dossierId)!
  const version = db.kitVersions.find((v) => v.id === dossier.kitVersionId)!
  const start = new Date()
  version.content.clauses.forEach((c, i) =>
    db.assessments.push({ id: `as_${dossierId}_${i}`, dossierId, clauseId: c.id, score: null, applicable: true, constat: '', preuves: '' }),
  )
  version.content.tasks.forEach((t, i) =>
    db.tasks.push({
      id: `tk_${dossierId}_${i}`,
      dossierId,
      phase: t.phase,
      templateId: t.id,
      titre: t.titre,
      description: t.description,
      responsable: owner,
      dueDate: formatISO(addDays(start, t.phase * 45 + (i % 5) * 4), { representation: 'date' }),
      status: 'A_FAIRE',
      priority: 'NORMALE',
    }),
  )
  version.content.documents.forEach((d, i) =>
    db.documents.push({ id: `doc_${dossierId}_${i}`, dossierId, templateId: d.id, code: d.code, titre: d.titre, type: d.type, clauseCode: d.clauseCode, status: 'A_CREER', owner, updatedAt: start.toISOString() }),
  )
}

export interface NewDossierInput {
  clientName: string
  secteur: string
  effectif: string
  siteCount: number
  ville: string
  responsableQualite: string
  responsableEmail: string
  certifie2015: boolean
  certificateExpiry?: string
  targetAuditDate: string
  assignedUserIds: string[]
}

export const dossiersService = {
  async list(): Promise<DossierSummary[]> {
    return delay(visibleDossiers().map(summarize))
  },

  async get(id: string): Promise<DossierSummary> {
    return delay(summarize(dossierById(id)))
  },

  async mine(): Promise<DossierSummary> {
    const user = requireRole('ENTREPRISE')
    const d = db.dossiers.find((x) => x.tenantId === user.tenantId)
    return delay(summarize(assertDossierAccess(d)))
  },

  async create(input: NewDossierInput): Promise<Dossier> {
    const user = requireRole('LICENCIE_ADMIN')
    const id = `dos_${Date.now()}`
    const dossier: Dossier = {
      id,
      ref: `DOS-${String(db.dossiers.length + 41).padStart(4, '0')}`,
      tenantId: user.tenantId!,
      ...input,
      kitVersionId: LATEST_KIT_VERSION_ID,
      createdAt: new Date().toISOString(),
      status: 'ACTIF',
    }
    db.dossiers.push(dossier)
    const owner = input.assignedUserIds.length
      ? fullName(db.users.find((u) => u.id === input.assignedUserIds[0])!)
      : fullName(user)
    seedDossierWorkspace(id, owner)
    const lic = db.licencies.find((l) => l.id === user.tenantId)!
    lic.indicators.dossiersActifs++
    db.activity.unshift({ id: `a_${Date.now()}`, scope: user.tenantId!, kind: 'create', label: `Dossier créé — ${input.clientName}`, actor: fullName(user), at: new Date().toISOString() })
    persist()
    return delay(dossier)
  },

  async assign(id: string, userIds: string[]) {
    requireRole('LICENCIE_ADMIN')
    const d = dossierById(id)
    const target = db.dossiers.find((x) => x.id === d.id)!
    target.assignedUserIds = userIds
    persist()
    return delay(target)
  },

  async setStatus(id: string, status: Dossier['status']) {
    requireRole('LICENCIE_ADMIN')
    const target = db.dossiers.find((x) => x.id === dossierById(id).id)!
    target.status = status
    persist()
    return delay(target)
  },

  newerVersionDiff(id: string) {
    const d = dossierById(id)
    const latest = db.kitVersions.find((v) => v.id === LATEST_KIT_VERSION_ID)!
    const current = db.kitVersions.find((v) => v.id === d.kitVersionId)!
    return { current, latest, diff: diffSocle(current.content, latest.content) }
  },

  /** Moves the dossier to the latest socle, keeping every existing evaluation, task and document. */
  async adoptLatest(id: string) {
    const user = currentUser()
    const target = db.dossiers.find((x) => x.id === dossierById(id).id)!
    const latest = db.kitVersions.find((v) => v.id === LATEST_KIT_VERSION_ID)!
    const existingClauses = new Set(db.assessments.filter((a) => a.dossierId === id).map((a) => a.clauseId))
    const newClauses = latest.content.clauses.filter((c) => !existingClauses.has(c.id))
    newClauses.forEach((c) => db.assessments.push({ id: `as_${id}_${c.id}`, dossierId: id, clauseId: c.id, score: null, applicable: true, constat: '', preuves: '' }))
    const existingTasks = new Set(db.tasks.filter((t) => t.dossierId === id).map((t) => t.templateId))
    latest.content.tasks
      .filter((t) => !existingTasks.has(t.id))
      .forEach((t) =>
        db.tasks.push({ id: `tk_${id}_${t.id}`, dossierId: id, phase: t.phase, templateId: t.id, titre: t.titre, description: t.description, responsable: fullName(user), dueDate: formatISO(addDays(new Date(), 30), { representation: 'date' }), status: 'A_FAIRE', priority: 'NORMALE' }),
      )
    const existingDocs = new Set(db.documents.filter((d) => d.dossierId === id).map((d) => d.templateId))
    latest.content.documents
      .filter((d) => !existingDocs.has(d.id))
      .forEach((d) => db.documents.push({ id: `doc_${id}_${d.id}`, dossierId: id, templateId: d.id, code: d.code, titre: d.titre, type: d.type, clauseCode: d.clauseCode, status: 'A_CREER', owner: fullName(user), updatedAt: new Date().toISOString() }))
    target.kitVersionId = latest.id
    persist()
    return delay({ newClauseIds: newClauses.map((c) => c.id) })
  },

  activity(id: string) {
    const d = dossierById(id)
    const events = [
      ...db.assessments.filter((a) => a.dossierId === d.id && a.evaluatedAt).map((a) => ({ at: a.evaluatedAt!, label: `Clause ${db.kitVersions.flatMap((v) => v.content.clauses).find((c) => c.id === a.clauseId)?.code} évaluée`, actor: a.evaluatedBy ?? '', kind: 'assessment' as const })),
      ...db.documents.filter((x) => x.dossierId === d.id && x.status === 'VALIDE').map((x) => ({ at: x.updatedAt, label: `${x.titre} validé`, actor: x.validatedBy ?? x.owner, kind: 'document' as const })),
      ...db.sessions.filter((s) => s.dossierId === d.id).map((s) => ({ at: s.date, label: `Session de formation (${s.participants.length} participants)`, actor: s.formateur, kind: 'training' as const })),
    ]
    return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)
  },

  assertExists(id: string) {
    if (!db.dossiers.some((d) => d.id === id)) throw new ApiError(404, 'Dossier introuvable')
  },
}
