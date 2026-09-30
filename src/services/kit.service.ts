import { ApiError, db, delay, persist } from '@/mocks/db'
import type { Clause, DocumentTemplate, KitVersion, TaskTemplate, TrainingPath } from '@/types/domain'
import { diffSocle } from '@/lib/calculations/diff'
import { currentUser, fullName, requireRole } from './scope'

type SocleSection = 'clauses' | 'tasks' | 'documents' | 'trainings'
type SocleItem = Clause | TaskTemplate | DocumentTemplate | TrainingPath

function latestPublished() {
  return [...db.kitVersions].filter((v) => v.status === 'PUBLIEE').sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))[0]
}

function draftOrThrow(id: string) {
  const v = db.kitVersions.find((x) => x.id === id)
  if (!v) throw new ApiError(404, 'Version introuvable')
  if (v.status !== 'BROUILLON') throw new ApiError(400, 'Seul un brouillon est modifiable.')
  return v
}

export const kitService = {
  async list(): Promise<KitVersion[]> {
    currentUser()
    return delay([...db.kitVersions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },

  async get(id: string): Promise<KitVersion> {
    currentUser()
    const v = db.kitVersions.find((x) => x.id === id)
    if (!v) throw new ApiError(404, 'Version introuvable')
    return delay(v)
  },

  latest(): KitVersion {
    return structuredClone(latestPublished())
  },

  versionSync(id: string): KitVersion | undefined {
    return db.kitVersions.find((v) => v.id === id)
  },

  async createDraft(): Promise<KitVersion> {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const existing = db.kitVersions.find((v) => v.status === 'BROUILLON')
    if (existing) return delay(existing)
    const base = latestPublished()
    const [year, minor] = base.number.split('.').map(Number)
    const draft: KitVersion = {
      id: `kv_draft_${Date.now()}`,
      number: `${year}.${minor + 1}`,
      status: 'BROUILLON',
      createdAt: new Date().toISOString(),
      changelog: '',
      content: structuredClone(base.content),
    }
    db.kitVersions.push(draft)
    persist()
    return delay(draft)
  },

  async saveItem(versionId: string, section: SocleSection, item: SocleItem) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const v = draftOrThrow(versionId)
    const list = v.content[section] as SocleItem[]
    const idx = list.findIndex((x) => x.id === item.id)
    if (idx >= 0) list[idx] = item
    else list.push(item)
    persist()
    return delay(item)
  },

  async removeItem(versionId: string, section: SocleSection, itemId: string) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const v = draftOrThrow(versionId)
    ;(v.content[section] as SocleItem[]) = (v.content[section] as SocleItem[]).filter((x) => x.id !== itemId)
    persist()
    return delay(itemId)
  },

  async publish(versionId: string, number: string, changelog: string) {
    const admin = requireRole('ADMIN_CONCESSIONNAIRE')
    const v = draftOrThrow(versionId)
    if (!/^\d{4}\.\d+$/.test(number)) throw new ApiError(400, 'Format attendu : AAAA.N (ex. 2026.4)')
    if (db.kitVersions.some((x) => x.number === number && x.id !== versionId)) throw new ApiError(400, 'Ce numéro existe déjà.')
    v.number = number
    v.changelog = changelog
    v.status = 'PUBLIEE'
    v.publishedAt = new Date().toISOString()
    v.publishedBy = fullName(admin)
    const recipients = db.users.filter((u) => u.role !== 'ADMIN_CONCESSIONNAIRE')
    for (const u of recipients)
      db.notifications.unshift({ id: `n_${Date.now()}_${u.id}`, userId: u.id, type: 'KIT_VERSION', title: `Nouvelle version du socle : ${number}`, body: changelog.slice(0, 120), createdAt: v.publishedAt, link: u.role === 'ENTREPRISE' ? '/espace/dossier/vue-ensemble' : '/app/dossiers' })
    db.accessLogs.unshift({ id: `log_${Date.now()}`, userName: fullName(admin), role: admin.role, action: `Publication de la version ${number}`, sensitive: true, ip: '41.207.12.84', device: 'Navigateur', at: v.publishedAt })
    persist()
    return delay(v, 600, 900)
  },

  async archive(versionId: string) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const v = db.kitVersions.find((x) => x.id === versionId)!
    v.status = 'ARCHIVEE'
    persist()
    return delay(v)
  },

  async discardDraft(versionId: string) {
    requireRole('ADMIN_CONCESSIONNAIRE')
    draftOrThrow(versionId)
    db.kitVersions = db.kitVersions.filter((v) => v.id !== versionId)
    persist()
    return delay(versionId)
  },

  diff(aId: string, bId: string) {
    const a = db.kitVersions.find((v) => v.id === aId)
    const b = db.kitVersions.find((v) => v.id === bId)
    if (!a || !b) return null
    return diffSocle(a.content, b.content)
  },

  /** Aggregated adoption: counts only, no dossier content. */
  async adoption() {
    requireRole('ADMIN_CONCESSIONNAIRE')
    const byVersion = new Map<string, number>()
    for (const l of db.licencies) {
      if (l.status === 'EN_ATTENTE') continue
      const onLatest = Math.round((l.indicators.dossiersActifs * l.indicators.pctDerniereVersion) / 100)
      byVersion.set('kv_2026_3', (byVersion.get('kv_2026_3') ?? 0) + onLatest)
      byVersion.set('kv_2026_2', (byVersion.get('kv_2026_2') ?? 0) + l.indicators.dossiersActifs - onLatest)
    }
    const ents = db.enterprises.filter((e) => e.subscriptionStatus !== 'RESILIE').length
    byVersion.set('kv_2026_3', (byVersion.get('kv_2026_3') ?? 0) + Math.round(ents * 0.85))
    byVersion.set('kv_2026_2', (byVersion.get('kv_2026_2') ?? 0) + Math.round(ents * 0.15))
    return delay({
      byVersion: Object.fromEntries(byVersion),
      tenants: db.licencies.filter((l) => l.status !== 'EN_ATTENTE').length,
      enterprises: ents,
      dossiers: [...byVersion.values()].reduce((a, b) => a + b, 0),
    })
  },
}
