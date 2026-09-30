import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Check, ClipboardPlus, ExternalLink, EyeOff, Globe, LogIn, Plus, RefreshCw, ShieldCheck, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { useQueryClient } from '@tanstack/react-query'
import { useGrid, useHabilitations, useLedger, useLicencie, useLicencieHistory, usePayments, useReminders } from '@/hooks/queries'
import { alertDate, habilitationAlert } from '@/lib/calculations/alerts'
import { computeBreakdown, ledgerTotals, ROYALTY_LABELS } from '@/lib/calculations/royalties'
import { date, dateTime, money, moneyShort, num } from '@/lib/format'
import { SEGMENT_LABELS, STATUS_META } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { kitService } from '@/services/kit.service'
import { licenciesService } from '@/services/licencies.service'
import type { LicenceStatus } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/controls'
import { Badge, Card, CardHeader } from '@/components/ui/display'
import { InfoNote } from '@/components/common/banners'
import { axisProps, CHART_COLORS, ChartTooltip } from '@/components/common/charts'
import { DataTable } from '@/components/common/DataTable'
import { KpiCard } from '@/components/common/KpiCard'
import { TenantMark } from '@/components/common/Logo'
import { Timeline } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { DottedLeader, Money, RefCode, SectionTitle, Stamp, StatusBadge } from '@/components/common/registre'
import { ErrorState, PageSkeleton } from '@/components/common/states'
import { AuditSheet, HabilitationDialog } from '../habilitations/dialogs'
import { RecordPaymentDialog, useReminderDialog } from '../redevances/dialogs'
import { StatusDialog } from './dialogs'

const LIFECYCLE: LicenceStatus[] = ['EN_ATTENTE', 'HABILITE', 'SUSPENDU']

export function LicencieDetailPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: l, isLoading, error, refetch } = useLicencie(id)
  const { data: grid } = useGrid()
  const { data: ledger = [] } = useLedger(id)
  const { data: payments = [] } = usePayments(id)
  const { data: reminders = [] } = useReminders(id)
  const { data: habs } = useHabilitations(id)
  const { data: history = [] } = useLicencieHistory(id)
  const [statusOpen, setStatusOpen] = useState<{ status?: LicenceStatus; motif?: string } | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [habOpen, setHabOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const reminder = useReminderDialog()
  const tab = params.get('onglet') ?? 'synthese'

  if (isLoading) return <PageSkeleton />
  if (error || !l) return <ErrorState error={error} onRetry={() => refetch()} />

  const b = grid ? computeBreakdown(grid, { segment: l.segment, exclusivite: l.exclusivite, caSessions: l.indicators.caSessionsDeclare }) : null
  const totals = ledgerTotals(ledger)
  const series = licenciesService.indicatorSeries(id)
  const version = kitService.versionSync(l.kitVersionId)
  const majorAudit = habs?.audits.find((a) => a.resultat === 'ECART_MAJEUR')
  const statusIdx = LIFECYCLE.indexOf(l.status)

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Console', to: '/console' },
          { label: 'Licenciés', to: '/console/licencies' },
          { label: l.raisonSociale },
        ]}
        title={
          <span className="flex items-center gap-3">
            <TenantMark branding={l.branding} size="md" />
            {l.raisonSociale}
          </span>
        }
        meta={
          <>
            <RefCode value={l.ref} />
            <span className="text-[13px] text-muted">
              {SEGMENT_LABELS[l.segment]} · {l.territoire}, {l.pays} · entré le {date(l.dateEntree)}
            </span>
            {l.exclusivite && <Badge tone="brand">Exclusivité territoriale</Badge>}
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setStatusOpen({})}>
              <ShieldCheck /> Changer le statut
            </Button>
            <Button variant="outline" onClick={() => reminder.open([l.id])} disabled={!totals.solde}>
              <RefreshCw /> Relancer
            </Button>
            <Button onClick={() => setPaymentOpen(true)}>
              <Wallet /> Enregistrer un encaissement
            </Button>
          </>
        }
      />

      <Card className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4">
        {(l.status === 'HABILITE' || l.status === 'SUSPENDU' || l.status === 'EN_ATTENTE') && <Stamp status={l.status} />}
        <ol className="flex min-w-0 flex-1 items-center gap-2" aria-label="Cycle de statut">
          {LIFECYCLE.map((s, i) => {
            const entry = [...l.statusHistory].reverse().find((h) => h.status === s)
            const reached = i <= statusIdx
            return (
              <li key={s} className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full border text-[11px]',
                    reached ? (s === 'SUSPENDU' ? 'border-danger bg-danger text-white' : 'border-accent bg-accent text-accent-fg') : 'border-line-strong text-muted',
                  )}
                >
                  {reached ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-[13px] font-semibold', reached ? 'text-ink' : 'text-muted')}>{STATUS_META[s].label}</span>
                  <span className="block truncate text-[11.5px] text-muted">{entry ? `${date(entry.at)}${entry.motif ? ` · ${entry.motif}` : ''}` : '—'}</span>
                </span>
                {i < LIFECYCLE.length - 1 && <span className={cn('h-px min-w-6 flex-1', i < statusIdx ? 'bg-accent' : 'bg-line-strong')} />}
              </li>
            )
          })}
        </ol>
      </Card>

      <TabsRoot value={tab} onValueChange={(t) => setParams({ onglet: t }, { replace: true })}>
        <TabsList className="mb-6">
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          <TabsTrigger value="redevances">Redevances</TabsTrigger>
          <TabsTrigger value="habilitations" count={habs ? habs.habilitations.length + habs.audits.length : undefined}>
            Habilitations & audits
          </TabsTrigger>
          <TabsTrigger value="instance">Instance</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="synthese" className="flex flex-col gap-6">
          <InfoNote icon={<EyeOff />}>
            <strong className="text-ink">Indicateurs agrégés.</strong> Seuls ces chiffres remontent de l'instance du licencié. Aucune donnée client (analyses d'écart, documents) n'est accessible depuis la Console.
          </InfoNote>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Dossiers actifs" value={l.indicators.dossiersActifs} />
            <KpiCard label="Sessions de formation" value={l.indicators.sessionsFormation} />
            <KpiCard label="CA sessions déclaré" value={l.indicators.caSessionsDeclare} format={moneyShort} hint="FCFA, 12 derniers mois" />
            <KpiCard label="Dossiers sur la dernière version" value={l.indicators.pctDerniereVersion} format={(v) => `${Math.round(v)} %`} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title="Évolution des agrégats" description="12 derniers mois" />
              <div className="h-60 px-2 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={CHART_COLORS.line} />
                    <XAxis dataKey="month" tickFormatter={(m) => `M${m + 1}`} {...axisProps} />
                    <YAxis width={32} {...axisProps} />
                    <RTooltip content={<ChartTooltip />} labelFormatter={(m) => `Mois ${Number(m) + 1}`} cursor={{ fill: 'oklch(0.972 0.016 264)' }} />
                    <Bar dataKey="dossiers" name="Dossiers actifs" fill={CHART_COLORS.annuelle} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="sessions" name="Sessions" fill={CHART_COLORS.encaisse} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-5">
              <SectionTitle>Informations administratives</SectionTitle>
              <div className="mt-2">
                <DottedLeader label="Raison sociale" value={l.raisonSociale} />
                <DottedLeader label="Nom commercial" value={l.branding.nomCommercial} />
                <DottedLeader label="Segment" value={SEGMENT_LABELS[l.segment]} />
                <DottedLeader label="Territoire" value={`${l.territoire}, ${l.pays}`} />
                <DottedLeader label="Contact" value={l.contactName} />
                <DottedLeader label="Courriel" value={<a className="text-brand-700 hover:underline" href={`mailto:${l.contactEmail}`}>{l.contactEmail}</a>} />
                <DottedLeader label="Téléphone" value={<span className="font-mono text-[13px]">{l.contactPhone}</span>} />
                <DottedLeader label="Dernière activité" value={dateTime(l.lastActivityAt)} />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="redevances" className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            {b && grid && (
              <Card className="p-5">
                <SectionTitle>Décomposition annuelle (T = {money(grid.T)})</SectionTitle>
                <div className="mt-2">
                  <DottedLeader label={`Droit d'entrée (${grid.entryFeeCoef[l.segment]} × T)`} value={<Money value={b.droitEntree} />} />
                  <DottedLeader label={`Redevance annuelle (${grid.annualFixedCoef} × T)`} value={<Money value={b.annuelle} />} />
                  {l.exclusivite && <DottedLeader label={`Majoration exclusivité (+${grid.exclusivityMarkupPct} %)`} value={<Money value={b.majoration} />} />}
                  <DottedLeader label={`Variable (${grid.caFormationPct} % × ${moneyShort(l.indicators.caSessionsDeclare)})`} value={<Money value={b.variable} />} />
                  <DottedLeader label={`Forfait programme (${grid.programmeForfaitCoef} × T)`} value={<Money value={b.forfait} />} />
                  <DottedLeader label="Total annuel récurrent" value={<Money value={b.anneesSuivantes} />} strong className="mt-1 border-t border-line pt-2" />
                </div>
              </Card>
            )}
            <div className="grid grid-cols-2 gap-3 self-start lg:grid-cols-4">
              <KpiCard label="Total dû" value={totals.du} format={moneyShort} />
              <KpiCard label="Encaissé" value={totals.encaisse} format={moneyShort} />
              <KpiCard label="Solde" value={totals.solde} format={moneyShort} />
              <KpiCard label="En retard" value={totals.retard} format={moneyShort} className={totals.retard ? 'border-danger/30' : undefined} />
            </div>
          </div>
          <Card>
            <CardHeader title="Échéancier" />
            <div className="px-5 pb-5">
              <DataTable
                caption="Échéancier du licencié"
                dense
                rows={ledger}
                getRowId={(r) => r.id}
                pageSize={8}
                columns={[
                  { id: 'due', header: 'Échéance', cell: (r) => date(r.dueDate), sortValue: (r) => r.dueDate },
                  { id: 'type', header: 'Type', primary: true, cell: (r) => `${ROYALTY_LABELS[r.type]} · ${r.periode}` },
                  { id: 'du', header: 'Dû', align: 'right', cell: (r) => <Money value={r.montantDu} /> },
                  { id: 'paye', header: 'Encaissé', align: 'right', cell: (r) => <Money value={r.paye} tone="muted" /> },
                  { id: 'solde', header: 'Solde', align: 'right', cell: (r) => <Money value={r.solde} tone={r.status === 'EN_RETARD' ? 'danger' : undefined} /> },
                  { id: 'st', header: 'Statut', cell: (r) => <span className="inline-flex items-center gap-2"><StatusBadge status={r.status} />{r.joursRetard > 0 && <span className="font-mono text-[11.5px] text-danger">+{r.joursRetard} j</span>}</span> },
                ]}
              />
            </div>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Encaissements" />
              <ul className="divide-y divide-line border-t border-line">
                {payments.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
                    <span>
                      {date(p.date)} · <span className="text-muted">{p.mode === 'MOBILE_MONEY' ? 'Mobile Money' : p.mode.charAt(0) + p.mode.slice(1).toLowerCase()}</span> · <span className="font-mono text-[12px] text-muted">{p.reference}</span>
                    </span>
                    <Money value={p.montant} />
                  </li>
                ))}
                {!payments.length && <li className="px-5 py-6 text-center text-[13px] text-muted">Aucun encaissement.</li>}
              </ul>
            </Card>
            <Card>
              <CardHeader title="Relances envoyées" />
              <ul className="divide-y divide-line border-t border-line">
                {reminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
                    <span className="inline-flex items-center gap-2">
                      <Badge tone={r.niveau === 3 ? 'danger' : r.niveau === 2 ? 'warning' : 'neutral'}>Niveau {r.niveau}</Badge>
                      {date(r.sentAt)}
                      <span className="text-muted">{r.opened ? '· ouverte' : '· non ouverte'}</span>
                    </span>
                    <Money value={r.montant} />
                  </li>
                ))}
                {!reminders.length && <li className="px-5 py-6 text-center text-[13px] text-muted">Aucune relance.</li>}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="habilitations" className="flex flex-col gap-6">
          {majorAudit && l.status !== 'SUSPENDU' && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3" role="alert">
              <p className="min-w-0 flex-1 text-[13.5px] text-ink">
                <strong className="text-danger">Écart majeur constaté le {date(majorAudit.date)}.</strong> {majorAudit.constats[0]}
              </p>
              <Button variant="danger" size="sm" onClick={() => setStatusOpen({ status: 'SUSPENDU', motif: "Écart majeur d'audit" })}>
                Proposer une suspension
              </Button>
            </div>
          )}
          <Card>
            <CardHeader
              title="Habilitations"
              description="Alerte automatique 12 mois avant expiration"
              action={
                <Button size="sm" variant="outline" onClick={() => setHabOpen(true)}>
                  <Plus /> Ajouter
                </Button>
              }
            />
            <ul className="divide-y divide-line border-t border-line">
              {habs?.habilitations.map((h) => {
                const level = habilitationAlert(h)
                const total = differenceInCalendarDays(parseISO(h.expireLe), parseISO(h.delivreeLe))
                const elapsed = Math.min(total, Math.max(0, differenceInCalendarDays(new Date(), parseISO(h.delivreeLe))))
                const alertAt = differenceInCalendarDays(alertDate(h.expireLe), parseISO(h.delivreeLe))
                return (
                  <li key={h.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-ink">{h.intitule}</p>
                      <StatusBadge status={level} />
                    </div>
                    <p className="text-[12.5px] text-muted">
                      Délivrée le {date(h.delivreeLe)} par {h.auditeur} · expire le {date(h.expireLe)}
                    </p>
                    <div className="relative mt-3 h-2 rounded-full bg-panel" role="img" aria-label={`Validité écoulée : ${Math.round((elapsed / total) * 100)} %`}>
                      <div className="absolute inset-y-0 rounded-r-full bg-warning-soft" style={{ left: `${(alertAt / total) * 100}%`, right: 0 }} />
                      <div className={cn('absolute inset-y-0 left-0 rounded-full', level === 'OK' ? 'bg-brand-500' : level === 'A_PLANIFIER' ? 'bg-[oklch(0.72_0.15_70)]' : 'bg-danger')} style={{ width: `${(elapsed / total) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-[11.5px] text-muted">Zone d'alerte à partir du {date(alertDate(h.expireLe))}</p>
                  </li>
                )
              })}
            </ul>
          </Card>
          <Card>
            <CardHeader
              title="Audits"
              action={
                <Button size="sm" variant="outline" onClick={() => setAuditOpen(true)}>
                  <ClipboardPlus /> Consigner un audit
                </Button>
              }
            />
            <ul className="divide-y divide-line border-t border-line">
              {habs?.audits.map((a) => (
                <li key={a.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{date(a.date)}</span>
                    <StatusBadge status={a.resultat} />
                    <span className="text-[12.5px] text-muted">par {a.auditeur}</span>
                    {a.suspensionProposee && <Badge tone="danger">Suspension proposée</Badge>}
                  </div>
                  <ul className="mt-2 list-disc pl-5 text-[13px] text-ink-soft">
                    {a.constats.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="instance">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <SectionTitle>Marque</SectionTitle>
              <div className="mt-4 flex items-center gap-4">
                <TenantMark branding={l.branding} size="lg" />
                <div>
                  <p className="text-[16px] font-bold text-ink">{l.branding.nomCommercial}</p>
                  <p className="inline-flex items-center gap-2 text-[13px] text-muted">
                    <span className="size-3 rounded-full" style={{ background: l.branding.accentColor }} aria-hidden />
                    <span className="font-mono">{l.branding.accentColor}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <DottedLeader
                  label="Domaine"
                  value={
                    l.branding.subdomain ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[13px]">
                        <Globe className="size-3.5 text-muted" />
                        {l.branding.customDomain ?? `${l.branding.subdomain}.standset.com`}
                      </span>
                    ) : (
                      'Non configuré'
                    )
                  }
                />
                <DottedLeader label="Statut DNS / HTTPS" value={<Badge tone={l.branding.domainStatus === 'ACTIF' ? 'success' : 'warning'}>{l.branding.domainStatus === 'ACTIF' ? 'Actif · certificat émis' : l.branding.domainStatus === 'EN_ATTENTE_DNS' ? 'En attente DNS' : 'Non configuré'}</Badge>} />
                <DottedLeader label="Personnalisation" value={l.onboarded ? 'Terminée' : 'À faire'} />
              </div>
            </Card>
            <Card className="p-5">
              <SectionTitle>Exploitation</SectionTitle>
              <div className="mt-2">
                <DottedLeader label="Version du Kit" value={<span className="font-mono">{version?.number}</span>} />
                <DottedLeader label="Utilisateurs" value={num(l.indicators.usersCount)} />
                <DottedLeader label="Dernière activité" value={dateTime(l.lastActivityAt)} />
              </div>
              <Button
                variant="outline"
                className="mt-5"
                disabled={l.status === 'SUSPENDU'}
                onClick={async () => {
                  await authService.impersonate(l.id)
                  qc.clear()
                  navigate('/app')
                }}
              >
                <LogIn /> Se connecter en tant que {l.branding.nomCommercial}
                <ExternalLink />
              </Button>
              <p className="mt-2 text-[12px] text-muted">Accès de support, journalisé dans le journal d'accès administrateur.</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historique">
          <Card className="p-5">
            <Timeline items={history.map((h) => ({ at: h.at, label: 'amount' in h && h.amount ? <>{h.label} — <Money value={h.amount} /></> : h.label, actor: h.actor, kind: h.kind }))} />
          </Card>
        </TabsContent>
      </TabsRoot>

      {statusOpen && <StatusDialog open onOpenChange={(o) => !o && setStatusOpen(null)} licencie={l} initialStatus={statusOpen.status} initialMotif={statusOpen.motif} />}
      <RecordPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} licencieId={l.id} />
      <HabilitationDialog open={habOpen} onOpenChange={setHabOpen} licencieId={l.id} />
      <AuditSheet open={auditOpen} onOpenChange={setAuditOpen} licencieId={l.id} onProposeSuspension={() => setStatusOpen({ status: 'SUSPENDU', motif: "Écart majeur d'audit" })} />
      {reminder.element}
    </>
  )
}
