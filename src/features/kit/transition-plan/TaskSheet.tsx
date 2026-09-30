import { addDays, formatISO } from 'date-fns'
import { Lock, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { qk, useAppMutation, workspaceKeys } from '@/hooks/queries'
import { PRIORITY_LABELS, STATUS_META } from '@/lib/labels'
import type { DossierSummary } from '@/services/dossiers.service'
import { tasksService } from '@/services/workspace.service'
import type { Priority, Task, TaskStatus } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { PHASE_TITLES } from '@/components/common/PhaseRail'
import { useResponsables } from '../useResponsables'

const empty = (dossierId: string, responsable: string): Omit<Task, 'id'> => ({
  dossierId,
  phase: 4,
  templateId: null,
  titre: '',
  description: '',
  responsable,
  dueDate: formatISO(addDays(new Date(), 21), { representation: 'date' }),
  status: 'A_FAIRE',
  priority: 'NORMALE',
})

/** D-18 (and D-17 when opened with a source clause). */
export function TaskSheet({ open, onOpenChange, summary, task, initial, title }: { open: boolean; onOpenChange: (o: boolean) => void; summary: DossierSummary; task?: Task | null; initial?: Partial<Task>; title?: string }) {
  const dossierId = summary.dossier.id
  const people = useResponsables(summary)
  const [t, setT] = useState<Omit<Task, 'id'> & { id?: string }>(() => ({ ...empty(dossierId, people[0] ?? ''), ...initial }))
  const [custom, setCustom] = useState('')
  useEffect(() => {
    if (open) setT(task ? { ...task } : { ...empty(dossierId, people[0] ?? ''), ...initial })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task, initial, dossierId])
  const invalidate = [qk.tasks(dossierId), ...workspaceKeys(dossierId)]
  const save = useAppMutation(() => tasksService.save({ ...t, responsable: t.responsable === '__autre' ? custom : t.responsable }), {
    invalidate,
    success: t.id ? 'Tâche mise à jour' : t.sourceClauseId ? 'Action ajoutée au plan de transition' : 'Tâche ajoutée',
    onSuccess: () => onOpenChange(false),
  })
  const remove = useAppMutation(() => tasksService.remove(t.id!), { invalidate, success: 'Tâche supprimée', onSuccess: () => onOpenChange(false) })
  const locked = !!t.templateId
  const clause = t.sourceClauseId ? summary.version.content.clauses.find((c) => c.id === t.sourceClauseId) : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={title ?? (t.id ? 'Tâche' : 'Nouvelle tâche personnalisée')}
        description={locked ? 'Tâche type du socle : titre et description verrouillés.' : clause ? `Issue de l'analyse d'écart — § ${clause.code}` : 'Tâche propre à ce dossier.'}
        footer={
          <>
            {t.id && !locked && (
              <Button variant="ghost" className="mr-auto text-danger" loading={remove.isPending} onClick={() => remove.mutate(undefined)}>
                <Trash2 /> Supprimer
              </Button>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button loading={save.isPending} disabled={!t.titre.trim()} onClick={() => save.mutate(undefined)}>
              {t.id ? 'Enregistrer' : 'Ajouter au plan'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {locked && (
            <p className="flex items-center gap-2 rounded-md bg-panel px-3 py-2 text-[12.5px] text-ink-soft">
              <Lock className="size-3.5" /> Contenu socle v{summary.version.number} — statut, responsable et échéance restent modifiables.
            </p>
          )}
          <Field label="Titre">{(p) => <Input {...p} value={t.titre} disabled={locked} onChange={(e) => setT({ ...t, titre: e.target.value })} autoFocus={!locked} />}</Field>
          <Field label="Description" optional={!locked}>
            {(p) => <Textarea {...p} rows={3} value={t.description} disabled={locked} onChange={(e) => setT({ ...t, description: e.target.value })} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phase">
              {(p) => (
                <Select {...p} value={t.phase} disabled={locked} onChange={(e) => setT({ ...t, phase: Number(e.target.value) })}>
                  {PHASE_TITLES.map((pt, i) => (
                    <option key={pt} value={i + 1}>
                      {i + 1} — {pt}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Statut">
              {(p) => (
                <Select {...p} value={t.status} onChange={(e) => setT({ ...t, status: e.target.value as TaskStatus })}>
                  {(['A_FAIRE', 'EN_COURS', 'BLOQUEE', 'TERMINEE'] as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Responsable">
              {(p) => (
                <Select {...p} value={people.includes(t.responsable) ? t.responsable : '__autre'} onChange={(e) => setT({ ...t, responsable: e.target.value })}>
                  {people.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                  <option value="__autre">Autre intervenant interne…</option>
                </Select>
              )}
            </Field>
            <Field label="Échéance">{(p) => <Input {...p} type="date" value={t.dueDate} onChange={(e) => setT({ ...t, dueDate: e.target.value })} />}</Field>
          </div>
          {(t.responsable === '__autre' || !people.includes(t.responsable)) && (
            <Field label="Nom de l'intervenant">{(p) => <Input {...p} value={t.responsable === '__autre' ? custom : t.responsable} onChange={(e) => (t.responsable === '__autre' ? setCustom(e.target.value) : setT({ ...t, responsable: e.target.value }))} placeholder="Ex. Chef d'atelier" />}</Field>
          )}
          <Field label="Priorité">
            {(p) => (
              <Select {...p} value={t.priority} onChange={(e) => setT({ ...t, priority: e.target.value as Priority })}>
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((pr) => (
                  <option key={pr} value={pr}>
                    {PRIORITY_LABELS[pr]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </SheetContent>
    </Dialog>
  )
}
