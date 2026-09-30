import { CheckCircle2, ChevronDown, ChevronUp, Plus, Radio, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { qk, useAppMutation, useKitVersions, useLicencies } from '@/hooks/queries'
import { SCORE_LABELS } from '@/lib/calculations/coverage'
import { diffSocle, wordDiff, type ItemChange } from '@/lib/calculations/diff'
import { CHAPTER_TITLES, DOC_TYPE_LABELS } from '@/lib/labels'
import { cn, uid } from '@/lib/utils'
import { kitService } from '@/services/kit.service'
import type { Clause, DocumentTemplate, DocumentType, KitVersion, TaskTemplate, TrainingPath } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { CheckRow, Stepper, Switch, TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/controls'
import { Badge } from '@/components/ui/display'
import { Dialog, DialogContent, SheetContent } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { PHASE_TITLES } from '@/components/common/PhaseRail'

const KIND_META = { added: { label: 'Ajouté', tone: 'success' }, removed: { label: 'Supprimé', tone: 'danger' }, modified: { label: 'Modifié', tone: 'warning' } } as const

export function DiffText({ before = '', after = '' }: { before?: string; after?: string }) {
  return (
    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
      {wordDiff(before, after).map((p, i) => (
        <span key={i} className={cn(p.kind === 'add' && 'rounded-sm bg-success-soft text-success', p.kind === 'del' && 'rounded-sm bg-danger-soft text-danger line-through')}>
          {p.text}
        </span>
      ))}
    </p>
  )
}

function ChangeRows({ items }: { items: ItemChange[] }) {
  if (!items.length) return <p className="py-6 text-center text-[13px] text-muted">Aucune différence dans cette section.</p>
  return (
    <ul className="divide-y divide-line rounded-md border border-line">
      {items.map((c) => (
        <li key={c.id} className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Badge tone={KIND_META[c.kind].tone}>{KIND_META[c.kind].label}</Badge>
            <span className="text-[13.5px] font-semibold text-ink">{c.label}</span>
          </div>
          {c.kind === 'modified' && (
            <div className="mt-2 rounded-md bg-canvas p-3">
              <DiffText before={c.before} after={c.after} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

/** D-12 */
export function CompareSheet({ open, onOpenChange, initialA, initialB }: { open: boolean; onOpenChange: (o: boolean) => void; initialA?: string; initialB?: string }) {
  const { data: versions = [] } = useKitVersions()
  const [a, setA] = useState(initialA ?? '')
  const [b, setB] = useState(initialB ?? '')
  useEffect(() => {
    if (open) {
      setA(initialA ?? versions[1]?.id ?? '')
      setB(initialB ?? versions[0]?.id ?? '')
    }
  }, [open, initialA, initialB, versions])
  const va = versions.find((v) => v.id === a)
  const vb = versions.find((v) => v.id === b)
  const diff = useMemo(() => (va && vb ? diffSocle(va.content, vb.content) : null), [va, vb])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent width="full" title="Comparer deux versions du socle" description="Différences clause par clause, tâche par tâche.">
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <Field label="Version de référence" className="w-52">
            {(p) => (
              <Select {...p} value={a} onChange={(e) => setA(e.target.value)}>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.number} · {v.status === 'BROUILLON' ? 'brouillon' : v.status === 'ARCHIVEE' ? 'archivée' : 'publiée'}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <span className="pb-2 text-muted">→</span>
          <Field label="Version comparée" className="w-52">
            {(p) => (
              <Select {...p} value={b} onChange={(e) => setB(e.target.value)}>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.number} · {v.status === 'BROUILLON' ? 'brouillon' : v.status === 'ARCHIVEE' ? 'archivée' : 'publiée'}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {diff && (
            <p className="pb-2 text-[13px] text-muted">
              <strong className="font-mono text-ink">{diff.total}</strong> différences
            </p>
          )}
        </div>
        {diff && (
          <TabsRoot defaultValue="clauses">
            <TabsList className="mb-4">
              <TabsTrigger value="clauses" count={diff.clauses.length}>Clauses</TabsTrigger>
              <TabsTrigger value="tasks" count={diff.tasks.length}>Phases & tâches</TabsTrigger>
              <TabsTrigger value="documents" count={diff.documents.length}>Documents</TabsTrigger>
              <TabsTrigger value="trainings" count={diff.trainings.length}>Formations</TabsTrigger>
            </TabsList>
            <TabsContent value="clauses"><ChangeRows items={diff.clauses} /></TabsContent>
            <TabsContent value="tasks"><ChangeRows items={diff.tasks} /></TabsContent>
            <TabsContent value="documents"><ChangeRows items={diff.documents} /></TabsContent>
            <TabsContent value="trainings"><ChangeRows items={diff.trainings} /></TabsContent>
          </TabsRoot>
        )}
      </SheetContent>
    </Dialog>
  )
}

/** D-07 */
export function PublishDialog({ open, onOpenChange, draft, base }: { open: boolean; onOpenChange: (o: boolean) => void; draft: KitVersion; base: KitVersion }) {
  const { data: licencies = [] } = useLicencies()
  const [step, setStep] = useState(0)
  const [number, setNumber] = useState(draft.number)
  const [changelog, setChangelog] = useState(draft.changelog)
  const [ack, setAck] = useState(false)
  const [broadcast, setBroadcast] = useState<number | null>(null)
  const diff = useMemo(() => diffSocle(base.content, draft.content), [base, draft])
  const tenants = licencies.filter((l) => l.status !== 'EN_ATTENTE')
  const dossiers = tenants.reduce((a, l) => a + l.indicators.dossiersActifs, 0)
  useEffect(() => {
    if (open) {
      setStep(0)
      setNumber(draft.number)
      setChangelog(draft.changelog || `Évolutions du socle depuis la version ${base.number}.`)
      setAck(false)
      setBroadcast(null)
    }
  }, [open, draft, base])
  const publish = useAppMutation(() => kitService.publish(draft.id, number, changelog), {
    invalidate: [qk.kitVersions, qk.kitVersion(draft.id), qk.adoption, qk.accessLogs],
    onSuccess: () => {
      setStep(3)
      let n = 0
      const id = window.setInterval(() => {
        n++
        setBroadcast(n)
        if (n >= tenants.length) window.clearInterval(id)
      }, 90)
    },
  })
  const counts = [
    ['Clauses', diff.clauses],
    ['Tâches types', diff.tasks],
    ['Documents', diff.documents],
    ['Parcours', diff.trainings],
  ] as const
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={step === 3 ? `Version ${number} publiée` : 'Publier une version du Kit'}
        footer={
          step === 3 ? (
            <Button onClick={() => onOpenChange(false)}>Terminer</Button>
          ) : (
            <>
              {step > 0 && (
                <Button variant="ghost" className="mr-auto" onClick={() => setStep(step - 1)}>
                  Retour
                </Button>
              )}
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              {step < 2 ? (
                <Button onClick={() => setStep(step + 1)} disabled={step === 0 && !/^\d{4}\.\d+$/.test(number)}>
                  Continuer
                </Button>
              ) : (
                <Button disabled={!ack} loading={publish.isPending} onClick={() => publish.mutate(undefined)}>
                  <Radio /> Publier et notifier
                </Button>
              )}
            </>
          )
        }
      >
        {step < 3 && <Stepper steps={['Version', 'Notes', 'Impact']} current={step} className="mb-6" />}
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <Field label="Numéro de version" hint="Format AAAA.N" error={/^\d{4}\.\d+$/.test(number) ? undefined : 'Format attendu : 2026.4'}>
              {(p) => <Input {...p} value={number} onChange={(e) => setNumber(e.target.value)} className="w-40 font-mono" />}
            </Field>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink-soft">Changements détectés depuis {base.number}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {counts.map(([label, items]) => (
                  <div key={label} className="rounded-md border border-line px-3 py-2.5">
                    <p className="font-mono text-[20px] text-ink tabular">{items.length}</p>
                    <p className="text-[12px] text-muted">{label}</p>
                    <p className="mt-1 text-[11px] text-subtle">
                      +{items.filter((i) => i.kind === 'added').length} · ~{items.filter((i) => i.kind === 'modified').length} · −{items.filter((i) => i.kind === 'removed').length}
                    </p>
                  </div>
                ))}
              </div>
              {diff.total === 0 && <p className="mt-3 text-[13px] text-warning">Aucune modification : ce brouillon est identique à la version {base.number}.</p>}
            </div>
          </div>
        )}
        {step === 1 && (
          <Field label="Notes de version pour les licenciés" hint="Affichées dans la notification et dans le dialogue « nouvelle version disponible » de chaque dossier.">
            {(p) => <Textarea {...p} rows={8} value={changelog} onChange={(e) => setChangelog(e.target.value)} />}
          </Field>
        )}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-3 text-[13.5px]">
              <li className="flex gap-3 rounded-md bg-canvas px-4 py-3">
                <Radio className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <span>
                  <strong>{tenants.length} tenants licenciés</strong> et toutes les entreprises abonnées seront notifiés.
                </span>
              </li>
              <li className="flex gap-3 rounded-md bg-canvas px-4 py-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                <span>
                  <strong>{dossiers.toLocaleString('fr-FR')} dossiers en cours</strong> conserveront leurs évaluations et verront un bandeau « nouvelle version disponible ». Rien n'est écrasé.
                </span>
              </li>
            </ul>
            <CheckRow checked={ack} onCheckedChange={setAck} label={`Je confirme la publication de la version ${number}, horodatée et définitive.`} />
          </div>
        )}
        {step === 3 && (
          <div>
            <p className="text-[13.5px] text-ink-soft">Diffusion en cours auprès des tenants…</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {tenants.map((l, i) => (
                <li key={l.id} className={cn('flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] transition-colors duration-200', broadcast !== null && i < broadcast ? 'border-success/30 bg-success-soft/50' : 'border-line')}>
                  {broadcast !== null && i < broadcast ? <CheckCircle2 className="size-4 text-success" /> : <span className="size-4 rounded-full border-2 border-line-strong" />}
                  <span className="truncate">{l.branding.nomCommercial}</span>
                  <span className="ml-auto text-[11.5px] text-muted">{broadcast !== null && i < broadcast ? 'notifié' : 'en attente'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface EditorProps<T> {
  open: boolean
  onOpenChange: (o: boolean) => void
  item: T | null
  versionId: string
  readOnly: boolean
  previous?: T
}

function useSave(versionId: string, section: 'clauses' | 'tasks' | 'documents' | 'trainings', close: () => void) {
  return useAppMutation((item: Clause | TaskTemplate | DocumentTemplate | TrainingPath) => kitService.saveItem(versionId, section, item), {
    invalidate: [qk.kitVersion(versionId), qk.kitVersions],
    success: 'Élément enregistré dans le brouillon',
    onSuccess: close,
  })
}

/** D-08 */
export function ClauseSheet({ open, onOpenChange, item, versionId, readOnly, previous, documents }: EditorProps<Clause> & { documents: DocumentTemplate[] }) {
  const [c, setC] = useState<Clause | null>(item)
  useEffect(() => setC(item), [item])
  const save = useSave(versionId, 'clauses', () => onOpenChange(false))
  if (!c) return null
  const linked = documents.filter((d) => d.clauseCode === c.code)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="lg"
        title={item?.titre ? `§ ${c.code} — ${c.titre}` : 'Nouvelle clause'}
        description={CHAPTER_TITLES[c.chapitre]}
        footer={
          readOnly ? (
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button loading={save.isPending} disabled={!c.code || !c.titre} onClick={() => save.mutate({ ...c, chapitre: Number(c.code.split('.')[0]) })}>Enregistrer</Button>
            </>
          )
        }
      >
        <fieldset disabled={readOnly} className="flex flex-col gap-4">
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <Field label="Code">{(p) => <Input {...p} value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} className="font-mono" />}</Field>
            <Field label="Titre">{(p) => <Input {...p} value={c.titre} onChange={(e) => setC({ ...c, titre: e.target.value })} />}</Field>
          </div>
          <Field label="Exigence">{(p) => <Textarea {...p} rows={4} value={c.exigence} onChange={(e) => setC({ ...c, exigence: e.target.value })} />}</Field>
          {previous && previous.exigence !== c.exigence && (
            <div className="rounded-md border border-warning/30 bg-warning-soft/40 p-3">
              <p className="mb-1 text-[12px] font-semibold text-warning">Modifié depuis la version publiée</p>
              <DiffText before={previous.exigence} after={c.exigence} />
            </div>
          )}
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">Guide d'évaluation par niveau</legend>
            <ul className="divide-y divide-line rounded-md border border-line text-[13px]">
              {([0, 1, 2, 3, 4] as const).map((s) => (
                <li key={s} className="flex gap-3 px-3 py-2">
                  <span className="w-5 font-mono text-brand-700">{s}</span>
                  <span className="font-semibold text-ink">{SCORE_LABELS[s]}</span>
                </li>
              ))}
            </ul>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">Preuves attendues</legend>
            <ul className="flex flex-col gap-2">
              {c.guide.map((g, i) => (
                <li key={i} className="flex gap-2">
                  <Input value={g} onChange={(e) => setC({ ...c, guide: c.guide.map((x, k) => (k === i ? e.target.value : x)) })} aria-label={`Preuve ${i + 1}`} />
                  {!readOnly && (
                    <Button variant="ghost" size="icon" aria-label="Retirer" onClick={() => setC({ ...c, guide: c.guide.filter((_, k) => k !== i) })}>
                      <X />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {!readOnly && (
              <Button variant="link" size="sm" className="mt-1" onClick={() => setC({ ...c, guide: [...c.guide, ''] })}>
                <Plus /> Ajouter une preuve
              </Button>
            )}
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Poids dans la couverture">
              {(p) => (
                <Select {...p} value={c.poids} onChange={(e) => setC({ ...c, poids: Number(e.target.value) as 1 | 2 | 3 })}>
                  <option value={1}>1 — standard</option>
                  <option value={2}>2 — important</option>
                  <option value={3}>3 — structurant</option>
                </Select>
              )}
            </Field>
            <label className="mt-6 flex items-center justify-between gap-3 rounded-md border border-line px-3 text-[13.5px] font-semibold">
              Nouveauté 2026
              <Switch checked={c.nouveaute2026} onCheckedChange={(v) => setC({ ...c, nouveaute2026: v })} />
            </label>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Documents socle liés</p>
            <div className="flex flex-wrap gap-1.5">
              {linked.length ? linked.map((d) => <Badge key={d.id} tone="brand">{d.code} · {d.titre}</Badge>) : <span className="text-[13px] text-muted">Aucun</span>}
            </div>
          </div>
        </fieldset>
      </SheetContent>
    </Dialog>
  )
}

/** D-09 */
export function TaskTemplateSheet({ open, onOpenChange, item, versionId, readOnly }: EditorProps<TaskTemplate>) {
  const [t, setT] = useState<TaskTemplate | null>(item)
  useEffect(() => setT(item), [item])
  const save = useSave(versionId, 'tasks', () => onOpenChange(false))
  if (!t) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={item?.titre ? 'Tâche type' : 'Nouvelle tâche type'}
        description={`Phase ${t.phase} — ${PHASE_TITLES[t.phase - 1]}`}
        footer={
          readOnly ? (
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button loading={save.isPending} disabled={!t.titre} onClick={() => save.mutate(t)}>Enregistrer</Button>
            </>
          )
        }
      >
        <fieldset disabled={readOnly} className="flex flex-col gap-4">
          <Field label="Phase">
            {(p) => (
              <Select {...p} value={t.phase} onChange={(e) => setT({ ...t, phase: Number(e.target.value) })}>
                {PHASE_TITLES.map((pt, i) => (
                  <option key={pt} value={i + 1}>{i + 1} — {pt}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Titre">{(p) => <Input {...p} value={t.titre} onChange={(e) => setT({ ...t, titre: e.target.value })} />}</Field>
          <Field label="Description">{(p) => <Textarea {...p} rows={4} value={t.description} onChange={(e) => setT({ ...t, description: e.target.value })} />}</Field>
          <Field label="Durée indicative (jours)">{(p) => <Input {...p} type="number" min={1} value={t.dureeJours} onChange={(e) => setT({ ...t, dureeJours: Number(e.target.value) })} className="w-32 font-mono" />}</Field>
        </fieldset>
      </SheetContent>
    </Dialog>
  )
}

/** D-10 */
export function DocumentTemplateDialog({ open, onOpenChange, item, versionId, readOnly, clauses }: EditorProps<DocumentTemplate> & { clauses: Clause[] }) {
  const [d, setD] = useState<DocumentTemplate | null>(item)
  const [file, setFile] = useState<string>('')
  useEffect(() => setD(item), [item])
  const save = useSave(versionId, 'documents', () => onOpenChange(false))
  if (!d) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={item?.titre ? `${d.code} — ${d.titre}` : 'Nouveau document socle'}
        footer={
          readOnly ? (
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button loading={save.isPending} disabled={!d.titre || !d.code} onClick={() => save.mutate(d)}>Enregistrer</Button>
            </>
          )
        }
      >
        <fieldset disabled={readOnly} className="flex flex-col gap-4">
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <Field label="Code">{(p) => <Input {...p} value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} className="font-mono" />}</Field>
            <Field label="Titre">{(p) => <Input {...p} value={d.titre} onChange={(e) => setD({ ...d, titre: e.target.value })} />}</Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              {(p) => (
                <Select {...p} value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as DocumentType })}>
                  {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map((t) => (
                    <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Clause liée">
              {(p) => (
                <Select {...p} value={d.clauseCode} onChange={(e) => setD({ ...d, clauseCode: e.target.value })}>
                  {clauses.map((c) => (
                    <option key={c.id} value={c.code}>§ {c.code} {c.titre}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <CheckRow checked={d.obligatoire} onCheckedChange={(v) => setD({ ...d, obligatoire: v })} label="Information documentée exigée par la norme" />
          <Field label="Modèle (.docx)" optional>
            {(p) => <Input {...p} type="file" accept=".docx,.doc,.xlsx" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />}
          </Field>
          {file && <p className="text-[12.5px] text-muted">Modèle sélectionné : {file}</p>}
        </fieldset>
      </DialogContent>
    </Dialog>
  )
}

/** D-11 */
export function TrainingPathSheet({ open, onOpenChange, item, versionId, readOnly }: EditorProps<TrainingPath>) {
  const [t, setT] = useState<TrainingPath | null>(item)
  useEffect(() => setT(item), [item])
  const save = useSave(versionId, 'trainings', () => onOpenChange(false))
  if (!t) return null
  const total = t.modules.reduce((a, m) => a + m.dureeHeures, 0)
  const move = (i: number, dir: -1 | 1) => {
    const mods = [...t.modules]
    const j = i + dir
    if (j < 0 || j >= mods.length) return
    ;[mods[i], mods[j]] = [mods[j], mods[i]]
    setT({ ...t, modules: mods })
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="lg"
        title={t.nom || 'Parcours de formation'}
        description={`${t.modules.length} modules · ${total} h`}
        footer={
          readOnly ? (
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button loading={save.isPending} onClick={() => save.mutate(t)}>Enregistrer</Button>
            </>
          )
        }
      >
        <fieldset disabled={readOnly} className="flex flex-col gap-4">
          <Field label="Nom du parcours">{(p) => <Input {...p} value={t.nom} onChange={(e) => setT({ ...t, nom: e.target.value })} />}</Field>
          <Field label="Public cible">{(p) => <Input {...p} value={t.publicCible} onChange={(e) => setT({ ...t, publicCible: e.target.value })} />}</Field>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">Modules</legend>
            <ol className="flex flex-col gap-2">
              {t.modules.map((m, i) => (
                <li key={m.id} className="flex items-center gap-2 rounded-md border border-line bg-surface p-2">
                  {!readOnly && (
                    <div className="flex flex-col">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-muted hover:text-ink disabled:opacity-30" aria-label="Monter le module">
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === t.modules.length - 1} className="text-muted hover:text-ink disabled:opacity-30" aria-label="Descendre le module">
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                  )}
                  <span className="w-5 font-mono text-[12px] text-muted">{i + 1}</span>
                  <Input value={m.titre} onChange={(e) => setT({ ...t, modules: t.modules.map((x, k) => (k === i ? { ...x, titre: e.target.value } : x)) })} aria-label={`Module ${i + 1}`} />
                  <div className="relative w-24 shrink-0">
                    <Input type="number" min={1} value={m.dureeHeures} onChange={(e) => setT({ ...t, modules: t.modules.map((x, k) => (k === i ? { ...x, dureeHeures: Number(e.target.value) } : x)) })} className="pr-6 text-right font-mono" aria-label="Durée en heures" />
                    <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[12px] text-muted">h</span>
                  </div>
                  {!readOnly && (
                    <Button variant="ghost" size="icon-sm" aria-label="Retirer" onClick={() => setT({ ...t, modules: t.modules.filter((_, k) => k !== i) })}>
                      <X />
                    </Button>
                  )}
                </li>
              ))}
            </ol>
            {!readOnly && (
              <Button variant="link" size="sm" className="mt-1" onClick={() => setT({ ...t, modules: [...t.modules, { id: uid('mod'), titre: '', dureeHeures: 2 }] })}>
                <Plus /> Ajouter un module
              </Button>
            )}
          </fieldset>
        </fieldset>
      </SheetContent>
    </Dialog>
  )
}
