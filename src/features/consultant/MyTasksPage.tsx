import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, formatISO, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight, FolderOpen, List } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { qk, useMyTasks } from '@/hooks/queries'
import { date } from '@/lib/format'
import { STATUS_META } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { tasksService } from '@/services/workspace.service'
import type { Task, TaskStatus } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/controls'
import { Card } from '@/components/ui/display'
import { Select } from '@/components/ui/form'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '@/components/ui/overlays'
import { FilterChip } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/registre'
import { EmptyState, PageSkeleton } from '@/components/common/states'

type Row = Task & { clientName: string }

export function MyTasksPage() {
  const { data, isLoading } = useMyTasks()
  const qc = useQueryClient()
  const [view, setView] = useState<'list' | 'calendar' | 'dossier'>('list')
  const [dossier, setDossier] = useState('')
  const [late, setLate] = useState(false)
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const today = formatISO(new Date(), { representation: 'date' })
  const rows = useMemo(() => (data ?? []).filter((t) => (!dossier || t.dossierId === dossier) && (!late || t.dueDate < today)), [data, dossier, late, today])
  if (isLoading || !data) return <PageSkeleton />

  const update = async (t: Row, patch: Partial<Task>) => {
    const { clientName: _c, ...task } = t
    await tasksService.save({ ...task, ...patch })
    toast.success(patch.status ? `Statut : ${STATUS_META[patch.status].label}` : 'Échéance reportée')
    qc.invalidateQueries({ queryKey: qk.myTasks })
    qc.invalidateQueries({ queryKey: qk.dossiers })
  }
  const clients = [...new Map(data.map((t) => [t.dossierId, t.clientName])).entries()]

  const item = (t: Row) => (
    <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
      <span className="min-w-0 flex-1">
        <Link to={`/app/dossiers/${t.dossierId}/plan`} className="block truncate text-[13.5px] font-semibold text-ink hover:underline">
          {t.titre}
        </Link>
        <span className="text-[12px] text-muted">
          <span className="inline-flex items-center gap-1 rounded bg-panel px-1.5 py-px font-semibold text-ink-soft">{t.clientName}</span> · phase {t.phase}/6 · {t.templateId ? 'socle' : t.sourceClauseId ? 'issue d’un écart' : 'personnalisée'}
        </span>
      </span>
      <span className={cn('font-mono text-[12.5px]', t.dueDate < today ? 'text-danger' : 'text-ink-soft')}>{date(t.dueDate)}</span>
      <DropdownMenu>
        <DropdownTrigger asChild>
          <button type="button" aria-label="Changer le statut">
            <StatusBadge status={t.status} className="cursor-pointer" />
          </button>
        </DropdownTrigger>
        <DropdownContent>
          {(['A_FAIRE', 'EN_COURS', 'BLOQUEE', 'TERMINEE'] as TaskStatus[]).map((s) => (
            <DropdownItem key={s} onSelect={() => update(t, { status: s })}>
              {STATUS_META[s].label}
            </DropdownItem>
          ))}
        </DropdownContent>
      </DropdownMenu>
      <Button variant="ghost" size="sm" onClick={() => update(t, { dueDate: formatISO(addDays(new Date(t.dueDate < today ? today : t.dueDate), 7), { representation: 'date' }) })}>
        +7 j
      </Button>
    </li>
  )

  const weekEnd = formatISO(addDays(new Date(), 7), { representation: 'date' })
  const groups = [
    { label: 'En retard', items: rows.filter((t) => t.dueDate < today) },
    { label: "Aujourd'hui", items: rows.filter((t) => t.dueDate === today) },
    { label: 'Cette semaine', items: rows.filter((t) => t.dueDate > today && t.dueDate <= weekEnd) },
    { label: 'Plus tard', items: rows.filter((t) => t.dueDate > weekEnd) },
  ]
  const days = eachDayOfInterval({ start: startOfWeek(month, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) })

  return (
    <>
      <PageHeader title="Mes tâches" subtitle={`${data.length} tâches ouvertes sur vos dossiers affectés.`} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          label="Vue"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'list', label: 'Par échéance', icon: <List /> },
            { value: 'calendar', label: 'Calendrier', icon: <CalendarDays /> },
            { value: 'dossier', label: 'Par dossier', icon: <FolderOpen /> },
          ]}
        />
        <Select value={dossier} onChange={(e) => setDossier(e.target.value)} aria-label="Dossier" className="w-52">
          <option value="">Tous les dossiers</option>
          {clients.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Select>
        <FilterChip active={late} onClick={() => setLate((v) => !v)} count={data.filter((t) => t.dueDate < today).length}>
          En retard
        </FilterChip>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Aucune tâche ouverte" description="Toutes vos tâches sont terminées ou aucune ne correspond aux filtres." />
      ) : view === 'calendar' ? (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="icon-sm" onClick={() => setMonth(addDays(startOfMonth(month), -1))} aria-label="Mois précédent">
              <ChevronLeft />
            </Button>
            <h2 className="font-bold capitalize">{format(month, 'MMMM yyyy', { locale: fr })}</h2>
            <Button variant="ghost" size="icon-sm" onClick={() => setMonth(addDays(endOfMonth(month), 1))} aria-label="Mois suivant">
              <ChevronRight />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-line bg-line text-[12px]">
            {['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'].map((d) => (
              <div key={d} className="bg-canvas px-2 py-1.5 font-semibold text-muted">
                {d}
              </div>
            ))}
            {days.map((d) => {
              const key = formatISO(d, { representation: 'date' })
              const list = rows.filter((t) => t.dueDate === key)
              return (
                <div key={key} className={cn('min-h-24 bg-surface p-1.5', !isSameMonth(d, month) && 'bg-canvas text-subtle', key === today && 'ring-2 ring-accent ring-inset')}>
                  <span className="font-mono text-[11.5px]">{format(d, 'd')}</span>
                  <ul className="mt-1 flex flex-col gap-1">
                    {list.slice(0, 3).map((t) => (
                      <li key={t.id}>
                        <Link to={`/app/dossiers/${t.dossierId}/plan`} className={cn('block truncate rounded px-1.5 py-0.5 text-[11px]', key < today ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent')} title={`${t.clientName} — ${t.titre}`}>
                          {t.titre}
                        </Link>
                      </li>
                    ))}
                    {list.length > 3 && <li className="px-1.5 text-[11px] text-muted">+{list.length - 3}</li>}
                  </ul>
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {(view === 'list' ? groups : clients.map(([id, name]) => ({ label: name, items: rows.filter((t) => t.dossierId === id) })))
            .filter((g) => g.items.length)
            .map((g) => (
              <section key={g.label}>
                <h2 className="mb-2 text-[13.5px] font-bold text-ink">
                  {g.label} <span className="font-mono font-normal text-muted">{g.items.length}</span>
                </h2>
                <Card>
                  <ul className="divide-y divide-line">{g.items.map(item)}</ul>
                </Card>
              </section>
            ))}
        </div>
      )}
    </>
  )
}
