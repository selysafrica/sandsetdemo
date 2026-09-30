import { AlertTriangle, ArrowRight, BellRing, Building2, FolderKanban, Layers, ShieldAlert, UserCheck, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { useAdoption, useKitVersions, useLicencies, useNetworkOverview } from '@/hooks/queries'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { date, dateLong, money, moneyShort, monthLabel } from '@/lib/format'
import { SEGMENT_LABELS, STATUS_META } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge, Card, CardHeader, Progress } from '@/components/ui/display'
import { Segmented } from '@/components/ui/controls'
import { axisProps, CHART_COLORS, ChartTooltip, LegendDots } from '@/components/common/charts'
import { CoverageRing } from '@/components/common/indicators'
import { KpiCard } from '@/components/common/KpiCard'
import { PageHeader } from '@/components/common/PageHeader'
import { Money } from '@/components/common/registre'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { RecordPaymentDialog, useReminderDialog } from '../redevances/dialogs'

type Period = '3' | '6' | '12'

export function ConsoleDashboardPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useNetworkOverview()
  const { data: licencies = [] } = useLicencies()
  const { data: versions = [] } = useKitVersions()
  const { data: adoption } = useAdoption()
  const [period, setPeriod] = useState<Period>('12')
  const [paymentFor, setPaymentFor] = useState<string | null>(null)
  const reminder = useReminderDialog()

  if (isLoading) return <PageSkeleton />
  if (error || !data) return <ErrorState error={error} onRetry={() => refetch()} />

  const months = data.months.slice(-Number(period))
  const nameOf = (id: string) => licencies.find((l) => l.id === id)?.raisonSociale ?? '…'
  const latest = versions.find((v) => v.status === 'PUBLIEE')
  const latestPct = adoption && latest ? Math.round(((adoption.byVersion[latest.id] ?? 0) / Math.max(1, adoption.dossiers)) * 100) : 0
  const collected = data.totals.du ? (data.totals.encaisse / data.totals.du) * 100 : 0
  const todo = [...data.todo].sort((a, b) => (a.level === 'URGENT' ? -1 : 1) - (b.level === 'URGENT' ? -1 : 1))
  const maxSegment = Math.max(...data.segments.map((s) => s.count), 1)

  return (
    <>
      <PageHeader
        title={`Bonjour ${user?.firstName}`}
        subtitle={<span className="capitalize">{dateLong(new Date())}</span>}
        actions={
          <>
            <Segmented
              label="Période"
              size="sm"
              value={period}
              onChange={setPeriod}
              options={[
                { value: '3', label: '3 mois' },
                { value: '6', label: '6 mois' },
                { value: '12', label: '12 mois' },
              ]}
            />
            <Button onClick={() => navigate('/console/kit')}>
              <Layers /> Publier une version du Kit
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard label="Licenciés habilités" value={data.habilites} icon={<UserCheck />} to="/console/licencies" hint={`${data.enAttente} en attente · ${data.suspendus} suspendus`} />
        <KpiCard label="Dossiers actifs (réseau)" value={data.dossiersActifs} icon={<FolderKanban />} hint="Agrégat anonymisé, licenciés + entreprises" />
        <KpiCard
          label={`Redevances ${new Date().getFullYear()}`}
          value={data.totals.encaisse}
          format={moneyShort}
          icon={<Wallet />}
          to="/console/redevances/journal"
          hint={<>encaissé sur {moneyShort(data.totals.du)} FCFA dus</>}
          footer={<Progress value={collected} tone="success" label="Taux d'encaissement" />}
        />
        <KpiCard label="Alertes ouvertes" value={data.alertsCount} icon={<BellRing />} hint={`dont ${data.lateCount} licenciés en retard de paiement`} className={data.alertsCount ? 'border-danger/25' : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Redevances dues et encaissements" description="Montants par date d'échéance, en FCFA" />
            <LegendDots
              className="px-5 pb-2"
              items={[
                { label: "Droit d'entrée", color: CHART_COLORS.entree },
                { label: 'Annuelle + exclusivité', color: CHART_COLORS.annuelle },
                { label: 'Variable CA', color: CHART_COLORS.variable },
                { label: 'Forfait programme', color: CHART_COLORS.forfait },
                { label: 'Encaissé', color: CHART_COLORS.encaisse },
              ]}
            />
            <div className="h-72 px-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={months} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_COLORS.line} />
                  <XAxis dataKey="date" tickFormatter={monthLabel} {...axisProps} />
                  <YAxis tickFormatter={(v) => moneyShort(v)} width={52} {...axisProps} />
                  <RTooltip content={<ChartTooltip format={money} />} labelFormatter={(l) => monthLabel(String(l))} cursor={{ fill: 'oklch(0.972 0.016 264)' }} />
                  <Bar dataKey="entree" name="Droit d'entrée" stackId="a" fill={CHART_COLORS.entree} />
                  <Bar dataKey="annuelle" name="Annuelle + exclusivité" stackId="a" fill={CHART_COLORS.annuelle} />
                  <Bar dataKey="variable" name="Variable CA" stackId="a" fill={CHART_COLORS.variable} />
                  <Bar dataKey="forfait" name="Forfait programme" stackId="a" fill={CHART_COLORS.forfait} radius={[3, 3, 0, 0]} />
                  <Line dataKey="encaisse" name="Encaissé" type="monotone" stroke={CHART_COLORS.encaisse} strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Activité réseau" description="Données agrégées et anonymisées remontées par les tenants" />
              <div className="h-56 px-2 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={months} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gDossiers" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.annuelle} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={CHART_COLORS.annuelle} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={CHART_COLORS.line} />
                    <XAxis dataKey="date" tickFormatter={monthLabel} {...axisProps} />
                    <YAxis width={36} {...axisProps} />
                    <RTooltip content={<ChartTooltip />} labelFormatter={(l) => monthLabel(String(l))} />
                    <Area dataKey="dossiers" name="Dossiers actifs" type="monotone" stroke={CHART_COLORS.annuelle} strokeWidth={2} fill="url(#gDossiers)" />
                    <Area dataKey="sessions" name="Sessions de formation" type="monotone" stroke={CHART_COLORS.encaisse} strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <CardHeader title="Effectifs par segment" description="Licenciés actifs et dossiers déclarés" />
              <ul className="flex flex-col gap-3 px-5 pb-5">
                {data.segments.map((s) => (
                  <li key={s.segment}>
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="font-semibold text-ink">{SEGMENT_LABELS[s.segment]}</span>
                      <span className="text-muted">
                        <span className="font-mono text-ink tabular">{s.count}</span> licenciés · <span className="font-mono tabular">{s.dossiers}</span> dossiers
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${(s.count / maxSegment) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="À traiter" description={`${todo.length} points demandent une action`} />
            <ul className="divide-y divide-line border-t border-line">
              {todo.slice(0, 7).map((t, i) => {
                const icon = t.kind === 'retard' ? <Wallet /> : t.kind === 'attente' ? <Building2 /> : t.kind === 'audit' ? <AlertTriangle /> : <ShieldAlert />
                const urgent = t.level === 'URGENT' || t.level === 'EXPIREE'
                return (
                  <li key={i} className="flex items-start gap-3 px-5 py-3">
                    <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-md [&_svg]:size-4', urgent ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning')}>{icon}</span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/console/licencies/${t.licencieId}`} className="block truncate text-[13.5px] font-semibold text-ink hover:underline">
                        {nameOf(t.licencieId)}
                      </Link>
                      <p className="text-[12.5px] text-muted">
                        {t.label}
                        {t.kind === 'habilitation' && <> · expire le {date(t.date)}</>}
                        {'amount' in t && t.amount ? <> · <Money value={t.amount} tone="danger" /></> : null}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {t.kind === 'retard' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => reminder.open([t.licencieId])}>
                              Relancer
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setPaymentFor(t.licencieId)}>
                              Encaisser
                            </Button>
                          </>
                        )}
                        {t.kind === 'attente' && (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/console/licencies/${t.licencieId}`)}>
                            Examiner la demande
                          </Button>
                        )}
                        {(t.kind === 'habilitation' || t.kind === 'audit') && (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/console/licencies/${t.licencieId}?onglet=habilitations`)}>
                            Voir la fiche
                          </Button>
                        )}
                      </div>
                    </div>
                    <Badge tone={urgent ? 'danger' : 'warning'}>{STATUS_META[t.level].label}</Badge>
                  </li>
                )
              })}
            </ul>
          </Card>

          {latest && (
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <CoverageRing value={latestPct} size="md" toned={false} label="Dossiers sur la dernière version" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-muted">Version du Kit en production</p>
                  <p className="font-mono text-[22px] text-ink">{latest.number}</p>
                  <p className="text-[12.5px] text-muted">Publiée le {date(latest.publishedAt)}</p>
                </div>
              </div>
              <p className="mt-3 text-[13px] text-ink-soft">
                {latestPct} % des dossiers du réseau utilisent cette version ({adoption?.tenants} tenants, {adoption?.enterprises} entreprises notifiés).
              </p>
              <Button variant="link" className="mt-2" asChild>
                <Link to="/console/kit">
                  Gérer les versions <ArrowRight />
                </Link>
              </Button>
            </Card>
          )}

          <Card>
            <CardHeader title="Présence du réseau" description="Licenciés par pays" />
            <ul className="flex flex-col gap-2 px-5 pb-5">
              {data.countries.map((c) => (
                <li key={c.pays} className="flex items-center gap-3 text-[13px]">
                  <span className="w-28 shrink-0 truncate text-ink">{c.pays}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel">
                    <span className="block h-full rounded-full bg-brand-400" style={{ width: `${(c.count / data.countries[0].count) * 100}%` }} />
                  </span>
                  <span className="w-5 text-right font-mono text-ink-soft tabular">{c.count}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <RecordPaymentDialog open={!!paymentFor} onOpenChange={(o) => !o && setPaymentFor(null)} licencieId={paymentFor ?? undefined} />
      {reminder.element}
    </>
  )
}
