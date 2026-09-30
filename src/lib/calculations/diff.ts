import type { SocleContent } from '@/types/domain'

export type ChangeKind = 'added' | 'removed' | 'modified'

export interface ItemChange {
  id: string
  label: string
  kind: ChangeKind
  before?: string
  after?: string
}

export interface SocleDiff {
  clauses: ItemChange[]
  tasks: ItemChange[]
  documents: ItemChange[]
  trainings: ItemChange[]
  total: number
}

function diffList<T extends { id: string }>(a: T[], b: T[], label: (x: T) => string, text: (x: T) => string): ItemChange[] {
  const before = new Map(a.map((x) => [x.id, x]))
  const after = new Map(b.map((x) => [x.id, x]))
  const changes: ItemChange[] = []
  for (const [id, x] of after) {
    const old = before.get(id)
    if (!old) changes.push({ id, label: label(x), kind: 'added', after: text(x) })
    else if (text(old) !== text(x)) changes.push({ id, label: label(x), kind: 'modified', before: text(old), after: text(x) })
  }
  for (const [id, x] of before) if (!after.has(id)) changes.push({ id, label: label(x), kind: 'removed', before: text(x) })
  return changes
}

export function diffSocle(a: SocleContent, b: SocleContent): SocleDiff {
  const clauses = diffList(a.clauses, b.clauses, (c) => `§ ${c.code} ${c.titre}`, (c) => `${c.titre}\n${c.exigence}\nPoids ${c.poids}`)
  const tasks = diffList(a.tasks, b.tasks, (t) => `Phase ${t.phase} · ${t.titre}`, (t) => `${t.titre}\n${t.description}`)
  const documents = diffList(a.documents, b.documents, (d) => `${d.code} ${d.titre}`, (d) => `${d.titre} (${d.type}, § ${d.clauseCode})`)
  const trainings = diffList(a.trainings, b.trainings, (t) => t.nom, (t) => `${t.nom}\n${t.modules.map((m) => m.titre).join(', ')}`)
  return { clauses, tasks, documents, trainings, total: clauses.length + tasks.length + documents.length + trainings.length }
}

/** Word-level diff for inline display. */
export function wordDiff(before: string, after: string) {
  const a = before.split(/(\s+)/)
  const b = after.split(/(\s+)/)
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const out: { text: string; kind: 'same' | 'add' | 'del' }[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ text: a[i], kind: 'same' })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ text: a[i++], kind: 'del' })
    else out.push({ text: b[j++], kind: 'add' })
  }
  while (i < a.length) out.push({ text: a[i++], kind: 'del' })
  while (j < b.length) out.push({ text: b[j++], kind: 'add' })
  return out
}
