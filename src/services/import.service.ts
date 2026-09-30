import { ApiError, db, delay, persist } from '@/mocks/db'
import { LATEST_KIT_VERSION_ID } from '@/mocks/data/socle.seed'
import type { Score } from '@/types/domain'
import { fullName, requireRole } from './scope'
import { seedDossierWorkspace } from './dossiers.service'

export type ImportKind = 'CONSOLE' | 'KIT'

export interface ValidationRow {
  entity: string
  recognized: number
  warnings: string[]
  level: 'ok' | 'warning' | 'error'
}

export interface ImportAnalysis {
  kind: ImportKind
  rows: ValidationRow[]
  preview: string[]
  payload: KitPayload | ConsolePayload
}

interface KitPayload {
  client: { nom: string; secteur?: string; ville?: string }
  evaluations: { clause: string; score: number; constat?: string }[]
  taches: { phase: number; titre: string; statut?: string }[]
  documents: { code: string; titre: string; statut?: string }[]
  sessions: { parcours: string; date: string; participants: number }[]
}

interface ConsolePayload {
  licencies: { raisonSociale: string; segment: string; territoire: string }[]
  echeances?: unknown[]
}

export const SAMPLE_KIT_JSON: KitPayload = {
  client: { nom: 'Abidjan Froid Industrie', secteur: 'Industrie', ville: 'Abidjan' },
  evaluations: [
    { clause: '4.1', score: 3, constat: 'Analyse PESTEL à jour, climat à intégrer.' },
    { clause: '4.2', score: 2 },
    { clause: '5.1', score: 3 },
    { clause: '6.1', score: 1, constat: 'Registre des opportunités inexistant.' },
    { clause: '7.5', score: 4 },
    { clause: '9.2', score: 2 },
    { clause: '11.4', score: 3 },
  ],
  taches: [
    { phase: 1, titre: 'Réunion de lancement avec la direction', statut: 'TERMINEE' },
    { phase: 2, titre: 'Évaluer les chapitres 4 et 5', statut: 'EN_COURS' },
  ],
  documents: [
    { code: 'DOC-06', titre: 'Politique qualité', statut: 'VALIDE' },
    { code: 'DOC-04', titre: 'Cartographie des processus', statut: 'EN_COURS' },
  ],
  sessions: [{ parcours: 'tp_1', date: '2026-06-12', participants: 9 }],
}

export const importService = {
  async analyze(fileName: string, text: string): Promise<ImportAnalysis> {
    requireRole('ADMIN_CONCESSIONNAIRE')
    await delay(null, 600, 900)
    let json: unknown
    try {
      json = JSON.parse(text)
    } catch {
      throw new ApiError(400, `${fileName} n'est pas un JSON valide.`)
    }
    const latest = db.kitVersions.find((v) => v.id === LATEST_KIT_VERSION_ID)!
    const codes = new Set(latest.content.clauses.map((c) => c.code))
    if (json && typeof json === 'object' && 'licencies' in json) {
      const p = json as ConsolePayload
      const missing = p.licencies.filter((l) => !l.segment).length
      return {
        kind: 'CONSOLE',
        payload: p,
        preview: p.licencies.slice(0, 5).map((l) => `${l.raisonSociale} · ${l.segment} · ${l.territoire}`),
        rows: [
          { entity: 'Licenciés', recognized: p.licencies.length, warnings: missing ? [`${missing} sans segment`] : [], level: missing ? 'warning' : 'ok' },
          { entity: 'Échéances', recognized: p.echeances?.length ?? 0, warnings: [], level: 'ok' },
        ],
      }
    }
    if (json && typeof json === 'object' && 'evaluations' in json && 'client' in json) {
      const p = json as KitPayload
      const unknown = p.evaluations.filter((e) => !codes.has(e.clause))
      return {
        kind: 'KIT',
        payload: p,
        preview: p.evaluations.slice(0, 5).map((e) => `§ ${e.clause} — score ${e.score}${e.constat ? ` — ${e.constat}` : ''}`),
        rows: [
          { entity: 'Dossier client', recognized: 1, warnings: [], level: 'ok' },
          { entity: 'Évaluations', recognized: p.evaluations.length - unknown.length, warnings: unknown.map((u) => `Clause ${u.clause} absente du socle ${latest.number}`), level: unknown.length ? 'warning' : 'ok' },
          { entity: 'Tâches', recognized: p.taches.length, warnings: [], level: 'ok' },
          { entity: 'Documents', recognized: p.documents.length, warnings: [], level: 'ok' },
          { entity: 'Sessions de formation', recognized: p.sessions.length, warnings: [], level: 'ok' },
        ],
      }
    }
    throw new ApiError(422, 'Format non reconnu : ni export Console, ni export Kit.')
  },

  async commit(fileName: string, analysis: ImportAnalysis, licencieId?: string) {
    const admin = requireRole('ADMIN_CONCESSIONNAIRE')
    let result = ''
    let dossierId: string | undefined
    if (analysis.kind === 'KIT') {
      if (!licencieId) throw new ApiError(400, 'Choisissez le licencié destinataire.')
      const p = analysis.payload as KitPayload
      dossierId = `dos_imp_${Date.now()}`
      const owner = db.users.find((u) => u.tenantId === licencieId && u.role === 'LICENCIE_ADMIN')
      db.dossiers.push({
        id: dossierId,
        ref: `DOS-${String(db.dossiers.length + 41).padStart(4, '0')}`,
        tenantId: licencieId,
        clientName: p.client.nom,
        secteur: p.client.secteur ?? 'Non renseigné',
        effectif: 'Non renseigné',
        siteCount: 1,
        ville: p.client.ville ?? '',
        responsableQualite: 'À compléter',
        responsableEmail: '',
        certifie2015: true,
        assignedUserIds: [],
        kitVersionId: LATEST_KIT_VERSION_ID,
        createdAt: new Date().toISOString(),
        targetAuditDate: new Date(Date.now() + 300 * 86_400_000).toISOString().slice(0, 10),
        status: 'ACTIF',
      })
      seedDossierWorkspace(dossierId, owner ? fullName(owner) : 'À affecter')
      const clauses = db.kitVersions.find((v) => v.id === LATEST_KIT_VERSION_ID)!.content.clauses
      let n = 0
      for (const e of p.evaluations) {
        const clause = clauses.find((c) => c.code === e.clause)
        const a = clause && db.assessments.find((x) => x.dossierId === dossierId && x.clauseId === clause.id)
        if (a) {
          a.score = Math.max(0, Math.min(4, e.score)) as Score
          a.constat = e.constat ?? ''
          a.evaluatedBy = 'Import prototype'
          a.evaluatedAt = new Date().toISOString()
          n++
        }
      }
      for (const t of p.taches) {
        const task = db.tasks.find((x) => x.dossierId === dossierId && x.titre === t.titre)
        if (task && t.statut) task.status = t.statut as typeof task.status
      }
      for (const d of p.documents) {
        const doc = db.documents.find((x) => x.dossierId === dossierId && x.code === d.code)
        if (doc && d.statut) doc.status = d.statut as typeof doc.status
      }
      result = `1 dossier, ${n} évaluations, ${p.taches.length} tâches, ${p.documents.length} documents, ${p.sessions.length} sessions importés`
    } else {
      const p = analysis.payload as ConsolePayload
      result = `${p.licencies.length} licenciés analysés (déjà présents dans le registre, aucun doublon créé)`
    }
    db.imports.unshift({ id: `imp_${Date.now()}`, fileName, kind: analysis.kind, result, at: new Date().toISOString(), by: fullName(admin) })
    persist()
    await delay(null, 900, 1300)
    return { result, dossierId }
  },
}
