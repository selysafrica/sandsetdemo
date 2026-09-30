import { CalendarClock, Layers } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, NavLink, Outlet, useParams } from 'react-router-dom'
import { ApiError } from '@/mocks/db'
import { useDossier } from '@/hooks/queries'
import { useCurrentUser, useTenant } from '@/hooks/useCurrentUser'
import { date, daysUntil } from '@/lib/format'
import { cn } from '@/lib/utils'
import { kitService } from '@/services/kit.service'
import { useUi } from '@/stores/ui.store'
import { Badge, Skeleton } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/overlays'
import { NewVersionBanner } from '@/components/common/banners'
import { CoverageRing } from '@/components/common/indicators'
import { AvatarStack } from '@/components/common/misc'
import { Breadcrumbs } from '@/components/common/PageHeader'
import { RefCode } from '@/components/common/registre'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import type { DossierContext } from '@/features/kit/context'
import { NewVersionDialog } from '@/features/kit/dialogs/NewVersionDialog'

export function DossierLayout({ mode }: { mode: 'tenant' | 'enterprise' }) {
  const params = useParams()
  const { enterprise } = useTenant()
  const user = useCurrentUser()
  const { t } = useTranslation()
  const pushRecent = useUi((s) => s.pushRecent)
  const dossierId = mode === 'tenant' ? params.dossierId! : (enterprise?.dossierId ?? '')
  const base = mode === 'tenant' ? `/app/dossiers/${dossierId}` : '/espace/dossier'
  const { data: summary, error, isLoading, refetch } = useDossier(dossierId)
  const [versionOpen, setVersionOpen] = useState(false)

  useEffect(() => {
    if (summary && mode === 'tenant') pushRecent({ label: summary.dossier.clientName, to: `${base}/vue-ensemble` })
  }, [summary, mode, base, pushRecent])

  if (error instanceof ApiError && error.status === 403) return <Navigate to="/403" replace />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  if (isLoading || !summary)
    return (
      <div>
        <Skeleton className="mb-3 h-4 w-48" />
        <Skeleton className="mb-6 h-24 w-full rounded-lg" />
        <PageSkeleton />
      </div>
    )

  const d = summary.dossier
  const tabs = [
    { to: 'vue-ensemble', label: t('dossierTabs.overview') },
    { to: 'analyse-ecart', label: t('dossierTabs.gap') },
    { to: 'plan', label: t('dossierTabs.plan') },
    { to: 'documents', label: t('dossierTabs.documents') },
    { to: 'formations', label: t('dossierTabs.trainings') },
    { to: 'rapport', label: t('dossierTabs.report') },
  ]
  const auditIn = daysUntil(d.targetAuditDate)
  const ctx: DossierContext = {
    dossierId,
    base,
    summary,
    isEnterprise: mode === 'enterprise',
    canManageTeam: user?.role === 'LICENCIE_ADMIN',
    openNewVersion: () => setVersionOpen(true),
  }

  return (
    <div>
      {mode === 'tenant' && (
        <Breadcrumbs
          crumbs={[
            { label: user?.role === 'LICENCIE_USER' ? 'Mes clients' : 'Clients & dossiers', to: '/app/dossiers' },
            { label: d.clientName },
          ]}
        />
      )}
      <section className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-lg border border-line bg-surface px-5 py-4 shadow-card print:hidden">
        <CoverageRing value={summary.coverage.coverage} size="md" label="Couverture de l'analyse d'écart" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[20px] font-bold text-ink">{mode === 'enterprise' ? 'Mon dossier de transition' : d.clientName}</h1>
            <RefCode value={d.ref} />
            {d.status !== 'ACTIF' && <Badge tone="warning">{d.status === 'EN_PAUSE' ? 'En pause' : 'Clôturé'}</Badge>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
            <span>
              {d.secteur} · {d.ville}
            </span>
            <Tooltip content={summary.hasNewerVersion ? 'Une version plus récente du socle est disponible' : 'Version du contenu socle utilisée'}>
              <button
                type="button"
                onClick={() => summary.hasNewerVersion && setVersionOpen(true)}
                className={cn('inline-flex items-center gap-1 font-medium', summary.hasNewerVersion ? 'text-warning hover:underline' : 'cursor-default text-ink-soft')}
              >
                <Layers className="size-3.5" /> Socle {summary.version.number}
              </button>
            </Tooltip>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" /> Audit visé {date(d.targetAuditDate)}
              <span className={cn('font-mono tabular', auditIn < 60 ? 'text-danger' : 'text-ink-soft')}>(J{auditIn >= 0 ? '-' : '+'}{Math.abs(auditIn)})</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-40">
            <div className="flex items-baseline justify-between text-[12.5px]">
              <span className="font-semibold text-ink-soft">Avancement global</span>
              <span className="font-mono text-ink tabular">{summary.progress.overall} %</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel">
              <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${summary.progress.overall}%` }} />
            </div>
            <p className="mt-1 text-[12px] text-muted">Phase {summary.currentPhase} sur 6</p>
          </div>
          {mode === 'tenant' && <AvatarStack names={summary.team.map((m) => m.name)} />}
        </div>
      </section>

      {summary.hasNewerVersion && (
        <NewVersionBanner className="mb-5 print:hidden" onAction={() => setVersionOpen(true)}>
          <strong>La version {kitService.latest().number} du socle est disponible.</strong> Ce dossier utilise la version {summary.version.number}. Vos évaluations existantes ne seront pas modifiées.
        </NewVersionBanner>
      )}

      <nav aria-label="Modules du dossier" className="sticky top-14 z-[var(--z-sticky)] -mx-4 mb-6 border-b border-line bg-canvas/95 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 print:hidden">
        <ul className="flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    'relative -mb-px flex h-11 shrink-0 items-center border-b-2 px-3 text-[13.5px] font-semibold whitespace-nowrap transition-colors',
                    isActive ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
                  )
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Suspense fallback={<PageSkeleton />}>
        <Outlet context={ctx} />
      </Suspense>
      <NewVersionDialog open={versionOpen} onOpenChange={setVersionOpen} dossierId={dossierId} />
    </div>
  )
}
