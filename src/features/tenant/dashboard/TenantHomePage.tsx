import { addMonths, differenceInCalendarDays, startOfMonth } from 'date-fns'
import { AlertCircle, CalendarCheck, FolderKanban, GraduationCap, Landmark, Plus, Send, Target } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDeclarations, useDossiers, useOwnLedger, useTenantActivity } from '@/hooks/queries'
import { useCurrentUser, useTenant } from '@/hooks/useCurrentUser'
import { date, dateLong, monthLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { kitService } from '@/services/kit.service'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/controls'
import { Card, CardHeader } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/overlays'
import { NewVersionBanner } from '@/components/common/banners'
import { CoverageRing, ScoreBar } from '@/components/common/indicators'
import { KpiCard } from '@/components/common/KpiCard'
import { AvatarStack, Timeline } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Money } from '@/components/common/registre'
import { PageSkeleton } from '@/components/common/states'
import { ConsultantDashboard } from '@/features/consultant/ConsultantDashboard'
import { CreateDossierDialog } from '../dossiers/CreateDossierDialog'

export function TenantHomePage() {
  const user = useCurrentUser()
  return user?.role === 'LICENCIE_USER' ? <ConsultantDashboard /> : <TenantDashboard />
}

function TenantDashboard() {
  const user = useCurrentUser()
  const { licencie } = useTenant()
  const navigate = useNavigate()
  const { data: dossiers, isLoading } = useDossiers()
  const { data: ledger } = useOwnLedger()
  const { data: decl } = useDeclarations()
  const { data: activity = [] } = useTenantActivity()
  const [sort, setSort] = useState<'progress' | 'audit'>('progress')
  const [createOpen, setCreateOpen] = useState(false)
  if (isLoading || !dossiers || !licencie) return <PageSkeleton />

  const active = dossiers.filter((s) => s.dossier.status === 'ACTIF')
  const avgCoverage = active.length ? Math.round(active.reduce((a, s) => a + s.coverage.coverage, 0) / active.length) : 0
  const late = active.reduce((a, s) => a + s.lateTasks, 0)
  const outdated = active.filter((s) => s.hasNewerVersion)
  const nextAudit = [...active].sort((a, b) => a.dossier.targetAuditDate.localeCompare(b.dossier.targetAuditDate))[0]
  const sorted = [...active].sort((a, b) => (sort === 'progress' ? b.progress.overall - a.progress.overall : a.dossier.targetAuditDate.localeCompare(b.dossier.targetAuditDate)))
  const start = startOfMonth(new Date())
  const end = addMonths(start, 6)
  const span = differenceInCalendarDays(end, start)
  const upcoming = active.filter((s) => new Date(s.dossier.targetAuditDate) < end)
  const nextDue = ledger?.ledger.filter((l) => l.solde > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  const declared = decl?.history.some((h) => h.periode === decl.current.periode)

  return (
    <>
      <PageHeader
        title={`Bonjour ${user?.firstName}`}
        subtitle={<span className="capitalize">{dateLong(new Date())} · {licencie.branding.nomCommercial}</span>}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Nouveau dossier
          </Button>
        }
      />
      {outdated.length > 0 && (
        <NewVersionBanner className="mb-6" onAction={() => navigate(`/app/dossiers/${outdated[0].dossier.id}/vue-ensemble`)} actionLabel="Mettre à jour">
          <strong>Version {kitService.latest().number} du socle publiée.</strong> {outdated.length} dossier{outdated.length > 1 ? 's utilisent' : ' utilise'} encore une version antérieure ({outdated.map((s) => s.dossier.clientName).join(', ')}).
        </NewVersionBanner>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Dossiers actifs" value={active.length} icon={<FolderKanban />} to="/app/dossiers" />
        <KpiCard label="Couverture moyenne" value={avgCoverage} format={(v) => `${Math.round(v)} %`} icon={<Target />} />
        <KpiCard label="Tâches en retard" value={late} icon={<AlertCircle />} className={late ? 'border-danger/25' : undefined} />
        <KpiCard label="Sessions ce trimestre" value={decl?.current.sessions ?? 0} icon={<GraduationCap />} />
        <Card className="col-span-2 flex flex-col p-4 lg:col-span-1">
          <span className="text-[13px] font-semibold text-ink-soft">Prochain audit de transition</span>
          {nextAudit ? (
            <>
              <span className="mt-2 text-[17px] font-bold text-ink">{date(nextAudit.dossier.targetAuditDate)}</span>
              <Link to={`/app/dossiers/${nextAudit.dossier.id}/vue-ensemble`} className="text-[12.5px] text-accent hover:underline">
                {nextAudit.dossier.clientName}
              </Link>
            </>
          ) : (
            <span className="mt-2 text-muted">—</span>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader
              title="Portefeuille de dossiers"
              description={`${active.length} clients accompagnés`}
              action={
                <Segmented
                  label="Trier par"
                  size="sm"
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: 'progress', label: 'Avancement' },
                    { value: 'audit', label: 'Échéance' },
                  ]}
                />
              }
            />
            <ul className="divide-y divide-line border-t border-line">
              {sorted.map((s) => (
                <li key={s.dossier.id}>
                  <Link to={`/app/dossiers/${s.dossier.id}/vue-ensemble`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3 hover:bg-canvas md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_90px_110px_90px]">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{s.dossier.clientName}</span>
                      <span className="block text-[12px] text-muted">{s.dossier.secteur}</span>
                    </span>
                    <ScoreBar value={s.progress.overall} className="col-span-2 md:col-span-1" />
                    <span className="hidden text-[12.5px] text-muted md:block">Phase {s.currentPhase}/6</span>
                    <span className="hidden md:block">
                      <AvatarStack names={s.team.map((t) => t.name)} size="xs" />
                    </span>
                    <span className="hidden text-right font-mono text-[12px] text-ink-soft md:block">{date(s.dossier.targetAuditDate)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Échéances d'audit de transition" description="6 prochains mois" />
            <div className="px-5 pb-5">
              <div className="relative h-8 border-b border-line">
                {Array.from({ length: 7 }, (_, i) => addMonths(start, i)).map((m) => (
                  <span key={m.toISOString()} className="absolute top-1 -translate-x-1/2 text-[11.5px] text-muted capitalize" style={{ left: `${(differenceInCalendarDays(m, start) / span) * 100}%` }}>
                    {monthLabel(m)}
                  </span>
                ))}
              </div>
              <div className="relative" style={{ height: Math.max(56, upcoming.length * 26 + 16) }}>
                <span className="absolute inset-y-0 w-px bg-accent" style={{ left: `${(differenceInCalendarDays(new Date(), start) / span) * 100}%` }} aria-hidden />
                {upcoming.map((s, i) => (
                  <Tooltip key={s.dossier.id} content={`${s.dossier.clientName} — ${date(s.dossier.targetAuditDate)}`}>
                    <Link
                      to={`/app/dossiers/${s.dossier.id}/vue-ensemble`}
                      className="absolute flex items-center gap-1.5 text-[12px] font-semibold whitespace-nowrap text-ink hover:underline"
                      style={{ left: `${(differenceInCalendarDays(new Date(s.dossier.targetAuditDate), start) / span) * 100}%`, top: 8 + i * 26 }}
                    >
                      <span className="size-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-accent" />
                      {s.dossier.clientName}
                    </Link>
                  </Tooltip>
                ))}
                {!upcoming.length && <p className="pt-4 text-[13px] text-muted">Aucun audit prévu dans les 6 prochains mois.</p>}
              </div>
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Landmark className="size-4 text-accent" />
              <h2 className="text-[14px] font-bold">Mes redevances</h2>
            </div>
            <p className="mt-3 text-[12.5px] text-muted">Solde à régler</p>
            <p className="text-[22px]">
              <Money value={ledger?.totals.solde ?? 0} tone={ledger?.totals.retard ? 'danger' : undefined} />
            </p>
            {nextDue && <p className="mt-1 text-[12.5px] text-muted">Prochaine échéance le {date(nextDue.dueDate)}</p>}
            <Button variant="link" size="sm" className="mt-2" asChild>
              <Link to="/app/redevances">Voir le détail</Link>
            </Button>
          </Card>
          <Card className={cn('p-5', !declared && 'border-accent/40')}>
            <div className="flex items-center gap-2">
              {declared ? <CalendarCheck className="size-4 text-success" /> : <Send className="size-4 text-accent" />}
              <h2 className="text-[14px] font-bold">Déclaration {decl?.current.periode}</h2>
            </div>
            <p className="mt-2 text-[13px] text-ink-soft">{declared ? 'Déclaration transmise. Merci !' : 'Déclarez le CA de vos sessions de formation du trimestre.'}</p>
            {!declared && (
              <Button size="sm" className="mt-3" onClick={() => navigate('/app/declarations')}>
                Déclarer maintenant
              </Button>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 text-[14px] font-bold">Activité de l'équipe</h2>
            <Timeline compact items={activity.map((a) => ({ at: a.at, label: a.label, actor: a.actor, kind: a.kind }))} />
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <CoverageRing value={licencie.indicators.pctDerniereVersion} size="sm" toned={false} label="Dossiers sur la dernière version du socle" />
            <p className="text-[13px] text-ink-soft">des dossiers utilisent le socle {kitService.latest().number}</p>
          </Card>
        </aside>
      </div>
      <CreateDossierDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
