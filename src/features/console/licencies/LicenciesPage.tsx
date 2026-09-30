import { Download, FileInput, LayoutGrid, Lock, LogIn, MoreHorizontal, Plus, RefreshCw, Rows3, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useLicencies } from '@/hooks/queries'
import { date, money } from '@/lib/format'
import { SEGMENT_LABELS, STATUS_META } from '@/lib/labels'
import { cn, downloadText, toCsv } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import type { LicencieRow } from '@/services/licencies.service'
import type { LicenceStatus, Segment } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Segmented, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/controls'
import { Card } from '@/components/ui/display'
import { Select } from '@/components/ui/form'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger, Tooltip } from '@/components/ui/overlays'
import { DataTable, type Column } from '@/components/common/DataTable'
import { TenantMark } from '@/components/common/Logo'
import { FilterChip } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Money, RefCode, Stamp, StatusBadge } from '@/components/common/registre'
import { matches, SearchInput } from '@/components/common/SearchInput'
import { EmptyState, ErrorState } from '@/components/common/states'
import { ImportDialog } from '../import/ImportDialog'
import { useReminderDialog } from '../redevances/dialogs'
import { CreateLicencieDialog, StatusDialog } from './dialogs'

type Tab = 'ALL' | LicenceStatus

export function LicenciesPage() {
  const { data, isLoading, error, refetch } = useLicencies()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('ALL')
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment | ''>('')
  const [pays, setPays] = useState('')
  const [onlyAlerts, setOnlyAlerts] = useState(false)
  const [onlyExclu, setOnlyExclu] = useState(false)
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [statusFor, setStatusFor] = useState<LicencieRow | null>(null)
  const reminder = useReminderDialog()

  useEffect(() => {
    if (params.get('nouveau')) {
      setCreateOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (l) =>
          (tab === 'ALL' || l.status === tab) &&
          (!segment || l.segment === segment) &&
          (!pays || l.pays === pays) &&
          (!onlyExclu || l.exclusivite) &&
          (!onlyAlerts || l.retard > 0 || (l.habilitationAlert && l.habilitationAlert !== 'OK')) &&
          matches(query, l.raisonSociale, l.ref, l.branding.nomCommercial, l.territoire),
      ),
    [data, tab, segment, pays, onlyAlerts, onlyExclu, query],
  )
  const count = (s: Tab) => (data ?? []).filter((l) => s === 'ALL' || l.status === s).length
  const countries = [...new Set((data ?? []).map((l) => l.pays))].sort()

  const exportCsv = (list: LicencieRow[]) =>
    downloadText(
      'registre-licencies.csv',
      toCsv(list.map((l) => ({ Référence: l.ref, 'Raison sociale': l.raisonSociale, Segment: SEGMENT_LABELS[l.segment], Territoire: l.territoire, Pays: l.pays, Exclusivité: l.exclusivite ? 'Oui' : 'Non', Statut: STATUS_META[l.status].label, 'Dossiers actifs': l.indicators.dossiersActifs, 'Solde (FCFA)': l.solde }))),
    )

  const impersonate = async (l: LicencieRow) => {
    await authService.impersonate(l.id)
    qc.clear()
    navigate('/app')
  }

  const actions = (l: LicencieRow) => (
    <DropdownMenu>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${l.raisonSociale}`} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownTrigger>
      <DropdownContent onClick={(e) => e.stopPropagation()}>
        <DropdownItem onSelect={() => navigate(`/console/licencies/${l.id}`)}>Ouvrir la fiche</DropdownItem>
        <DropdownItem onSelect={() => setStatusFor(l)}>
          <ShieldCheck /> Changer le statut
        </DropdownItem>
        <DropdownItem onSelect={() => reminder.open([l.id])} disabled={l.solde === 0}>
          <RefreshCw /> Relancer
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onSelect={() => impersonate(l)} disabled={l.status === 'SUSPENDU'}>
          <LogIn /> Se connecter en tant que
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  )

  const columns: Column<LicencieRow>[] = [
    { id: 'ref', header: 'Réf.', cell: (l) => <RefCode value={l.ref} />, sortValue: (l) => l.ref, hideOnMobile: true },
    {
      id: 'nom',
      header: 'Licencié',
      primary: true,
      sortValue: (l) => l.raisonSociale,
      cell: (l) => (
        <div className="flex items-center gap-3">
          <TenantMark branding={l.branding} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{l.raisonSociale}</p>
            <p className="truncate text-[12.5px] text-muted">{l.branding.nomCommercial}</p>
          </div>
        </div>
      ),
    },
    { id: 'segment', header: 'Segment', cell: (l) => SEGMENT_LABELS[l.segment], sortValue: (l) => l.segment },
    {
      id: 'territoire',
      header: 'Territoire',
      sortValue: (l) => l.territoire,
      cell: (l) => (
        <span className="inline-flex items-center gap-1.5">
          {l.territoire}
          {l.exclusivite && (
            <Tooltip content="Exclusivité territoriale">
              <Lock className="size-3.5 text-brand-600" aria-label="Exclusivité" />
            </Tooltip>
          )}
        </span>
      ),
    },
    { id: 'statut', header: 'Statut', cell: (l) => <StatusBadge status={l.status} />, sortValue: (l) => l.status },
    { id: 'dossiers', header: 'Dossiers', align: 'right', cell: (l) => <span className="font-mono tabular">{l.indicators.dossiersActifs}</span>, sortValue: (l) => l.indicators.dossiersActifs },
    {
      id: 'solde',
      header: 'Solde',
      align: 'right',
      sortValue: (l) => l.solde,
      cell: (l) => (l.solde === 0 ? <span className="text-[12.5px] text-success">À jour</span> : <Money value={l.solde} tone={l.retard ? 'danger' : undefined} className="text-[13px]" />),
    },
    {
      id: 'habilitation',
      header: 'Habilitation',
      sortValue: (l) => l.habilitationExpire ?? '',
      cell: (l) =>
        l.habilitationExpire ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-[13px]">{date(l.habilitationExpire)}</span>
            {l.habilitationAlert && l.habilitationAlert !== 'OK' && <StatusBadge status={l.habilitationAlert} />}
          </span>
        ) : (
          <span className="text-[12.5px] text-muted">—</span>
        ),
    },
    { id: 'actions', header: <span className="sr-only">Actions</span>, cell: actions, hideOnMobile: true, className: 'w-12' },
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', to: '/console' }, { label: 'Licenciés' }]}
        title="Registre des licenciés"
        subtitle={`${data?.length ?? '…'} licenciés dans le réseau StandSet.`}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileInput /> Importer (JSON)
            </Button>
            <Button variant="outline" onClick={() => exportCsv(rows)}>
              <Download /> Exporter CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Nouveau licencié
            </Button>
          </>
        }
      />

      <TabsRoot value={tab} onValueChange={(t) => setTab(t as Tab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="ALL" count={count('ALL')}>
            Tous
          </TabsTrigger>
          <TabsTrigger value="HABILITE" count={count('HABILITE')}>
            Habilités
          </TabsTrigger>
          <TabsTrigger value="EN_ATTENTE" count={count('EN_ATTENTE')}>
            En attente
          </TabsTrigger>
          <TabsTrigger value="SUSPENDU" count={count('SUSPENDU')}>
            Suspendus
          </TabsTrigger>
        </TabsList>
      </TabsRoot>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Raison sociale, référence, ville…" className="w-full sm:w-72" />
        <Select value={segment} onChange={(e) => setSegment(e.target.value as Segment | '')} aria-label="Segment" className="w-44">
          <option value="">Tous les segments</option>
          {(Object.keys(SEGMENT_LABELS) as Segment[]).map((s) => (
            <option key={s} value={s}>
              {SEGMENT_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select value={pays} onChange={(e) => setPays(e.target.value)} aria-label="Pays" className="w-44">
          <option value="">Tous les pays</option>
          {countries.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Select>
        <FilterChip active={onlyExclu} onClick={() => setOnlyExclu((v) => !v)}>
          <Lock className="size-3.5" /> Exclusivité
        </FilterChip>
        <FilterChip active={onlyAlerts} onClick={() => setOnlyAlerts((v) => !v)}>
          Avec alerte
        </FilterChip>
        <Segmented
          className="ml-auto"
          label="Affichage"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'table', label: 'Tableau', icon: <Rows3 /> },
            { value: 'cards', label: 'Fiches', icon: <LayoutGrid /> },
          ]}
        />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : view === 'table' ? (
        <DataTable
          caption="Registre des licenciés"
          columns={columns}
          rows={rows}
          loading={isLoading}
          getRowId={(l) => l.id}
          onRowClick={(l) => navigate(`/console/licencies/${l.id}`)}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          initialSort={{ id: 'ref' }}
          bulkActions={
            <>
              <Button size="sm" variant="outline" onClick={() => reminder.open([...selected])}>
                <RefreshCw /> Relancer
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportCsv(rows.filter((r) => selected.has(r.id)))}>
                <Download /> Exporter
              </Button>
            </>
          }
          empty={
            <EmptyState
              title="Aucun licencié ne correspond"
              description="Modifiez la recherche ou les filtres. Le registre contient les cabinets, organismes de formation et institutions du réseau."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setSegment('')
                    setPays('')
                    setOnlyAlerts(false)
                    setOnlyExclu(false)
                    setTab('ALL')
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              }
            />
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((l) => (
            <li key={l.id}>
              <Card className="relative flex h-full cursor-pointer flex-col p-5 transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-pop" onClick={() => navigate(`/console/licencies/${l.id}`)}>
                <div className="flex items-start justify-between gap-3">
                  <TenantMark branding={l.branding} size="md" />
                  {(l.status === 'HABILITE' || l.status === 'SUSPENDU' || l.status === 'EN_ATTENTE') && <Stamp status={l.status} />}
                </div>
                <p className="mt-3 font-bold text-ink">{l.raisonSociale}</p>
                <p className="text-[12.5px] text-muted">
                  <RefCode value={l.ref} className="mr-1.5" />
                  {SEGMENT_LABELS[l.segment]} · {l.territoire}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12.5px]">
                  <div>
                    <dt className="text-muted">Dossiers actifs</dt>
                    <dd className="font-mono text-[15px] text-ink tabular">{l.indicators.dossiersActifs}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Solde</dt>
                    <dd className={cn('font-mono text-[13px] tabular', l.retard ? 'text-danger' : 'text-ink')}>{l.solde ? money(l.solde) : 'À jour'}</dd>
                  </div>
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <CreateLicencieDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      {statusFor && <StatusDialog open={!!statusFor} onOpenChange={(o) => !o && setStatusFor(null)} licencie={statusFor} />}
      {reminder.element}
    </>
  )
}
