import { Download, Mail, Plus, RefreshCw, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { qk, useAppMutation, useLedger, useLicencies, usePayments, useReminders, useSettings } from '@/hooks/queries'
import { ledgerTotals, ROYALTY_LABELS, type LedgerLine } from '@/lib/calculations/royalties'
import { date, money, moneyShort, monthLabel } from '@/lib/format'
import { STATUS_META } from '@/lib/labels'
import { royaltiesService } from '@/services/royalties.service'
import { Button } from '@/components/ui/button'
import { Switch, TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/controls'
import { Badge, Card } from '@/components/ui/display'
import { Select } from '@/components/ui/form'
import { axisProps, CHART_COLORS, ChartTooltip } from '@/components/common/charts'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ExportCsvDialog } from '@/components/common/ExportCsvDialog'
import { KpiCard } from '@/components/common/KpiCard'
import { FilterChip } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Money, StatusBadge } from '@/components/common/registre'
import { EmptyState } from '@/components/common/states'
import { RecordPaymentDialog, useReminderDialog } from './dialogs'

export function JournalPage() {
  const { data: ledger = [], isLoading } = useLedger()
  const { data: payments = [] } = usePayments()
  const { data: reminders = [] } = useReminders()
  const { data: licencies = [] } = useLicencies()
  const { data: settings } = useSettings()
  const [params, setParams] = useSearchParams()
  const [paymentFor, setPaymentFor] = useState<string | null | undefined>(undefined)
  const [exportOpen, setExportOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [lic, setLic] = useState('')
  const [month, setMonth] = useState<string | null>(null)
  const reminder = useReminderDialog()
  const autoMut = useAppMutation(royaltiesService.setAutoReminders, { invalidate: [qk.settings], success: (on) => (on ? 'Relances automatiques activées' : 'Relances automatiques désactivées') })

  useEffect(() => {
    if (params.get('encaissement')) {
      setPaymentFor(null)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const name = (id: string) => licencies.find((l) => l.id === id)?.raisonSociale ?? id
  const year = new Date().getFullYear().toString()
  const totals = ledgerTotals(ledger.filter((l) => l.dueDate.startsWith(year)))
  const lateLic = new Set(ledger.filter((l) => l.status === 'EN_RETARD').map((l) => l.licencieId)).size

  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return {
        key,
        date: d.toISOString(),
        du: ledger.filter((l) => l.dueDate.startsWith(key)).reduce((a, l) => a + l.montantDu, 0),
        encaisse: payments.filter((p) => p.date.startsWith(key)).reduce((a, p) => a + p.montant, 0),
      }
    })
  }, [ledger, payments])

  const rows = ledger.filter((l) => (!status || l.status === status) && (!lic || l.licencieId === lic) && (!month || l.dueDate.startsWith(month)))

  const columns: Column<LedgerLine>[] = [
    { id: 'lic', header: 'Licencié', primary: true, sortValue: (r) => name(r.licencieId), cell: (r) => <Link to={`/console/licencies/${r.licencieId}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-ink hover:underline">{name(r.licencieId)}</Link> },
    { id: 'type', header: 'Type', cell: (r) => <span className="text-[13px]">{ROYALTY_LABELS[r.type]}<span className="text-muted"> · {r.periode}</span></span> },
    { id: 'due', header: 'Échéance', sortValue: (r) => r.dueDate, cell: (r) => date(r.dueDate) },
    { id: 'du', header: 'Dû', align: 'right', sortValue: (r) => r.montantDu, cell: (r) => <Money value={r.montantDu} className="text-[13px]" /> },
    { id: 'paye', header: 'Encaissé', align: 'right', cell: (r) => <Money value={r.paye} tone="muted" className="text-[13px]" /> },
    { id: 'solde', header: 'Solde', align: 'right', sortValue: (r) => r.solde, cell: (r) => <Money value={r.solde} tone={r.status === 'EN_RETARD' ? 'danger' : undefined} className="text-[13px]" /> },
    { id: 'st', header: 'Statut', sortValue: (r) => r.status, cell: (r) => <span className="inline-flex items-center gap-1.5"><StatusBadge status={r.status} />{r.joursRetard > 0 && <span className="font-mono text-[11.5px] text-danger">{r.joursRetard} j</span>}</span> },
    {
      id: 'act',
      header: <span className="sr-only">Actions</span>,
      hideOnMobile: true,
      cell: (r) =>
        r.solde > 0 ? (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="ghost" onClick={() => setPaymentFor(r.licencieId)}>
              Encaisser
            </Button>
            {r.status === 'EN_RETARD' && (
              <Button size="sm" variant="ghost" onClick={() => reminder.open([r.licencieId])}>
                Relancer
              </Button>
            )}
          </div>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', to: '/console' }, { label: 'Journal des redevances' }]}
        title="Journal des redevances"
        subtitle="Échéancier, encaissements et relances de tout le réseau."
        actions={
          <>
            <Button variant="outline" onClick={() => setExportOpen(true)}>
              <Download /> Export comptable CSV
            </Button>
            <Button onClick={() => setPaymentFor(null)}>
              <Plus /> Enregistrer un encaissement
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={`Total dû ${year}`} value={totals.du} format={moneyShort} hint="FCFA" loading={isLoading} />
        <KpiCard label="Encaissé" value={totals.encaisse} format={moneyShort} hint={`${totals.du ? Math.round((totals.encaisse / totals.du) * 100) : 0} % du dû`} loading={isLoading} />
        <KpiCard label="Solde" value={totals.solde} format={moneyShort} loading={isLoading} />
        <KpiCard label="En retard" value={totals.retard} format={moneyShort} hint={`${lateLic} licenciés concernés`} loading={isLoading} className={totals.retard ? 'border-danger/30' : undefined} />
      </div>

      <Card className="mt-6 px-2 pt-4 pb-2">
        <div className="flex items-center justify-between px-3">
          <h2 className="text-[14px] font-bold">12 derniers mois</h2>
          {month && (
            <Button variant="ghost" size="sm" onClick={() => setMonth(null)}>
              Effacer le filtre « {monthLabel(month + '-01')} »
            </Button>
          )}
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} onClick={(s) => { const k = (s as { activePayload?: { payload: { key: string } }[] })?.activePayload?.[0]?.payload.key; if (k) setMonth(k === month ? null : k) }}>
              <CartesianGrid vertical={false} stroke={CHART_COLORS.line} />
              <XAxis dataKey="date" tickFormatter={monthLabel} {...axisProps} />
              <YAxis width={48} tickFormatter={(v) => moneyShort(v)} {...axisProps} />
              <RTooltip content={<ChartTooltip format={money} />} labelFormatter={(l) => `${monthLabel(String(l))} — cliquer pour filtrer`} cursor={{ fill: 'oklch(0.972 0.016 264)' }} />
              <Bar dataKey="du" name="Dû" fill={CHART_COLORS.annuelle} radius={[3, 3, 0, 0]} className="cursor-pointer" />
              <Bar dataKey="encaisse" name="Encaissé" fill={CHART_COLORS.encaisse} radius={[3, 3, 0, 0]} className="cursor-pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <TabsRoot defaultValue="echeancier" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="echeancier" count={ledger.length}>
            Échéancier
          </TabsTrigger>
          <TabsTrigger value="encaissements" count={payments.length}>
            Encaissements
          </TabsTrigger>
          <TabsTrigger value="relances" count={reminders.length}>
            Relances
          </TabsTrigger>
        </TabsList>
        <TabsContent value="echeancier">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Select value={lic} onChange={(e) => setLic(e.target.value)} aria-label="Licencié" className="w-60">
              <option value="">Tous les licenciés</option>
              {licencies.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.raisonSociale}
                </option>
              ))}
            </Select>
            {(['EN_RETARD', 'PARTIEL', 'A_VENIR', 'SOLDE'] as const).map((s) => (
              <FilterChip key={s} active={status === s} onClick={() => setStatus(status === s ? '' : s)} count={ledger.filter((l) => l.status === s).length}>
                {STATUS_META[s].label}
              </FilterChip>
            ))}
          </div>
          <DataTable
            caption="Échéancier des redevances"
            columns={columns}
            rows={rows}
            loading={isLoading}
            getRowId={(r) => r.id}
            initialSort={{ id: 'due', desc: true }}
            rowClassName={(r) => (r.status === 'EN_RETARD' ? 'bg-danger-soft/35' : undefined)}
            empty={<EmptyState title="Aucune échéance" description="Aucune échéance ne correspond à ces filtres." />}
          />
        </TabsContent>
        <TabsContent value="encaissements">
          <DataTable
            caption="Encaissements"
            rows={payments}
            getRowId={(p) => p.id}
            initialSort={{ id: 'date', desc: true }}
            columns={[
              { id: 'date', header: 'Date', sortValue: (p) => p.date, cell: (p) => date(p.date) },
              { id: 'lic', header: 'Licencié', primary: true, cell: (p) => <span className="font-semibold">{name(p.licencieId)}</span> },
              { id: 'mode', header: 'Mode', cell: (p) => ({ VIREMENT: 'Virement', MOBILE_MONEY: 'Mobile Money', CHEQUE: 'Chèque', CARTE: 'Carte' })[p.mode] },
              { id: 'ref', header: 'Référence', cell: (p) => <span className="font-mono text-[12.5px]">{p.reference}</span> },
              { id: 'm', header: 'Montant', align: 'right', sortValue: (p) => p.montant, cell: (p) => <Money value={p.montant} className="text-[13px]" /> },
            ]}
          />
        </TabsContent>
        <TabsContent value="relances" className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <DataTable
            caption="Relances"
            rows={reminders}
            getRowId={(r) => r.id}
            columns={[
              { id: 'date', header: 'Envoyée le', cell: (r) => date(r.sentAt) },
              { id: 'lic', header: 'Licencié', primary: true, cell: (r) => <span className="font-semibold">{name(r.licencieId)}</span> },
              { id: 'n', header: 'Niveau', cell: (r) => <Badge tone={r.niveau === 3 ? 'danger' : r.niveau === 2 ? 'warning' : 'neutral'}>Niveau {r.niveau}</Badge> },
              { id: 'canal', header: 'Canal', cell: () => <span className="inline-flex items-center gap-1 text-[13px]"><Mail className="size-3.5 text-muted" />Courriel</span> },
              { id: 'o', header: 'Suivi', cell: (r) => <span className="text-[13px] text-muted">{r.opened ? 'Ouverte' : 'Non ouverte'}</span> },
              { id: 'm', header: 'Montant', align: 'right', cell: (r) => <Money value={r.montant} className="text-[13px]" /> },
            ]}
            empty={<EmptyState title="Aucune relance envoyée" />}
          />
          <Card className="self-start p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-[14px] font-bold">
                <RefreshCw className="size-4 text-brand-600" /> Relances automatiques
              </h3>
              <Switch checked={settings?.autoReminders ?? false} onCheckedChange={(v) => autoMut.mutate(v)} aria-label="Relances automatiques" />
            </div>
            <ol className="mt-4 flex flex-col gap-3 text-[13px]">
              {[
                ['J+7', 'Niveau 1 — rappel courtois'],
                ['J+21', 'Niveau 2 — relance ferme'],
                ['J+45', 'Niveau 3 — mise en demeure'],
              ].map(([d, l]) => (
                <li key={d} className="flex items-center gap-3">
                  <span className="w-12 font-mono text-[12.5px] text-brand-700">{d}</span>
                  <span className="text-ink-soft">{l}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[12.5px] text-muted">Envoyées chaque matin pour les échéances dépassées et non soldées. Un modèle de courriel par niveau est modifiable dans les paramètres.</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link to="/console/parametres#courriels">
                <Wallet /> Modifier les modèles
              </Link>
            </Button>
          </Card>
        </TabsContent>
      </TabsRoot>

      <RecordPaymentDialog open={paymentFor !== undefined} onOpenChange={(o) => !o && setPaymentFor(undefined)} licencieId={paymentFor ?? undefined} />
      <ExportCsvDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export comptable des redevances"
        fileName={`redevances-${year}.csv`}
        dateKey="Échéance"
        rows={ledger.map((l) => ({ Licencié: name(l.licencieId), Type: ROYALTY_LABELS[l.type], Période: l.periode, Échéance: l.dueDate, 'Dû (FCFA)': l.montantDu, 'Encaissé (FCFA)': l.paye, 'Solde (FCFA)': l.solde, Statut: STATUS_META[l.status].label }))}
      />
      {reminder.element}
    </>
  )
}
