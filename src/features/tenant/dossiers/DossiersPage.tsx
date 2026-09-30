import { Archive, CalendarClock, Columns3, LayoutGrid, MoreHorizontal, Pause, Play, Plus, Rows3, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { qk, useAppMutation, useDossiers } from '@/hooks/queries'
import { useCan, useCurrentUser } from '@/hooks/useCurrentUser'
import { date, daysUntil } from '@/lib/format'
import { cn } from '@/lib/utils'
import { dossiersService, type DossierSummary } from '@/services/dossiers.service'
import { kitService } from '@/services/kit.service'
import { useUi } from '@/stores/ui.store'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/controls'
import { Badge, Card } from '@/components/ui/display'
import { Select } from '@/components/ui/form'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/overlays'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { CoverageRing, ScoreBar } from '@/components/common/indicators'
import { AvatarStack, FilterChip } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { PHASE_TITLES, PhaseRail } from '@/components/common/PhaseRail'
import { RefCode, StatusBadge } from '@/components/common/registre'
import { matches, SearchInput } from '@/components/common/SearchInput'
import { EmptyState, ErrorState } from '@/components/common/states'
import { AssignDialog } from '@/features/kit/dialogs/AssignDialog'
import { CreateDossierDialog } from './CreateDossierDialog'

export function DossiersPage() {
  const { data, isLoading, error, refetch } = useDossiers()
  const user = useCurrentUser()
  const canCreate = useCan('dossiers.create')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const view = useUi((s) => s.dossierView)
  const setView = useUi((s) => s.setDossierView)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ACTIF')
  const [consultant, setConsultant] = useState('')
  const [phase, setPhase] = useState('')
  const [late, setLate] = useState(false)
  const [outdated, setOutdated] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [assignFor, setAssignFor] = useState<DossierSummary | null>(null)
  const [closeFor, setCloseFor] = useState<DossierSummary | null>(null)
  const latest = kitService.latest()
  const statusMut = useAppMutation(({ id, s }: { id: string; s: 'ACTIF' | 'EN_PAUSE' | 'CLOTURE' }) => dossiersService.setStatus(id, s), { invalidate: [qk.dossiers], success: 'Dossier mis à jour', onSuccess: () => setCloseFor(null) })

  useEffect(() => {
    if (params.get('nouveau') && canCreate) {
      setCreateOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams, canCreate])

  const consultants = [...new Set((data ?? []).flatMap((s) => s.team.map((t) => t.name)))].sort()
  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (s) =>
          (!status || s.dossier.status === status) &&
          (!consultant || s.team.some((t) => t.name === consultant)) &&
          (!phase || s.currentPhase === Number(phase)) &&
          (!late || s.lateTasks > 0) &&
          (!outdated || s.hasNewerVersion) &&
          matches(query, s.dossier.clientName, s.dossier.ref, s.dossier.secteur, s.dossier.ville),
      ),
    [data, status, consultant, phase, late, outdated, query],
  )

  const menu = (s: DossierSummary) =>
    canCreate ? (
      <DropdownMenu>
        <DropdownTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${s.dossier.clientName}`} onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal />
          </Button>
        </DropdownTrigger>
        <DropdownContent onClick={(e) => e.stopPropagation()}>
          <DropdownItem onSelect={() => setAssignFor(s)}>
            <UserPlus /> Affecter des intervenants
          </DropdownItem>
          {s.dossier.status === 'ACTIF' ? (
            <DropdownItem onSelect={() => statusMut.mutate({ id: s.dossier.id, s: 'EN_PAUSE' })}>
              <Pause /> Mettre en pause
            </DropdownItem>
          ) : (
            <DropdownItem onSelect={() => statusMut.mutate({ id: s.dossier.id, s: 'ACTIF' })}>
              <Play /> Réactiver
            </DropdownItem>
          )}
          <DropdownSeparator />
          <DropdownItem danger onSelect={() => setCloseFor(s)}>
            <Archive /> Clôturer le dossier
          </DropdownItem>
        </DropdownContent>
      </DropdownMenu>
    ) : null

  const open = (s: DossierSummary) => navigate(`/app/dossiers/${s.dossier.id}/vue-ensemble`)

  return (
    <>
      <PageHeader
        title={user?.role === 'LICENCIE_USER' ? 'Mes clients' : 'Clients & dossiers'}
        subtitle={user?.role === 'LICENCIE_USER' ? 'Les dossiers qui vous sont affectés.' : 'Un dossier par organisation accompagnée vers la certification ISO 9001:2026.'}
        actions={
          canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Nouveau dossier
            </Button>
          )
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Client, référence, ville…" className="w-full sm:w-64" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Statut" className="w-36">
          <option value="">Tous statuts</option>
          <option value="ACTIF">Actifs</option>
          <option value="EN_PAUSE">En pause</option>
          <option value="CLOTURE">Clôturés</option>
        </Select>
        <Select value={phase} onChange={(e) => setPhase(e.target.value)} aria-label="Phase" className="w-40">
          <option value="">Toutes phases</option>
          {PHASE_TITLES.map((t, i) => (
            <option key={t} value={i + 1}>
              Phase {i + 1}
            </option>
          ))}
        </Select>
        {user?.role === 'LICENCIE_ADMIN' && (
          <Select value={consultant} onChange={(e) => setConsultant(e.target.value)} aria-label="Intervenant" className="w-44">
            <option value="">Tous intervenants</option>
            {consultants.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        )}
        <FilterChip active={late} onClick={() => setLate((v) => !v)}>
          En retard
        </FilterChip>
        <FilterChip active={outdated} onClick={() => setOutdated((v) => !v)}>
          Socle à mettre à jour
        </FilterChip>
        <Segmented
          className="ml-auto"
          label="Affichage"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'cards', label: 'Cartes', icon: <LayoutGrid /> },
            { value: 'table', label: 'Tableau', icon: <Rows3 /> },
            { value: 'kanban', label: 'Par phase', icon: <Columns3 /> },
          ]}
        />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !isLoading && rows.length === 0 ? (
        <EmptyState
          title={data?.length ? 'Aucun dossier ne correspond' : 'Aucun dossier pour le moment'}
          description={data?.length ? 'Modifiez les filtres.' : canCreate ? 'Créez un dossier pour chaque organisation accompagnée : analyse d’écart, plan en 6 phases, documents et formations sont prêts immédiatement.' : 'Votre administrateur ne vous a encore affecté aucun dossier.'}
          action={canCreate && !data?.length ? <Button onClick={() => setCreateOpen(true)}><Plus /> Créer un dossier</Button> : undefined}
        />
      ) : view === 'table' ? (
        <DataTable
          caption="Dossiers clients"
          rows={rows}
          loading={isLoading}
          getRowId={(s) => s.dossier.id}
          onRowClick={open}
          initialSort={{ id: 'progress', desc: true }}
          columns={[
            { id: 'client', header: 'Client', primary: true, sortValue: (s) => s.dossier.clientName, cell: (s) => <div><p className="font-semibold text-ink">{s.dossier.clientName}</p><p className="text-[12.5px] text-muted">{s.dossier.secteur} · {s.dossier.ville}</p></div> },
            { id: 'ref', header: 'Réf.', hideOnMobile: true, cell: (s) => <RefCode value={s.dossier.ref} /> },
            { id: 'progress', header: 'Avancement', sortValue: (s) => s.progress.overall, cell: (s) => <ScoreBar value={s.progress.overall} className="w-36" /> },
            { id: 'cov', header: 'Couverture', align: 'right', sortValue: (s) => s.coverage.coverage, cell: (s) => <span className="font-mono">{s.coverage.coverage} %</span> },
            { id: 'phase', header: 'Phase', sortValue: (s) => s.currentPhase, cell: (s) => <span className="text-[13px]">{s.currentPhase}/6</span> },
            { id: 'team', header: 'Équipe', cell: (s) => <AvatarStack names={s.team.map((t) => t.name)} size="xs" /> },
            { id: 'audit', header: 'Audit visé', sortValue: (s) => s.dossier.targetAuditDate, cell: (s) => date(s.dossier.targetAuditDate) },
            { id: 'st', header: 'Statut', cell: (s) => <StatusBadge status={s.dossier.status} /> },
            { id: 'menu', header: <span className="sr-only">Actions</span>, hideOnMobile: true, cell: menu },
          ]}
        />
      ) : view === 'kanban' ? (
        <div className="grid gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
          {PHASE_TITLES.map((t, i) => {
            const list = rows.filter((s) => s.currentPhase === i + 1)
            return (
              <section key={t} className="flex min-h-40 flex-col rounded-lg border border-line bg-panel/60 p-2">
                <h3 className="px-2 pt-1 pb-2 text-[12.5px] font-bold text-ink">
                  <span className="font-mono text-accent">{i + 1}</span> {t} <span className="font-mono font-normal text-muted">· {list.length}</span>
                </h3>
                <ul className="flex flex-col gap-2">
                  {list.map((s) => (
                    <li key={s.dossier.id}>
                      <button type="button" onClick={() => open(s)} className="w-full rounded-md border border-line bg-surface p-3 text-left shadow-xs hover:shadow-card">
                        <p className="text-[13px] font-semibold text-ink">{s.dossier.clientName}</p>
                        <ScoreBar value={s.progress.overall} className="mt-2" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(isLoading ? [] : rows).map((s) => {
            const auditIn = daysUntil(s.dossier.targetAuditDate)
            return (
              <li key={s.dossier.id}>
                <Card className="group relative flex h-full flex-col p-5 transition-[border-color,box-shadow] hover:border-accent/40 hover:shadow-pop">
                  <div className="flex items-start gap-4">
                    <CoverageRing value={s.coverage.coverage} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/app/dossiers/${s.dossier.id}/vue-ensemble`} className="block truncate font-bold text-ink after:absolute after:inset-0 hover:underline">
                        {s.dossier.clientName}
                      </Link>
                      <p className="truncate text-[12.5px] text-muted">
                        {s.dossier.secteur} · {s.dossier.ville}
                      </p>
                    </div>
                    <div className="relative z-[1]">{menu(s)}</div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
                      <span className="text-muted">
                        Phase {s.currentPhase} · {PHASE_TITLES[s.currentPhase - 1]}
                      </span>
                      <span className="font-mono text-ink">{s.progress.overall} %</span>
                    </div>
                    <PhaseRail variant="mini" phases={s.phases} current={s.currentPhase} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    <AvatarStack names={s.team.map((t) => t.name)} size="xs" />
                    <span className={cn('ml-auto inline-flex items-center gap-1 text-[12px]', auditIn < 60 ? 'text-danger' : 'text-muted')}>
                      <CalendarClock className="size-3.5" /> {date(s.dossier.targetAuditDate)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <RefCode value={s.dossier.ref} />
                    {s.hasNewerVersion ? <Badge tone="warning">Socle {s.version.number} → {latest.number}</Badge> : <Badge>Socle {s.version.number}</Badge>}
                    {s.lateTasks > 0 && <Badge tone="danger">{s.lateTasks} en retard</Badge>}
                    {s.dossier.status !== 'ACTIF' && <StatusBadge status={s.dossier.status} />}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <CreateDossierDialog open={createOpen} onOpenChange={setCreateOpen} />
      {assignFor && <AssignDialog open onOpenChange={(o) => !o && setAssignFor(null)} dossierId={assignFor.dossier.id} clientName={assignFor.dossier.clientName} assigned={assignFor.dossier.assignedUserIds} />}
      <ConfirmDialog
        open={!!closeFor}
        onOpenChange={(o) => !o && setCloseFor(null)}
        title={`Clôturer le dossier ${closeFor?.dossier.clientName ?? ''} ?`}
        impact="Le dossier passe en lecture seule et sort des indicateurs actifs. Il reste consultable et son rapport reste téléchargeable."
        confirmLabel="Clôturer le dossier"
        destructive
        confirmText={closeFor?.dossier.clientName}
        loading={statusMut.isPending}
        onConfirm={() => closeFor && statusMut.mutate({ id: closeFor.dossier.id, s: 'CLOTURE' })}
      />
    </>
  )
}
