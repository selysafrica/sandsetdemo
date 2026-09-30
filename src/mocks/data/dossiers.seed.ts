import { addDays, differenceInCalendarDays, formatISO, parseISO } from 'date-fns'
import type {
  ClauseAssessment,
  Declaration,
  Dossier,
  DossierDocument,
  KitVersion,
  Score,
  Task,
  TrainingSession,
  User,
} from '@/types/domain'
import { createRng } from '../rng'
import { daysFromNow, monthsFromNow, timestamp } from './dates'

interface DossierRow {
  id: string
  tenantId: string
  clientName: string
  secteur: string
  effectif: string
  ville: string
  sites: number
  responsable: string
  assigned: string[]
  kit: string
  p: number
  status?: Dossier['status']
  monthsAgo: number
  auditInMonths: number
}

const ROWS: DossierRow[] = [
  { id: 'dos_ivoireagro', tenantId: 'lic_qualis', clientName: 'Ivoire Agro SA', secteur: 'Agroalimentaire', effectif: '250 à 999', ville: 'Abidjan', sites: 3, responsable: 'Christian Aka', assigned: ['usr_consultant'], kit: 'kv_2026_3', p: 0.91, monthsAgo: 11, auditInMonths: 1 },
  { id: 'dos_lagunepharma', tenantId: 'lic_qualis', clientName: 'Lagune Pharma', secteur: 'Santé', effectif: '50 à 249', ville: 'Abidjan', sites: 1, responsable: 'Dr Ruth Bamba', assigned: ['usr_consultant', 'usr_formateur'], kit: 'kv_2026_3', p: 0.72, monthsAgo: 9, auditInMonths: 3 },
  { id: 'dos_batik', tenantId: 'lic_qualis', clientName: 'Batik Logistique', secteur: 'Logistique', effectif: '50 à 249', ville: 'San-Pédro', sites: 2, responsable: 'Hervé Gnagne', assigned: ['usr_formateur'], kit: 'kv_2026_3', p: 0.64, monthsAgo: 8, auditInMonths: 5 },
  { id: 'dos_sahelbtp', tenantId: 'lic_qualis', clientName: 'Sahel BTP', secteur: 'BTP', effectif: '250 à 999', ville: 'Bouaké', sites: 4, responsable: 'Issa Coulibaly', assigned: ['usr_consultant'], kit: 'kv_2026_3', p: 0.55, monthsAgo: 7, auditInMonths: 6 },
  { id: 'dos_cacao', tenantId: 'lic_qualis', clientName: 'Cacao Premium Export', secteur: 'Agroalimentaire', effectif: '50 à 249', ville: 'San-Pédro', sites: 2, responsable: 'Nadège Kouamé', assigned: ['usr_formateur'], kit: 'kv_2026_3', p: 0.45, monthsAgo: 6, auditInMonths: 8 },
  { id: 'dos_palmiers', tenantId: 'lic_qualis', clientName: 'Clinique Les Palmiers', secteur: 'Santé', effectif: '50 à 249', ville: 'Abidjan', sites: 1, responsable: 'Dr Alain Ehui', assigned: ['usr_consultant'], kit: 'kv_2026_3', p: 0.38, monthsAgo: 5, auditInMonths: 9 },
  { id: 'dos_transit', tenantId: 'lic_qualis', clientName: 'Transit Atlantique', secteur: 'Logistique', effectif: '10 à 49', ville: 'Abidjan', sites: 1, responsable: 'Olivier Tanoh', assigned: [], kit: 'kv_2026_2', p: 0.27, monthsAgo: 5, auditInMonths: 10 },
  { id: 'dos_brs', tenantId: 'lic_qualis', clientName: 'Banque Rurale du Sud', secteur: 'Services financiers', effectif: '250 à 999', ville: 'Abidjan', sites: 12, responsable: 'Mireille Assi', assigned: ['usr_consultant'], kit: 'kv_2026_3', p: 0.18, status: 'EN_PAUSE', monthsAgo: 3, auditInMonths: 13 },
  { id: 'dos_eburnie', tenantId: 'lic_qualis', clientName: 'Eburnie Emballages', secteur: 'Industrie', effectif: '50 à 249', ville: 'Yopougon', sites: 1, responsable: 'Didier Konan', assigned: ['usr_formateur'], kit: 'kv_2026_3', p: 0.12, monthsAgo: 1, auditInMonths: 14 },
  { id: 'dos_fp_1', tenantId: 'lic_formapro', clientName: 'Sénélec Services', secteur: 'Énergie', effectif: '1 000 et plus', ville: 'Dakar', sites: 5, responsable: 'Aminata Diop', assigned: ['usr_formapro_c1'], kit: 'kv_2026_3', p: 0.6, monthsAgo: 8, auditInMonths: 4 },
  { id: 'dos_fp_2', tenantId: 'lic_formapro', clientName: 'Port Autonome Services', secteur: 'Logistique', effectif: '250 à 999', ville: 'Dakar', sites: 2, responsable: 'Cheikh Ba', assigned: [], kit: 'kv_2026_3', p: 0.33, monthsAgo: 4, auditInMonths: 9 },
  { id: 'dos_fp_3', tenantId: 'lic_formapro', clientName: 'Thiès Textiles', secteur: 'Industrie', effectif: '50 à 249', ville: 'Thiès', sites: 1, responsable: 'Rokhaya Fall', assigned: [], kit: 'kv_2026_3', p: 0.2, monthsAgo: 2, auditInMonths: 12 },
  { id: 'dos_kora', tenantId: 'ent_kora', clientName: 'Kora Plastiques SA', secteur: 'Industrie', effectif: '50 à 249', ville: 'Abidjan', sites: 1, responsable: 'Fatou Ndiaye', assigned: ['usr_entreprise'], kit: 'kv_2026_3', p: 0.52, monthsAgo: 7, auditInMonths: 7 },
]

const CONSTATS = [
  'Dispositif en place, preuves datées disponibles.',
  'Approche formalisée mais revue irrégulière.',
  'Pratique existante non documentée.',
  'À compléter pour intégrer les exigences 2026.',
  'Aucune disposition identifiée lors de l’entretien.',
]

const iso = (d: Date) => formatISO(d, { representation: 'date' })

export function buildDossiers(versions: KitVersion[], users: User[]) {
  const rng = createRng(9001)
  const dossiers: Dossier[] = []
  const assessments: ClauseAssessment[] = []
  const tasks: Task[] = []
  const documents: DossierDocument[] = []
  const sessions: TrainingSession[] = []
  const nameOf = (id: string) => {
    const u = users.find((x) => x.id === id)
    return u ? `${u.firstName} ${u.lastName}` : ''
  }

  ROWS.forEach((row, index) => {
    const version = versions.find((v) => v.id === row.kit)!
    const createdAt = monthsFromNow(-row.monthsAgo)
    const target = monthsFromNow(row.auditInMonths, 10)
    const dossier: Dossier = {
      id: row.id,
      ref: `DOS-${String(41 + index).padStart(4, '0')}`,
      tenantId: row.tenantId,
      clientName: row.clientName,
      secteur: row.secteur,
      effectif: row.effectif,
      siteCount: row.sites,
      ville: row.ville,
      responsableQualite: row.responsable,
      responsableEmail: `${row.responsable.split(' ').slice(-1)[0].toLowerCase()}@${row.clientName.split(' ')[0].toLowerCase()}.com`,
      certifie2015: rng.chance(0.75),
      certificateExpiry: monthsFromNow(rng.int(10, 30)),
      assignedUserIds: row.assigned,
      kitVersionId: row.kit,
      createdAt,
      targetAuditDate: target,
      status: row.status ?? 'ACTIF',
    }
    dossiers.push(dossier)

    const team = row.assigned.map(nameOf).filter(Boolean)
    const fallback = row.tenantId.startsWith('ent_') ? row.responsable : nameOf(row.tenantId === 'lic_qualis' ? 'usr_licadmin' : 'usr_lic_formapro_admin') || row.responsable
    const people = team.length ? [...team, row.responsable] : [fallback, row.responsable]
    const evalBy = team[0] ?? fallback

    version.content.clauses.forEach((clause, ci) => {
      const evaluated = rng.next() < Math.min(1, row.p * 1.7 + 0.05)
      const applicable = !(clause.code === '8.3' && ['Services financiers', 'Logistique'].includes(row.secteur))
      let score: Score | null = null
      if (evaluated && applicable) {
        const base = row.p * 4 + (rng.next() - 0.5) * 2.2 - (clause.nouveaute2026 ? 0.8 : 0)
        score = Math.max(0, Math.min(4, Math.round(base))) as Score
      }
      assessments.push({
        id: `as_${row.id}_${ci}`,
        dossierId: row.id,
        clauseId: clause.id,
        score,
        applicable,
        constat: score === null ? '' : CONSTATS[4 - score],
        preuves: score !== null && score >= 3 ? clause.guide.slice(0, 2).join(' ; ') : '',
        evaluatedBy: score === null ? undefined : evalBy,
        evaluatedAt: score === null ? undefined : timestamp(rng.int(3, 120), rng.int(8, 17)),
      })
    })

    const span = Math.max(30, differenceInCalendarDays(parseISO(target), parseISO(createdAt)))
    const progressPhases = row.p * 6
    version.content.tasks.forEach((tpl, ti) => {
      const phaseDone = Math.max(0, Math.min(1, progressPhases - (tpl.phase - 1)))
      const done = rng.next() < phaseDone
      const inCurrent = !done && phaseDone > 0
      const due = addDays(parseISO(createdAt), Math.round((span * (tpl.phase - 0.35 + rng.next() * 0.3)) / 6))
      tasks.push({
        id: `tk_${row.id}_${ti}`,
        dossierId: row.id,
        phase: tpl.phase,
        templateId: tpl.id,
        titre: tpl.titre,
        description: tpl.description,
        responsable: rng.pick(people),
        dueDate: iso(due),
        status: done ? 'TERMINEE' : inCurrent ? (rng.chance(0.12) ? 'BLOQUEE' : rng.chance(0.6) ? 'EN_COURS' : 'A_FAIRE') : 'A_FAIRE',
        priority: tpl.phase === 6 ? 'HAUTE' : 'NORMALE',
      })
    })

    const gaps = assessments.filter((a) => a.dossierId === row.id && a.score !== null && a.score <= 1).slice(0, 3)
    gaps.forEach((gap, gi) => {
      const clause = version.content.clauses.find((c) => c.id === gap.clauseId)!
      tasks.push({
        id: `tk_${row.id}_gap_${gi}`,
        dossierId: row.id,
        phase: 4,
        templateId: null,
        titre: `Mettre en conformité § ${clause.code} — ${clause.titre}`,
        description: `Action issue de l'analyse d'écart : ${gap.constat}`,
        responsable: rng.pick(people),
        dueDate: daysFromNow(rng.int(-12, 60)),
        status: rng.chance(0.3) ? 'EN_COURS' : 'A_FAIRE',
        priority: 'HAUTE',
        sourceClauseId: clause.id,
      })
    })

    version.content.documents.forEach((tpl, di) => {
      const r = rng.next()
      const status = r < row.p * 0.85 ? 'VALIDE' : r < row.p * 1.25 ? 'EN_COURS' : 'A_CREER'
      documents.push({
        id: `doc_${row.id}_${di}`,
        dossierId: row.id,
        templateId: tpl.id,
        code: tpl.code,
        titre: tpl.titre,
        type: tpl.type,
        clauseCode: tpl.clauseCode,
        status,
        owner: rng.pick(people),
        updatedAt: timestamp(rng.int(1, 90), rng.int(8, 18)),
        fileName: status === 'A_CREER' ? undefined : `${tpl.code}_${tpl.titre.split(' ').slice(0, 3).join('_')}_v${rng.int(1, 4)}.docx`,
        validatedBy: status === 'VALIDE' ? row.responsable : undefined,
      })
    })
    if (row.p > 0.3)
      documents.push({
        id: `doc_${row.id}_own`,
        dossierId: row.id,
        templateId: null,
        code: 'INT-01',
        titre: `Instruction de travail — ${row.secteur.toLowerCase()}`,
        type: 'PROCEDURE',
        clauseCode: '8.5',
        status: 'EN_COURS',
        owner: row.responsable,
        updatedAt: timestamp(rng.int(1, 20)),
        fileName: 'IT_production_v2.docx',
      })

    version.content.trainings.forEach((path) => {
      const count = Math.round(row.p * path.modules.length * 1.1)
      for (let s = 0; s < count; s++) {
        const modules = path.modules.slice(s, s + 1 + (rng.chance(0.3) ? 1 : 0)).map((m) => m.id)
        if (!modules.length) break
        const participants = Array.from({ length: rng.int(5, 14) }, (_, k) => ({
          name: `${rng.pick(['Adjoua', 'Koffi', 'Awa', 'Yao', 'Aminata', 'Brice', 'Mariette', 'Idrissa', 'Clarisse', 'Moussa', 'Ange', 'Rokia'])} ${rng.pick(['Kouadio', 'Diabaté', 'Touré', 'Kra', 'Sangaré', 'Loukou', 'Cissé', 'Zadi', 'Kaboré'])}`,
          fonction: rng.pick(['Directeur', 'Responsable de production', 'Pilote de processus', 'Technicien', 'Agent qualité', 'Chef d’équipe']),
          present: k < 3 || rng.chance(0.9),
        }))
        sessions.push({
          id: `ts_${row.id}_${path.id}_${s}`,
          dossierId: row.id,
          pathId: path.id,
          moduleIds: modules,
          date: daysFromNow(-rng.int(5, 160)),
          dureeHeures: modules.length * rng.int(3, 7),
          lieu: rng.chance(0.7) ? `Site ${row.ville}` : 'À distance',
          formateur: row.tenantId === 'lic_qualis' ? 'Serge Kouassi' : row.tenantId === 'ent_kora' ? 'Fatou Ndiaye' : 'Awa Sarr',
          participants,
          caFacture: row.tenantId.startsWith('ent_') ? undefined : rng.int(4, 12) * 100_000,
        })
      }
    })
  })

  return { dossiers, assessments, tasks, documents, sessions }
}

export function buildDeclarations(): Declaration[] {
  const rng = createRng(33)
  const quarters = ['T4 2025', 'T1 2026', 'T2 2026']
  return quarters.map((periode, i) => ({
    id: `decl_${i}`,
    licencieId: 'lic_qualis',
    periode,
    dossiersActifs: 6 + i,
    sessions: rng.int(4, 9),
    caSessions: rng.int(38, 55) * 100_000,
    sentAt: timestamp(270 - i * 91, 11),
  }))
}
