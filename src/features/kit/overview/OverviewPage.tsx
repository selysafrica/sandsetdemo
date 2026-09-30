import { AlertTriangle, ArrowRight, CalendarClock, FileCheck2, FileText, GraduationCap, ListChecks, Settings2, Target, Users } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { qk, useAssessments, useTasks, workspaceKeys } from '@/hooks/queries'
import { date, daysUntil } from '@/lib/format'
import { cn } from '@/lib/utils'
import { dossiersService } from '@/services/dossiers.service'
import { tasksService } from '@/services/workspace.service'
import type { Task } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { Avatar, Card, CardHeader } from '@/components/ui/display'
import { CoverageRing, SegmentBar } from '@/components/common/indicators'
import { ScoreDot } from '@/components/common/ClauseScorePicker'
import { Timeline } from '@/components/common/misc'
import { PhaseRail } from '@/components/common/PhaseRail'
import { DottedLeader } from '@/components/common/registre'
import { useDossierContext } from '../context'
import { AssignDialog } from '../dialogs/AssignDialog'

function ModuleCard({ to, icon, title, value, detail, children }: { to: string; icon: ReactNode; title: string; value: ReactNode; detail: ReactNode; children?: ReactNode }) {
  return (
    <Link to={to} className="group flex flex-col rounded-lg border border-line bg-surface p-4 shadow-card transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-pop">
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-md bg-accent-soft text-accent [&_svg]:size-[18px]">{icon}</span>
        <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
      <p className="mt-3 text-[13px] font-semibold text-ink-soft">{title}</p>
      <p className="font-mono text-[22px] text-ink tabular">{value}</p>
      <p className="text-[12.5px] text-muted">{detail}</p>
      {children && <div className="mt-3">{children}</div>}
    </Link>
  )
}

export function OverviewPage() {
  const { dossierId, summary, base, canManageTeam, isEnterprise } = useDossierContext()
  const { data: tasks = [] } = useTasks(dossierId)
  const { data: assessments = [] } = useAssessments(dossierId)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [assignOpen, setAssignOpen] = useState(false)
  const d = summary.dossier
  const activity = useMemo(() => dossiersService.activity(dossierId), [dossierId])
  const today = new Date().toISOString().slice(0, 10)

  const next = tasks
    .filter((t) => t.status !== 'TERMINEE')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)
  const attention = summary.version.content.clauses
    .filter((c) => c.nouveaute2026)
    .map((c) => ({ c, a: assessments.find((x) => x.clauseId === c.id) }))
    .filter(({ a }) => a?.applicable && (a.score === null || a.score <= 1))

  const complete = async (t: Task) => {
    qc.setQueryData<Task[]>(qk.tasks(dossierId), (old) => old?.map((x) => (x.id === t.id ? { ...x, status: 'TERMINEE' } : x)))
    await tasksService.save({ ...t, status: 'TERMINEE' })
    toast.success(`« ${t.titre} » terminée`)
    for (const k of workspaceKeys(dossierId)) qc.invalidateQueries({ queryKey: k })
  }

  const auditIn = daysUntil(d.targetAuditDate)
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card className="grid gap-6 p-6 md:grid-cols-[auto_1fr]">
          <CoverageRing value={summary.coverage.coverage} size="lg" sublabel="couverture" label="Couverture de l'analyse d'écart" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[12.5px] font-semibold text-muted">Avancement global</p>
              <p className="font-mono text-[28px] text-ink tabular">{summary.progress.overall} %</p>
              <p className="text-[12px] text-muted">écart 30 · plan 40 · documents 20 · formations 10</p>
            </div>
            <div>
              <p className="text-[12.5px] font-semibold text-muted">Phase en cours</p>
              <p className="font-mono text-[28px] text-ink tabular">
                {summary.currentPhase}
                <span className="text-[16px] text-muted">/6</span>
              </p>
              <p className="text-[12px] text-muted">{summary.phases[summary.currentPhase - 1]?.pct} % de la phase réalisée</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[12.5px] font-semibold text-muted">Audit de certification visé</p>
              <p className="text-[17px] font-bold text-ink">{date(d.targetAuditDate)}</p>
              <p className={cn('inline-flex items-center gap-1 text-[12.5px] font-semibold', auditIn < 60 ? 'text-danger' : 'text-ink-soft')}>
                <CalendarClock className="size-3.5" /> {auditIn >= 0 ? `dans ${auditIn} jours` : `dépassé de ${-auditIn} jours`}
              </p>
            </div>
          </div>
        </Card>

        <Card className="px-4 pt-5 pb-4">
          <PhaseRail phases={summary.phases} current={summary.currentPhase} onSelect={() => navigate(`${base}/plan`)} />
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ModuleCard to={`${base}/analyse-ecart`} icon={<Target />} title="Analyse d'écart" value={`${summary.coverage.evaluated}/${summary.coverage.applicable}`} detail={`clauses évaluées · ${summary.coverage.gaps} écarts`} />
          <ModuleCard to={`${base}/plan`} icon={<ListChecks />} title="Plan de transition" value={`${summary.progress.plan} %`} detail={summary.lateTasks ? <span className="text-danger">{summary.lateTasks} tâches en retard</span> : 'aucun retard'} />
          <ModuleCard to={`${base}/documents`} icon={<FileText />} title="Documents" value={`${summary.docs.VALIDE}/${summary.docs.total}`} detail="validés">
            <SegmentBar
              parts={[
                { label: 'Validés', value: summary.docs.VALIDE, color: 'var(--color-success)' },
                { label: 'En cours', value: summary.docs.EN_COURS, color: 'var(--color-brand-400)' },
                { label: 'À créer', value: summary.docs.A_CREER, color: 'var(--color-line-strong)' },
              ]}
            />
          </ModuleCard>
          <ModuleCard to={`${base}/formations`} icon={<GraduationCap />} title="Formations" value={`${summary.progress.trainings} %`} detail="des modules des 3 parcours couverts" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Prochaines actions" description="Les 5 échéances les plus proches" action={<Button variant="link" size="sm" asChild><Link to={`${base}/plan`}>Tout le plan</Link></Button>} />
            <ul className="divide-y divide-line border-t border-line">
              {next.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                  <Checkbox onCheckedChange={() => complete(t)} aria-label={`Terminer « ${t.titre} »`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-ink">{t.titre}</span>
                    <span className="text-[12px] text-muted">{t.responsable}</span>
                  </span>
                  <span className={cn('font-mono text-[12px] tabular', t.dueDate < today ? 'text-danger' : 'text-ink-soft')}>{date(t.dueDate)}</span>
                </li>
              ))}
              {!next.length && <li className="px-5 py-6 text-center text-[13px] text-muted">Toutes les tâches sont terminées.</li>}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Points d'attention" description="Nouveautés 2026 non évaluées ou très peu couvertes" />
            <ul className="divide-y divide-line border-t border-line">
              {attention.map(({ c, a }) => (
                <li key={c.id}>
                  <Link to={`${base}/analyse-ecart?clause=${c.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-canvas">
                    <AlertTriangle className="size-4 shrink-0 text-warning" />
                    <span className="font-mono text-[12.5px] text-brand-700">§ {c.code}</span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px]">{c.titre}</span>
                    <ScoreDot score={a?.score ?? null} />
                  </Link>
                </li>
              ))}
              {!attention.length && (
                <li className="flex items-center gap-2 px-5 py-6 text-[13px] text-success">
                  <FileCheck2 className="size-4" /> Les nouveautés 2026 sont toutes traitées.
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      <aside className="flex flex-col gap-6">
        <Card className="p-5">
          <h2 className="mb-2 text-[14px] font-bold">{isEnterprise ? 'Mon organisation' : 'Fiche client'}</h2>
          <DottedLeader label="Secteur" value={d.secteur} />
          <DottedLeader label="Effectif" value={d.effectif} />
          <DottedLeader label="Sites" value={d.siteCount} />
          <DottedLeader label="Ville" value={d.ville} />
          <DottedLeader label="Responsable qualité" value={d.responsableQualite} />
          <DottedLeader label="Certifié ISO 9001:2015" value={d.certifie2015 ? `Oui, jusqu'au ${date(d.certificateExpiry)}` : 'Non'} />
          <DottedLeader label="Dossier ouvert le" value={date(d.createdAt)} />
        </Card>
        {!isEnterprise && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[14px] font-bold">
                <Users className="size-4 text-muted" /> Équipe affectée
              </h2>
              {canManageTeam && (
                <Button variant="ghost" size="sm" onClick={() => setAssignOpen(true)}>
                  <Settings2 /> Gérer
                </Button>
              )}
            </div>
            {summary.team.length ? (
              <ul className="flex flex-col gap-2">
                {summary.team.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 text-[13.5px]">
                    <Avatar name={m.name} size="sm" />
                    {m.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted">Aucun intervenant affecté.</p>
            )}
          </Card>
        )}
        <Card className="p-5">
          <h2 className="mb-4 text-[14px] font-bold">Activité récente</h2>
          {activity.length ? <Timeline compact items={activity} /> : <p className="text-[13px] text-muted">Aucune activité pour l'instant.</p>}
        </Card>
      </aside>
      {canManageTeam && <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} dossierId={dossierId} clientName={d.clientName} assigned={d.assignedUserIds} />}
    </div>
  )
}
