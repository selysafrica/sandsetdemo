import { ApiError, db, delay, persist } from '@/mocks/db'
import type { ClauseAssessment, DossierDocument, Task, TrainingSession } from '@/types/domain'
import { currentUser, dossierById, fullName } from './scope'

function logActivity(dossierId: string, kind: 'assessment' | 'document' | 'training' | 'task', label: string) {
  const dossier = db.dossiers.find((d) => d.id === dossierId)!
  db.activity.unshift({ id: `a_${Date.now()}`, scope: dossier.tenantId, kind, label: `${label} — ${dossier.clientName}`, actor: fullName(currentUser()), at: new Date().toISOString() })
}

export const assessmentsService = {
  async list(dossierId: string) {
    dossierById(dossierId)
    return delay(db.assessments.filter((a) => a.dossierId === dossierId), 120, 300)
  },

  async save(dossierId: string, clauseId: string, patch: Partial<Pick<ClauseAssessment, 'score' | 'applicable' | 'constat' | 'preuves'>>) {
    dossierById(dossierId)
    const a = db.assessments.find((x) => x.dossierId === dossierId && x.clauseId === clauseId)
    if (!a) throw new ApiError(404, 'Évaluation introuvable')
    Object.assign(a, patch, { evaluatedBy: fullName(currentUser()), evaluatedAt: new Date().toISOString() })
    persist()
    return delay(a, 80, 200)
  },
}

export const tasksService = {
  async list(dossierId: string) {
    dossierById(dossierId)
    return delay(db.tasks.filter((t) => t.dossierId === dossierId), 120, 300)
  },

  async mine() {
    const user = currentUser()
    const name = fullName(user)
    const dossiers = db.dossiers.filter((d) => d.tenantId === user.tenantId && d.assignedUserIds.includes(user.id))
    const ids = new Set(dossiers.map((d) => d.id))
    return delay(
      db.tasks
        .filter((t) => ids.has(t.dossierId) && t.responsable === name && t.status !== 'TERMINEE')
        .map((t) => ({ ...t, clientName: dossiers.find((d) => d.id === t.dossierId)!.clientName }))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    )
  },

  async save(task: Omit<Task, 'id'> & { id?: string }) {
    dossierById(task.dossierId)
    if (task.id) {
      const existing = db.tasks.find((t) => t.id === task.id)!
      const locked = existing.templateId ? { titre: existing.titre, description: existing.description } : {}
      const wasDone = existing.status === 'TERMINEE'
      Object.assign(existing, task, locked)
      if (!wasDone && existing.status === 'TERMINEE') logActivity(task.dossierId, 'task', `Tâche terminée : ${existing.titre}`)
      persist()
      return delay(existing, 80, 200)
    }
    const created: Task = { ...task, id: `tk_${Date.now()}` }
    db.tasks.push(created)
    persist()
    return delay(created)
  },

  async remove(taskId: string) {
    const t = db.tasks.find((x) => x.id === taskId)!
    dossierById(t.dossierId)
    if (t.templateId) throw new ApiError(400, 'Une tâche du socle ne peut pas être supprimée.')
    db.tasks = db.tasks.filter((x) => x.id !== taskId)
    persist()
    return delay(taskId)
  },
}

export const documentsService = {
  async list(dossierId: string) {
    dossierById(dossierId)
    return delay(db.documents.filter((d) => d.dossierId === dossierId), 120, 300)
  },

  async save(doc: Omit<DossierDocument, 'id' | 'updatedAt'> & { id?: string }) {
    dossierById(doc.dossierId)
    const now = new Date().toISOString()
    if (doc.id) {
      const existing = db.documents.find((d) => d.id === doc.id)!
      const becameValid = existing.status !== 'VALIDE' && doc.status === 'VALIDE'
      Object.assign(existing, doc, { updatedAt: now })
      if (becameValid) {
        existing.validatedBy = fullName(currentUser())
        logActivity(doc.dossierId, 'document', `${existing.titre} validé`)
      }
      persist()
      return delay(existing, 80, 200)
    }
    const created: DossierDocument = { ...doc, id: `doc_${Date.now()}`, updatedAt: now }
    db.documents.push(created)
    persist()
    return delay(created)
  },

  async remove(docId: string) {
    const d = db.documents.find((x) => x.id === docId)!
    dossierById(d.dossierId)
    if (d.templateId) throw new ApiError(400, 'Un document du socle ne peut pas être supprimé.')
    db.documents = db.documents.filter((x) => x.id !== docId)
    persist()
    return delay(docId)
  },
}

export const trainingsService = {
  async list(dossierId: string) {
    dossierById(dossierId)
    const user = currentUser()
    const sessions = db.sessions.filter((s) => s.dossierId === dossierId)
    return delay(user.role === 'ENTREPRISE' ? sessions.map(({ caFacture: _ca, ...s }) => s as TrainingSession) : sessions, 120, 300)
  },

  async save(session: Omit<TrainingSession, 'id'> & { id?: string }) {
    dossierById(session.dossierId)
    if (session.id) {
      const existing = db.sessions.find((s) => s.id === session.id)!
      Object.assign(existing, session)
      persist()
      return delay(existing)
    }
    const created: TrainingSession = { ...session, id: `ts_${Date.now()}` }
    db.sessions.push(created)
    logActivity(session.dossierId, 'training', `Session enregistrée (${session.participants.length} participants)`)
    persist()
    return delay(created)
  },
}
