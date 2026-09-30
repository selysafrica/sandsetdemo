import { addDays, differenceInCalendarDays, formatISO, max as maxDate, min as minDate, parseISO } from 'date-fns'
import { CalendarRange, Columns3, Flag, ListTree, Lock, Plus, Sparkles } from 'lucide-react'
import { useMemo, useState, type DragEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { qk, useTasks, workspaceKeys } from '@/hooks/queries'
import { phaseProgress } from '@/lib/calculations/progress'
import { date, monthLabel } from '@/lib/format'
import { STATUS_META } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { tasksService } from '@/services/workspace.service'
import type { Task, TaskStatus } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Checkbox, Segmented } from '@/components/ui/controls'
import { Avatar, Badge, Card, Skeleton } from '@/components/ui/display'
import { Select } from '@/components/ui/form'
import { Tooltip } from '@/components/ui/overlays'
import { FilterChip } from '@/components/common/misc'
import { PHASE_TITLES, PhaseRail } from '@/components/common/PhaseRail'
import { StatusBadge } from '@/components/common/registre'
import { EmptyState } from '@/components/common/states'
import { useDossierContext } from '../context'
import { TaskSheet } from './TaskSheet'

const COLUMNS: TaskStatus[] = ['A_FAIRE', 'EN_COURS', 'BLOQUEE', 'TERMINEE']
const today = formatISO(new Date(), { representation: 'date' })

export function PlanPage() {
  const { dossierId, summary } = useDossierContext()
  const { data: tasks, isLoading } = useTasks(dossierId)
  const qc = useQueryClient()
  const [view, setView] = useState<'phases' | 'kanban' | 'gantt'>('phases')
  const [phase, setPhase] = useState<number | null>(null)
  const [owner, setOwner] = useState('')
  const [origin, setOrigin] = useState<'' | 'socle' | 'custom' | 'gap'>('')
  const [late, setLate] = useState(false)
  const [editing, setEditing] = useState<Task | null | 'new'>(null)
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null)

  const progress = useMemo(() => phaseProgress(tasks ?? []), [tasks])
  const owners = [...new Set((tasks ?? []).map((t) => t.responsable))].sort()
  const filtered = useMemo(
    () =>
      (tasks ?? []).filter(
        (t) =>
          (!phase || t.phase === phase) &&
          (!owner || t.responsable === owner) &&
          (!late || (t.status !== 'TERMINEE' && t.dueDate < today)) &&
          (!origin || (origin === 'socle' ? !!t.templateId : origin === 'gap' ? !!t.sourceClauseId : !t.templateId && !t.sourceClauseId)),
      ),
    [tasks, phase, owner, late, origin],
  )

  const setStatus = async (t: Task, status: TaskStatus) => {
    const before = progress.find((p) => p.phase === t.phase)
    qc.setQueryData<Task[]>(qk.tasks(dossierId), (old) => old?.map((x) => (x.id === t.id ? { ...x, status } : x)))
    await tasksService.save({ ...t, status })
    const after = phaseProgress((qc.getQueryData<Task[]>(qk.tasks(dossierId)) ?? []).map((x) => (x.id === t.id ? { ...x, status } : x))).find((p) => p.phase === t.phase)
    if (before && after && before.pct < 100 && after.pct === 100) toast.success(`Phase ${t.phase} terminée — ${PHASE_TITLES[t.phase - 1]}`, { icon: <Sparkles className="size-4 text-success" /> })
    for (const k of workspaceKeys(dossierId)) qc.invalidateQueries({ queryKey: k })
  }

  if (isLoading || !tasks) return <Skeleton className="h-96 w-full rounded-lg" />

  const row = (t: Task) => {
    const overdue = t.status !== 'TERMINEE' && t.dueDate < today
    return (
      <li key={t.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-canvas">
        <Checkbox checked={t.status === 'TERMINEE'} onCheckedChange={(v) => setStatus(t, v === true ? 'TERMINEE' : 'EN_COURS')} aria-label={`Marquer « ${t.titre} » comme terminée`} />
        <button type="button" onClick={() => setEditing(t)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="min-w-0 flex-1">
            <span className={cn('block truncate text-[13.5px]', t.status === 'TERMINEE' ? 'text-muted line-through' : 'text-ink')}>{t.titre}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-muted">
              {t.templateId ? (
                <span className="inline-flex items-center gap-1">
                  <Lock className="size-3" /> Socle
                </span>
              ) : t.sourceClauseId ? (
                <span className="text-brand-700">Issue de la clause § {summary.version.content.clauses.find((c) => c.id === t.sourceClauseId)?.code}</span>
              ) : (
                <span>Personnalisée</span>
              )}
              {t.priority === 'HAUTE' && <Badge tone="warning">Prioritaire</Badge>}
            </span>
          </span>
          <Tooltip content={t.responsable}>
            <span>
              <Avatar name={t.responsable} size="xs" />
            </span>
          </Tooltip>
          <span className={cn('hidden w-24 text-right font-mono text-[12px] tabular sm:block', overdue ? 'text-danger' : 'text-ink-soft')}>{date(t.dueDate)}</span>
          <span className="hidden w-28 md:block">
            <StatusBadge status={t.status} />
          </span>
        </button>
      </li>
    )
  }

  const onDrop = (e: DragEvent, status: TaskStatus) => {
    e.preventDefault()
    setDragOver(null)
    const t = tasks.find((x) => x.id === e.dataTransfer.getData('text/plain'))
    if (t && t.status !== status) void setStatus(t, status)
  }

  const dated = filtered.length ? filtered : tasks
  const start = minDate([parseISO(summary.dossier.createdAt), ...dated.map((t) => addDays(parseISO(t.dueDate), -14))])
  const end = maxDate([parseISO(summary.dossier.targetAuditDate), ...dated.map((t) => parseISO(t.dueDate))])
  const span = Math.max(1, differenceInCalendarDays(end, start))
  const x = (d: Date | string) => (differenceInCalendarDays(typeof d === 'string' ? parseISO(d) : d, start) / span) * 100
  const months = Array.from({ length: Math.ceil(span / 30) + 1 }, (_, i) => addDays(start, i * 30)).filter((m) => m <= end)

  return (
    <div>
      <Card className="mb-6 px-4 pt-5 pb-4">
        <PhaseRail phases={progress} current={summary.currentPhase} selected={phase} onSelect={(p) => setPhase(phase === p ? null : p)} />
        {phase && (
          <p className="mt-4 text-center text-[13px] text-muted">
            Filtré sur la phase {phase} — {PHASE_TITLES[phase - 1]}.{' '}
            <button type="button" className="font-semibold text-accent hover:underline" onClick={() => setPhase(null)}>
              Voir toutes les phases
            </button>
          </p>
        )}
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          label="Vue"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'phases', label: 'Phases', icon: <ListTree /> },
            { value: 'kanban', label: 'Kanban', icon: <Columns3 /> },
            { value: 'gantt', label: 'Chronologie', icon: <CalendarRange /> },
          ]}
        />
        <Select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Responsable" className="w-48">
          <option value="">Tous les responsables</option>
          {owners.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
        <Select value={origin} onChange={(e) => setOrigin(e.target.value as typeof origin)} aria-label="Origine" className="w-44">
          <option value="">Toutes origines</option>
          <option value="socle">Tâches du socle</option>
          <option value="custom">Personnalisées</option>
          <option value="gap">Issues d'un écart</option>
        </Select>
        <FilterChip active={late} onClick={() => setLate((v) => !v)} count={tasks.filter((t) => t.status !== 'TERMINEE' && t.dueDate < today).length}>
          En retard
        </FilterChip>
        <Button className="ml-auto" onClick={() => setEditing('new')}>
          <Plus /> Ajouter une tâche
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune tâche" description="Aucune tâche ne correspond à ces filtres." />
      ) : view === 'phases' ? (
        <div className="flex flex-col gap-4">
          {PHASE_TITLES.map((title, i) => {
            const list = filtered.filter((t) => t.phase === i + 1).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            if (!list.length) return null
            const p = progress[i]
            return (
              <Card key={title}>
                <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                  <span className={cn('grid size-7 place-items-center rounded-full font-mono text-[12px]', p.pct === 100 ? 'bg-accent text-accent-fg' : 'bg-accent-soft text-accent')}>{i + 1}</span>
                  <h3 className="flex-1 font-bold text-ink">{title}</h3>
                  <span className="font-mono text-[12.5px] text-muted tabular">
                    {p.done}/{p.total}
                  </span>
                  <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-panel sm:block">
                    <span className="block h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${p.pct}%` }} />
                  </span>
                </div>
                <ul className="divide-y divide-line">{list.map(row)}</ul>
              </Card>
            )
          })}
        </div>
      ) : view === 'kanban' ? (
        <div className="grid gap-4 overflow-x-auto md:grid-cols-4">
          {COLUMNS.map((s) => {
            const list = filtered.filter((t) => t.status === s)
            return (
              <section
                key={s}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(s)
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onDrop(e, s)}
                aria-label={STATUS_META[s].label}
                className={cn('flex min-h-64 flex-col rounded-lg border bg-panel/60 p-2 transition-colors', dragOver === s ? 'border-accent bg-accent-soft' : 'border-line')}
              >
                <h3 className="flex items-center justify-between px-2 pt-1 pb-2">
                  <StatusBadge status={s} />
                  <span className="font-mono text-[12px] text-muted">{list.length}</span>
                </h3>
                <ul className="flex flex-col gap-2">
                  {list.map((t) => (
                    <li
                      key={t.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
                      className="cursor-grab rounded-md border border-line bg-surface p-3 shadow-xs transition-shadow hover:shadow-card active:cursor-grabbing"
                    >
                      <button type="button" onClick={() => setEditing(t)} className="w-full text-left">
                        <p className="text-[13px] leading-snug text-ink">{t.titre}</p>
                        <p className="mt-2 flex items-center justify-between gap-2 text-[11.5px] text-muted">
                          <span className="font-mono">Ph. {t.phase}</span>
                          <span className={cn('font-mono', t.status !== 'TERMINEE' && t.dueDate < today && 'text-danger')}>{date(t.dueDate)}</span>
                          <Avatar name={t.responsable} size="xs" />
                        </p>
                      </button>
                      <label className="sr-only">
                        Changer le statut
                        <select value={t.status} onChange={(e) => setStatus(t, e.target.value as TaskStatus)}>
                          {COLUMNS.map((c) => (
                            <option key={c} value={c}>
                              {STATUS_META[c].label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="relative ml-72 h-9 border-b border-line">
              {months.filter((m) => x(m) < 94).map((m) => (
                <span key={m.toISOString()} className="absolute top-2.5 text-[11.5px] whitespace-nowrap text-muted" style={{ left: `${x(m)}%` }}>
                  {monthLabel(m)}
                </span>
              ))}
            </div>
            {PHASE_TITLES.map((title, i) => {
              const list = filtered.filter((t) => t.phase === i + 1).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              if (!list.length) return null
              return (
                <div key={title}>
                  <div className="border-b border-line bg-canvas px-4 py-1.5 text-[12px] font-semibold text-ink-soft">
                    Phase {i + 1} — {title}
                  </div>
                  {list.map((t) => {
                    const tpl = summary.version.content.tasks.find((x) => x.id === t.templateId)
                    const s = addDays(parseISO(t.dueDate), -(tpl?.dureeJours ?? 7))
                    return (
                      <div key={t.id} className="flex border-b border-line last:border-0">
                        <button type="button" onClick={() => setEditing(t)} className="w-72 shrink-0 truncate px-4 py-2 text-left text-[13px] text-ink hover:underline">
                          {t.titre}
                        </button>
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 w-px bg-brand-700/60" style={{ left: `${x(new Date())}%` }} aria-hidden />
                          <Tooltip content={`${t.titre} — échéance ${date(t.dueDate)} (${STATUS_META[t.status].label})`}>
                            <span
                              className={cn(
                                'absolute top-1/2 h-3 -translate-y-1/2 rounded-full',
                                t.status === 'TERMINEE' ? 'bg-accent' : t.status === 'BLOQUEE' ? 'bg-danger' : t.dueDate < today ? 'bg-danger/70' : 'bg-accent/40',
                              )}
                              style={{ left: `${x(s)}%`, width: `${Math.max(1, x(t.dueDate) - x(s))}%` }}
                            />
                          </Tooltip>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            <div className="flex border-t border-line bg-canvas">
              <span className="flex w-72 shrink-0 items-center gap-2 px-4 py-2.5 text-[13px] font-semibold">
                <Flag className="size-4 text-brand-700" /> Audit de certification visé
              </span>
              <div className="relative flex-1">
                <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-brand-700" style={{ left: `${x(summary.dossier.targetAuditDate)}%` }} aria-label={date(summary.dossier.targetAuditDate)} />
              </div>
            </div>
          </div>
        </Card>
      )}

      <TaskSheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} summary={summary} task={editing === 'new' ? null : editing} initial={editing === 'new' && phase ? { phase } : undefined} />
    </div>
  )
}
