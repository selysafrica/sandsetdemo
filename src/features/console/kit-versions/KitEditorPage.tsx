import { BookOpen, FileText, GitCompare, GraduationCap, Lock, Plus, Radio, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { qk, useAppMutation, useKitVersion, useKitVersions } from '@/hooks/queries'
import { diffSocle } from '@/lib/calculations/diff'
import { dateTime } from '@/lib/format'
import { CHAPTER_TITLES, DOC_TYPE_LABELS } from '@/lib/labels'
import { cn, uid } from '@/lib/utils'
import { kitService } from '@/services/kit.service'
import type { Clause, DocumentTemplate, TaskTemplate, TrainingPath } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/controls'
import { Badge, Card } from '@/components/ui/display'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { PHASE_TITLES } from '@/components/common/PhaseRail'
import { StatusBadge } from '@/components/common/registre'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { ClauseSheet, CompareSheet, DocumentTemplateDialog, PublishDialog, TaskTemplateSheet, TrainingPathSheet } from './dialogs'

function ChangeDot({ kind }: { kind?: 'added' | 'modified' | 'removed' }) {
  if (!kind) return null
  return <Badge tone={kind === 'added' ? 'success' : 'warning'}>{kind === 'added' ? 'nouveau' : 'modifié'}</Badge>
}

export function KitEditorPage() {
  const { versionId = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data: v, isLoading, error } = useKitVersion(versionId)
  const { data: versions = [] } = useKitVersions()
  const [chapter, setChapter] = useState(4)
  const [clause, setClause] = useState<Clause | null>(null)
  const [task, setTask] = useState<TaskTemplate | null>(null)
  const [doc, setDoc] = useState<DocumentTemplate | null>(null)
  const [training, setTraining] = useState<TrainingPath | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const removeMut = useAppMutation(({ section, id }: { section: 'clauses' | 'tasks' | 'documents'; id: string }) => kitService.removeItem(versionId, section, id), { invalidate: [qk.kitVersion(versionId)], success: 'Élément retiré du brouillon' })
  const discard = useAppMutation(() => kitService.discardDraft(versionId), { invalidate: [qk.kitVersions], success: 'Brouillon supprimé', onSuccess: () => navigate('/console/kit') })

  useEffect(() => {
    if (params.get('publier')) {
      setPublishOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const base = useMemo(() => versions.filter((x) => x.status !== 'BROUILLON' && x.id !== versionId && (!v || x.createdAt < v.createdAt)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0], [versions, v, versionId])
  const diff = useMemo(() => (v && base ? diffSocle(base.content, v.content) : null), [v, base])
  const kindOf = (list: { id: string; kind: 'added' | 'modified' | 'removed' }[] | undefined, id: string) => list?.find((c) => c.id === id)?.kind

  if (isLoading) return <PageSkeleton />
  if (error || !v) return <ErrorState error={error} />
  const readOnly = v.status !== 'BROUILLON'
  const chapters = [...new Set(v.content.clauses.map((c) => c.chapitre))].sort((a, b) => a - b)
  const previousClause = (id: string) => base?.content.clauses.find((c) => c.id === id)

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Console', to: '/console' },
          { label: 'Kit & versions', to: '/console/kit' },
          { label: v.number },
        ]}
        title={
          <span className="flex items-center gap-3">
            Socle <span className="font-mono">{v.number}</span>
          </span>
        }
        meta={
          <>
            <StatusBadge status={v.status} />
            {readOnly ? (
              <span className="inline-flex items-center gap-1 text-[12.5px] text-muted">
                <Lock className="size-3.5" /> Version publiée : lecture seule
              </span>
            ) : (
              <span className="text-[12.5px] text-muted">Brouillon · enregistrement automatique · créé le {dateTime(v.createdAt)}</span>
            )}
            {diff && diff.total > 0 && <Badge tone="brand">{diff.total} changements depuis {base?.number}</Badge>}
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setCompareOpen(true)}>
              <GitCompare /> Comparer avec…
            </Button>
            {!readOnly && (
              <>
                <Button variant="ghost" onClick={() => setDiscardOpen(true)}>
                  <Trash2 /> Supprimer le brouillon
                </Button>
                <Button onClick={() => setPublishOpen(true)}>
                  <Radio /> Publier
                </Button>
              </>
            )}
          </>
        }
      />

      {!readOnly && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-[13.5px] text-ink">
          <Sparkles className="size-4 shrink-0 text-warning" />
          Vous modifiez un brouillon. Rien n'est visible des tenants avant la publication.
        </div>
      )}

      <TabsRoot defaultValue="clauses">
        <TabsList className="mb-6">
          <TabsTrigger value="clauses" count={v.content.clauses.length}>
            Grille d'analyse d'écart
          </TabsTrigger>
          <TabsTrigger value="phases" count={v.content.tasks.length}>
            Phases & tâches types
          </TabsTrigger>
          <TabsTrigger value="documents" count={v.content.documents.length}>
            Registre documentaire
          </TabsTrigger>
          <TabsTrigger value="trainings" count={v.content.trainings.length}>
            Parcours de formation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clauses" className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <nav aria-label="Chapitres" className="lg:sticky lg:top-20 lg:self-start">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col">
              {chapters.map((ch) => (
                <li key={ch}>
                  <button
                    type="button"
                    onClick={() => setChapter(ch)}
                    aria-current={chapter === ch}
                    className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13.5px] whitespace-nowrap transition-colors', chapter === ch ? 'bg-accent-soft font-semibold text-accent' : 'text-ink-soft hover:bg-panel')}
                  >
                    <span className="font-mono text-[12px]">§ {ch}</span>
                    <span className="truncate">{CHAPTER_TITLES[ch]}</span>
                    <span className="ml-auto font-mono text-[11.5px] text-muted">{v.content.clauses.filter((c) => c.chapitre === ch).length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <Card>
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-bold">
                § {chapter} — {CHAPTER_TITLES[chapter]}
              </h2>
              {!readOnly && (
                <Button size="sm" variant="outline" onClick={() => setClause({ id: uid('cl'), code: `${chapter}.`, chapitre: chapter, titre: '', exigence: '', guide: [''], poids: 1, nouveaute2026: false })}>
                  <Plus /> Ajouter une clause
                </Button>
              )}
            </div>
            <ul className="divide-y divide-line">
              {v.content.clauses
                .filter((c) => c.chapitre === chapter)
                .map((c) => (
                  <li key={c.id} className="group flex items-center gap-4 px-5 py-3 hover:bg-canvas">
                    <button type="button" onClick={() => setClause(c)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                      <span className="w-14 shrink-0 font-mono text-[13px] text-brand-700">§ {c.code}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{c.titre}</span>
                        <span className="block truncate text-[12.5px] text-muted">{c.exigence}</span>
                      </span>
                      {c.nouveaute2026 && <Badge tone="violet">Nouveauté 2026</Badge>}
                      <ChangeDot kind={kindOf(diff?.clauses, c.id)} />
                      <span className="w-14 text-right font-mono text-[12px] text-muted">poids {c.poids}</span>
                    </button>
                    {!readOnly && (
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={`Retirer § ${c.code}`} onClick={() => removeMut.mutate({ section: 'clauses', id: c.id })}>
                        <Trash2 />
                      </Button>
                    )}
                  </li>
                ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="phases">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PHASE_TITLES.map((title, i) => {
              const tasks = v.content.tasks.filter((t) => t.phase === i + 1)
              return (
                <Card key={title} className="flex flex-col">
                  <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                    <span className="grid size-8 place-items-center rounded-full bg-brand-50 font-mono text-[13px] text-brand-700">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">{title}</h3>
                      <p className="text-[12px] text-muted">{tasks.length} tâches types</p>
                    </div>
                  </div>
                  <ol className="flex-1 divide-y divide-line">
                    {tasks.map((t) => (
                      <li key={t.id}>
                        <button type="button" onClick={() => setTask(t)} className="flex w-full items-start gap-2 px-4 py-2.5 text-left hover:bg-canvas">
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13.5px] text-ink">{t.titre}</span>
                            <span className="block text-[12px] text-muted">{t.dureeJours} j indicatifs</span>
                          </span>
                          <ChangeDot kind={kindOf(diff?.tasks, t.id)} />
                        </button>
                      </li>
                    ))}
                  </ol>
                  {!readOnly && (
                    <div className="border-t border-line p-2">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setTask({ id: uid('tt'), phase: i + 1, titre: '', description: '', dureeJours: 3 })}>
                        <Plus /> Ajouter une tâche
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="flex items-center gap-2 font-bold">
                <FileText className="size-4 text-brand-600" /> Documents socle
              </h2>
              {!readOnly && (
                <Button size="sm" variant="outline" onClick={() => setDoc({ id: uid('dt'), code: `DOC-${v.content.documents.length + 1}`, titre: '', type: 'PROCEDURE', clauseCode: '4.1', obligatoire: false })}>
                  <Plus /> Ajouter un document
                </Button>
              )}
            </div>
            <table className="w-full text-left text-[13.5px]">
              <caption className="sr-only">Documents socle</caption>
              <thead className="bg-canvas text-[12px] text-muted">
                <tr>
                  <th className="px-5 py-2 font-semibold">Code</th>
                  <th className="px-5 py-2 font-semibold">Titre</th>
                  <th className="hidden px-5 py-2 font-semibold md:table-cell">Type</th>
                  <th className="hidden px-5 py-2 font-semibold md:table-cell">Clause</th>
                  <th className="px-5 py-2 font-semibold">Exigé</th>
                </tr>
              </thead>
              <tbody>
                {v.content.documents.map((d) => (
                  <tr key={d.id} onClick={() => setDoc(d)} className="cursor-pointer border-t border-line hover:bg-canvas">
                    <td className="px-5 py-2.5 font-mono text-[12.5px] text-brand-700">{d.code}</td>
                    <td className="px-5 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        {d.titre} <ChangeDot kind={kindOf(diff?.documents, d.id)} />
                      </span>
                    </td>
                    <td className="hidden px-5 py-2.5 md:table-cell">{DOC_TYPE_LABELS[d.type]}</td>
                    <td className="hidden px-5 py-2.5 font-mono text-[12.5px] md:table-cell">§ {d.clauseCode}</td>
                    <td className="px-5 py-2.5">{d.obligatoire ? <Badge tone="brand">Oui</Badge> : <span className="text-muted">Non</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="trainings">
          <div className="grid gap-4 lg:grid-cols-3">
            {v.content.trainings.map((t, i) => (
              <Card key={t.id} className="flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-700">{i === 2 ? <BookOpen className="size-5" /> : <GraduationCap className="size-5" />}</span>
                  <div>
                    <p className="text-[12px] font-semibold text-muted">Parcours {i + 1}</p>
                    <h3 className="font-bold leading-tight">{t.nom}</h3>
                  </div>
                </div>
                <p className="mt-2 text-[12.5px] text-muted">{t.publicCible}</p>
                <ol className="mt-4 flex-1 divide-y divide-line border-y border-line">
                  {t.modules.map((m, k) => (
                    <li key={m.id} className="flex items-center gap-3 py-2 text-[13px]">
                      <span className="font-mono text-[11.5px] text-muted">{k + 1}</span>
                      <span className="flex-1">{m.titre}</span>
                      <span className="font-mono text-[12px] text-muted">{m.dureeHeures} h</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[13px] text-ink">{t.modules.reduce((a, m) => a + m.dureeHeures, 0)} h au total</span>
                  <Button size="sm" variant="outline" onClick={() => setTraining(t)}>
                    {readOnly ? 'Détail' : 'Modifier'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </TabsRoot>

      <ClauseSheet open={!!clause} onOpenChange={(o) => !o && setClause(null)} item={clause} versionId={v.id} readOnly={readOnly} previous={clause ? previousClause(clause.id) : undefined} documents={v.content.documents} />
      <TaskTemplateSheet open={!!task} onOpenChange={(o) => !o && setTask(null)} item={task} versionId={v.id} readOnly={readOnly} />
      <DocumentTemplateDialog open={!!doc} onOpenChange={(o) => !o && setDoc(null)} item={doc} versionId={v.id} readOnly={readOnly} clauses={v.content.clauses} />
      <TrainingPathSheet open={!!training} onOpenChange={(o) => !o && setTraining(null)} item={training} versionId={v.id} readOnly={readOnly} />
      {base && (publishOpen || !readOnly) && <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} draft={v} base={base} />}
      <CompareSheet open={compareOpen} onOpenChange={setCompareOpen} initialA={base?.id} initialB={v.id} />
      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen} title="Supprimer ce brouillon ?" impact="Toutes les modifications du brouillon seront perdues. Les versions publiées ne sont pas affectées." confirmLabel="Supprimer le brouillon" destructive loading={discard.isPending} onConfirm={() => discard.mutate(undefined)} />
    </>
  )
}
