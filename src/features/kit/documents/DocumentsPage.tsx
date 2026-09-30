import { CheckCircle2, Download, FileText, Lock, Plus, Trash2, UploadCloud } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { qk, useAppMutation, useDocuments, workspaceKeys } from '@/hooks/queries'
import { dateTime, relative } from '@/lib/format'
import { CHAPTER_TITLES, DOC_TYPE_LABELS, STATUS_META } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { documentsService } from '@/services/workspace.service'
import type { DocStatus, DocumentType, DossierDocument } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/controls'
import { Badge, Card, Skeleton } from '@/components/ui/display'
import { Dialog, DialogContent, SheetContent } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { SegmentBar } from '@/components/common/indicators'
import { FileDropzone, FilterChip, Timeline } from '@/components/common/misc'
import { DottedLeader, StatusBadge } from '@/components/common/registre'
import { matches, SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/states'
import { useDossierContext } from '../context'
import { useResponsables } from '../useResponsables'

const STATUS_COLORS: Record<DocStatus, string> = { A_CREER: 'var(--color-line-strong)', EN_COURS: 'var(--color-brand-400)', VALIDE: 'var(--color-success)' }
const ORDER: DocStatus[] = ['A_CREER', 'EN_COURS', 'VALIDE']

function StatusSelect({ value, onChange, label }: { value: DocStatus; onChange: (s: DocStatus) => void; label: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DocStatus)}
      onClick={(e) => e.stopPropagation()}
      aria-label={label}
      className={cn(
        'h-7 cursor-pointer rounded-full border px-2.5 text-[12px] font-semibold outline-none focus:ring-2 focus:ring-brand-200',
        value === 'VALIDE' ? 'border-success/30 bg-success-soft text-success' : value === 'EN_COURS' ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-line-strong bg-panel text-ink-soft',
      )}
    >
      {ORDER.map((s) => (
        <option key={s} value={s}>
          {STATUS_META[s].label}
        </option>
      ))}
    </select>
  )
}

/** D-19 */
function AddDocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { dossierId, summary } = useDossierContext()
  const people = useResponsables(summary)
  const { data: docs = [] } = useDocuments(dossierId)
  const own = docs.filter((d) => !d.templateId).length
  const [d, setD] = useState({ titre: '', type: 'PROCEDURE' as DocumentType, clauseCode: '8.5', owner: people[0] ?? '', status: 'A_CREER' as DocStatus, basedOn: '', note: '' })
  const [files, setFiles] = useState<File[]>([])
  const save = useAppMutation(
    () =>
      documentsService.save({ dossierId, templateId: null, code: `INT-${String(own + 1).padStart(2, '0')}`, titre: d.titre, type: d.type, clauseCode: d.clauseCode, status: files.length && d.status === 'A_CREER' ? 'EN_COURS' : d.status, owner: d.owner, fileName: files[0]?.name }),
    { invalidate: [qk.documents(dossierId), ...workspaceKeys(dossierId)], success: 'Document ajouté au registre', onSuccess: () => { onOpenChange(false); setFiles([]) } },
  )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title="Ajouter un document"
        description={`Référence attribuée : INT-${String(own + 1).padStart(2, '0')}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button loading={save.isPending} disabled={!d.titre.trim()} onClick={() => save.mutate(undefined)}>Ajouter</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Basé sur un document socle" optional>
            {(p) => (
              <Select
                {...p}
                value={d.basedOn}
                onChange={(e) => {
                  const tpl = summary.version.content.documents.find((x) => x.id === e.target.value)
                  setD({ ...d, basedOn: e.target.value, ...(tpl ? { titre: `${tpl.titre} — site ${summary.dossier.ville}`, type: tpl.type, clauseCode: tpl.clauseCode } : {}) })
                }}
              >
                <option value="">Non, document spécifique</option>
                {summary.version.content.documents.map((t) => (
                  <option key={t.id} value={t.id}>{t.code} · {t.titre}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Titre">{(p) => <Input {...p} value={d.titre} onChange={(e) => setD({ ...d, titre: e.target.value })} autoFocus />}</Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type">
              {(p) => (
                <Select {...p} value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as DocumentType })}>
                  {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map((t) => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Clause liée">
              {(p) => (
                <Select {...p} value={d.clauseCode} onChange={(e) => setD({ ...d, clauseCode: e.target.value })}>
                  {summary.version.content.clauses.map((c) => <option key={c.id} value={c.code}>§ {c.code}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Statut initial">
              {(p) => (
                <Select {...p} value={d.status} onChange={(e) => setD({ ...d, status: e.target.value as DocStatus })}>
                  {ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </Select>
              )}
            </Field>
          </div>
          <Field label="Propriétaire">
            {(p) => (
              <Select {...p} value={d.owner} onChange={(e) => setD({ ...d, owner: e.target.value })}>
                {people.map((n) => <option key={n}>{n}</option>)}
              </Select>
            )}
          </Field>
          <FileDropzone onFiles={setFiles} files={files} onRemove={() => setFiles([])} compact hint="Word, Excel ou PDF — 10 Mo maximum" />
          <Field label="Commentaire" optional>{(p) => <Textarea {...p} rows={2} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} />}</Field>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DocumentSheet({ doc, onOpenChange }: { doc: DossierDocument | null; onOpenChange: (o: boolean) => void }) {
  const { dossierId, summary } = useDossierContext()
  const invalidate = [qk.documents(dossierId), ...workspaceKeys(dossierId)]
  const validate = useAppMutation(() => documentsService.save({ ...doc!, status: 'VALIDE' }), { invalidate, success: 'Document validé', onSuccess: () => onOpenChange(false) })
  const remove = useAppMutation(() => documentsService.remove(doc!.id), { invalidate, success: 'Document retiré', onSuccess: () => onOpenChange(false) })
  if (!doc) return null
  const clause = summary.version.content.clauses.find((c) => c.code === doc.clauseCode)
  return (
    <Dialog open={!!doc} onOpenChange={onOpenChange}>
      <SheetContent
        title={doc.titre}
        description={<span className="inline-flex items-center gap-2"><span className="font-mono">{doc.code}</span>{doc.templateId && <span className="inline-flex items-center gap-1"><Lock className="size-3" /> Document socle</span>}</span>}
        footer={
          <>
            {!doc.templateId && (
              <Button variant="ghost" className="mr-auto text-danger" loading={remove.isPending} onClick={() => remove.mutate(undefined)}>
                <Trash2 /> Retirer
              </Button>
            )}
            {doc.status !== 'VALIDE' && (
              <Button loading={validate.isPending} onClick={() => validate.mutate(undefined)}>
                <CheckCircle2 /> Marquer comme validé
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <DottedLeader label="Statut" value={<StatusBadge status={doc.status} />} />
            <DottedLeader label="Type" value={DOC_TYPE_LABELS[doc.type]} />
            <DottedLeader label="Clause" value={<span>§ {doc.clauseCode} {clause?.titre}</span>} />
            <DottedLeader label="Propriétaire" value={doc.owner} />
            {doc.validatedBy && <DottedLeader label="Validé par" value={doc.validatedBy} />}
            <DottedLeader label="Mis à jour" value={dateTime(doc.updatedAt)} />
          </div>
          <section>
            <h3 className="mb-2 text-[13.5px] font-bold">Fichier</h3>
            {doc.fileName ? (
              <div className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5">
                <FileText className="size-5 text-brand-600" />
                <span className="min-w-0 flex-1 truncate text-[13px]">{doc.fileName}</span>
                <Button variant="ghost" size="icon-sm" aria-label="Télécharger" onClick={() => toast.info('Téléchargement simulé (démo)')}>
                  <Download />
                </Button>
              </div>
            ) : (
              <FileDropzone compact onFiles={(fs) => fs[0] && documentsService.save({ ...doc, fileName: fs[0].name, status: doc.status === 'A_CREER' ? 'EN_COURS' : doc.status }).then(() => { toast.success('Fichier ajouté'); onOpenChange(false) })} />
            )}
          </section>
          <section>
            <h3 className="mb-2 text-[13.5px] font-bold">Historique</h3>
            <Timeline
              compact
              items={[
                ...(doc.status === 'VALIDE' ? [{ at: doc.updatedAt, label: 'Version validée', actor: doc.validatedBy ?? doc.owner, kind: 'document' as const }] : []),
                ...(doc.fileName ? [{ at: new Date(new Date(doc.updatedAt).getTime() - 5 * 86_400_000).toISOString(), label: `Fichier ${doc.fileName} déposé`, actor: doc.owner, kind: 'document' as const }] : []),
                { at: summary.dossier.createdAt, label: doc.templateId ? 'Ajouté depuis le socle' : 'Document créé', actor: doc.templateId ? 'StandSet' : doc.owner, kind: 'create' as const },
              ]}
            />
          </section>
        </div>
      </SheetContent>
    </Dialog>
  )
}

export function DocumentsPage() {
  const { dossierId } = useDossierContext()
  const { data: docs, isLoading } = useDocuments(dossierId)
  const qc = useQueryClient()
  const [group, setGroup] = useState<'status' | 'chapter'>('status')
  const [origin, setOrigin] = useState<'' | 'socle' | 'own'>('')
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<DossierDocument | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const rows = useMemo(() => (docs ?? []).filter((d) => (!origin || (origin === 'socle' ? !!d.templateId : !d.templateId)) && matches(query, d.code, d.titre, d.owner)), [docs, origin, query])
  const counts = ORDER.map((s) => (docs ?? []).filter((d) => d.status === s).length)

  const update = async (d: DossierDocument, patch: Partial<DossierDocument>) => {
    qc.setQueryData<DossierDocument[]>(qk.documents(dossierId), (old) => old?.map((x) => (x.id === d.id ? { ...x, ...patch } : x)))
    await documentsService.save({ ...d, ...patch })
    for (const k of workspaceKeys(dossierId)) qc.invalidateQueries({ queryKey: k })
    if (patch.status === 'VALIDE') toast.success(`${d.titre} validé`)
  }

  if (isLoading || !docs) return <Skeleton className="h-96 w-full rounded-lg" />
  const groups =
    group === 'status'
      ? ORDER.slice()
          .reverse()
          .map((s) => ({ key: s, title: STATUS_META[s].label, items: rows.filter((d) => d.status === s) }))
      : [...new Set(rows.map((d) => Number(d.clauseCode.split('.')[0])))].sort((a, b) => a - b).map((ch) => ({ key: String(ch), title: `§ ${ch} — ${CHAPTER_TITLES[ch]}`, items: rows.filter((d) => d.clauseCode.startsWith(`${ch}.`)) }))

  return (
    <div>
      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-muted">Registre documentaire</p>
            <p className="font-mono text-[26px] text-ink tabular">
              {counts[2]}
              <span className="text-[16px] text-muted">/{docs.length} validés</span>
            </p>
          </div>
          <div className="flex gap-5 text-[13px]">
            {ORDER.map((s, i) => (
              <span key={s} className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: STATUS_COLORS[s] }} />
                {STATUS_META[s].label} <span className="font-mono text-ink">{counts[i]}</span>
              </span>
            ))}
          </div>
        </div>
        <SegmentBar className="mt-4" parts={ORDER.map((s, i) => ({ label: STATUS_META[s].label, value: counts[i], color: STATUS_COLORS[s] }))} />
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Code, titre, propriétaire…" className="w-full sm:w-64" />
        <FilterChip active={origin === 'socle'} onClick={() => setOrigin(origin === 'socle' ? '' : 'socle')}>
          <Lock className="size-3.5" /> Socle
        </FilterChip>
        <FilterChip active={origin === 'own'} onClick={() => setOrigin(origin === 'own' ? '' : 'own')}>
          Ajouts du dossier
        </FilterChip>
        <Segmented
          className="ml-auto"
          label="Regrouper par"
          size="sm"
          value={group}
          onChange={setGroup}
          options={[
            { value: 'status', label: 'Par statut' },
            { value: 'chapter', label: 'Par chapitre' },
          ]}
        />
        <Button onClick={() => setAdding(true)}>
          <Plus /> Ajouter un document
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Aucun document" description="Aucun document ne correspond à la recherche." />
      ) : (
        <div className="flex flex-col gap-5">
          {groups
            .filter((g) => g.items.length)
            .map((g) => (
              <section key={g.key}>
                <h3 className="mb-2 flex items-center gap-2 text-[13.5px] font-bold text-ink">
                  {g.title} <span className="font-mono text-[12px] font-normal text-muted">{g.items.length}</span>
                </h3>
                <ul className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
                  {g.items.map((d) => (
                    <li
                      key={d.id}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDropTarget(d.id)
                      }}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDropTarget(null)
                        const f = e.dataTransfer.files[0]
                        if (f) void update(d, { fileName: f.name, status: d.status === 'A_CREER' ? 'EN_COURS' : d.status }).then(() => toast.success(`${f.name} déposé sur ${d.code}`))
                      }}
                      className={cn('flex cursor-pointer items-center gap-4 border-b border-line px-4 py-3 transition-colors last:border-0 hover:bg-brand-50/40', dropTarget === d.id && 'bg-brand-50 ring-2 ring-brand-300 ring-inset')}
                      onClick={() => setOpen(d)}
                    >
                      <span className="w-16 shrink-0 font-mono text-[12.5px] text-brand-700">{d.code}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-semibold text-ink">{d.titre}</span>
                          {d.templateId ? <Lock className="size-3 shrink-0 text-subtle" aria-label="Document socle" /> : <Badge tone="brand">Ajout</Badge>}
                        </span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                          {DOC_TYPE_LABELS[d.type]} · § {d.clauseCode} · {d.owner} · mis à jour {relative(d.updatedAt)}
                        </span>
                      </span>
                      {dropTarget === d.id ? (
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-brand-700"><UploadCloud className="size-4" /> Déposer</span>
                      ) : d.fileName ? (
                        <FileText className="hidden size-4 text-muted sm:block" aria-label={d.fileName} />
                      ) : null}
                      <StatusSelect value={d.status} onChange={(s) => update(d, { status: s })} label={`Statut de ${d.titre}`} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
      <p className="mt-4 text-center text-[12.5px] text-muted">Astuce : glissez un fichier directement sur une ligne pour le déposer.</p>
      <AddDocumentDialog open={adding} onOpenChange={setAdding} />
      <DocumentSheet doc={open} onOpenChange={(o) => !o && setOpen(null)} />
    </div>
  )
}
