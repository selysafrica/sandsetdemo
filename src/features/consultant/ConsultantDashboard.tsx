import { CalendarPlus, CheckSquare, FileText, GraduationCap, HelpCircle, ListChecks, Target, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { qk, useDossiers, useMyTasks, useNotifications } from '@/hooks/queries'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { date, dateLong, relative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { tasksService } from '@/services/workspace.service'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { Card, CardHeader } from '@/components/ui/display'
import { ScoreBar } from '@/components/common/indicators'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState, PageSkeleton } from '@/components/common/states'

export function ConsultantDashboard() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: dossiers, isLoading } = useDossiers()
  const { data: tasks = [] } = useMyTasks()
  const { data: notifs = [] } = useNotifications()
  if (isLoading || !dossiers) return <PageSkeleton />

  const today = new Date().toISOString().slice(0, 10)
  const week = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  const groups = [
    { label: 'En retard', items: tasks.filter((t) => t.dueDate < today), tone: 'text-danger' },
    { label: "Aujourd'hui", items: tasks.filter((t) => t.dueDate === today), tone: 'text-accent' },
    { label: 'Cette semaine', items: tasks.filter((t) => t.dueDate > today && t.dueDate <= week), tone: 'text-ink-soft' },
  ]
  const inProgress = dossiers.filter((s) => s.coverage.evaluated < s.coverage.applicable).sort((a, b) => b.coverage.evaluated - a.coverage.evaluated)[0]
  const isTrainer = user?.profile === 'FORMATEUR'

  const complete = async (id: string) => {
    const t = tasks.find((x) => x.id === id)
    if (!t) return
    const { clientName: _c, ...task } = t
    await tasksService.save({ ...task, status: 'TERMINEE' })
    toast.success('Tâche terminée')
    qc.invalidateQueries({ queryKey: qk.myTasks })
    qc.invalidateQueries({ queryKey: qk.dossiers })
  }

  return (
    <>
      <PageHeader
        title={`Bonjour ${user?.firstName}`}
        subtitle={<span className="capitalize">{dateLong(new Date())} · {dossiers.length} dossier{dossiers.length > 1 ? 's' : ''} affecté{dossiers.length > 1 ? 's' : ''}</span>}
        actions={
          inProgress && (
            <Button onClick={() => navigate(`/app/dossiers/${inProgress.dossier.id}/analyse-ecart`)}>
              <Zap /> Reprendre l'évaluation — {inProgress.dossier.clientName}
            </Button>
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Aujourd'hui & cette semaine" description="Vos tâches, tous dossiers confondus" action={<Button variant="link" size="sm" asChild><Link to="/app/mes-taches">Toutes mes tâches</Link></Button>} />
            {groups.every((g) => !g.items.length) ? (
              <div className="px-5 pb-5">
                <EmptyState title="Rien d'urgent" description="Aucune tâche en retard ni à échéance cette semaine." icon={<CheckSquare className="size-8 text-success" />} />
              </div>
            ) : (
              <div className="border-t border-line">
                {groups
                  .filter((g) => g.items.length)
                  .map((g) => (
                    <section key={g.label}>
                      <h3 className={cn('bg-canvas px-5 py-1.5 text-[12px] font-semibold', g.tone)}>
                        {g.label} · {g.items.length}
                      </h3>
                      <ul className="divide-y divide-line">
                        {g.items.slice(0, 6).map((t) => (
                          <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                            <Checkbox onCheckedChange={() => complete(t.id)} aria-label={`Terminer « ${t.titre} »`} />
                            <Link to={`/app/dossiers/${t.dossierId}/plan`} className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px] text-ink hover:underline">{t.titre}</span>
                              <span className="text-[12px] text-muted">
                                {t.clientName} · phase {t.phase}
                              </span>
                            </Link>
                            <span className={cn('font-mono text-[12px]', g.tone)}>{date(t.dueDate)}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Mes clients" />
            <ul className="divide-y divide-line border-t border-line">
              {dossiers.map((s) => (
                <li key={s.dossier.id}>
                  <Link to={`/app/dossiers/${s.dossier.id}/vue-ensemble`} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 hover:bg-canvas sm:grid-cols-[1fr_200px_80px_100px]">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{s.dossier.clientName}</span>
                      <span className="text-[12px] text-muted">{s.dossier.secteur}</span>
                    </span>
                    <ScoreBar value={s.progress.overall} className="hidden sm:flex" />
                    <span className="hidden text-[12.5px] text-muted sm:block">Phase {s.currentPhase}/6</span>
                    <span className="text-right text-[12px] text-muted">{s.nextDue ? date(s.nextDue.dueDate) : '—'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          {isTrainer && (
            <Card className="p-5">
              <h2 className="flex items-center gap-2 text-[14px] font-bold">
                <GraduationCap className="size-4 text-accent" /> Sessions de formation
              </h2>
              <p className="mt-1 text-[13px] text-muted">Enregistrez vos sessions le jour même : elles alimentent l'avancement et la déclaration trimestrielle.</p>
              <Button size="sm" className="mt-3" onClick={() => dossiers[0] && navigate(`/app/dossiers/${dossiers[0].dossier.id}/formations`)}>
                <CalendarPlus /> Enregistrer une session
              </Button>
            </Card>
          )}
          <Card className="p-5">
            <h2 className="mb-3 text-[14px] font-bold">Modules du Kit</h2>
            <ul className="grid grid-cols-2 gap-2">
              {[
                { icon: <Target />, label: "Analyse d'écart", to: 'analyse-ecart' },
                { icon: <ListChecks />, label: "Plan d'action", to: 'plan' },
                { icon: <FileText />, label: 'Documentation', to: 'documents' },
                { icon: <GraduationCap />, label: 'Formation', to: 'formations' },
              ].map((m) => (
                <li key={m.to}>
                  <Link to={dossiers[0] ? `/app/dossiers/${dossiers[0].dossier.id}/${m.to}` : '/app/dossiers'} className="flex flex-col items-start gap-2 rounded-md border border-line p-3 text-[13px] font-semibold hover:border-accent/40 hover:bg-accent-soft [&_svg]:size-4 [&_svg]:text-accent">
                    {m.icon}
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-[14px] font-bold">Notifications récentes</h2>
            <ul className="flex flex-col gap-3">
              {notifs.slice(0, 4).map((n) => (
                <li key={n.id} className="text-[13px]">
                  <Link to={n.link ?? '/app/notifications'} className={cn('block hover:underline', !n.readAt && 'font-semibold')}>
                    {n.title}
                  </Link>
                  <span className="text-[12px] text-muted">{relative(n.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Link to="/app/support" className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 text-[13.5px] font-semibold shadow-card hover:border-accent/40">
            <HelpCircle className="size-5 text-accent" /> Aide & support
          </Link>
        </aside>
      </div>
    </>
  )
}
