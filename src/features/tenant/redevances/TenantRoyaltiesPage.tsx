import { Building, Download, Info } from 'lucide-react'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { useOwnLedger } from '@/hooks/queries'
import { ROYALTY_LABELS } from '@/lib/calculations/royalties'
import { date, money, moneyShort, monthLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/overlays'
import { axisProps, CHART_COLORS, ChartTooltip } from '@/components/common/charts'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { DottedLeader, Money, StatusBadge } from '@/components/common/registre'
import { PageSkeleton } from '@/components/common/states'

const HINTS: Record<string, string> = {
  droitEntree: "Versé une fois, à l'entrée dans le réseau, selon votre segment.",
  annuelle: 'Redevance fixe annuelle, due à chaque date anniversaire.',
  majoration: 'Supplément lié à votre exclusivité territoriale.',
  variable: 'Pourcentage du CA des sessions de formation que vous déclarez chaque trimestre.',
  forfait: "Forfait annuel couvrant l'accès au programme et aux mises à jour du socle.",
}

export function TenantRoyaltiesPage() {
  const { data, isLoading } = useOwnLedger()
  const months = useMemo(() => {
    if (!data) return []
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return { date: d.toISOString(), du: data.ledger.filter((l) => l.dueDate.startsWith(key)).reduce((a, l) => a + l.montantDu, 0), paye: data.payments.filter((p) => p.date.startsWith(key)).reduce((a, p) => a + p.montant, 0) }
    })
  }, [data])
  if (isLoading || !data) return <PageSkeleton />
  const { totals, breakdown: b, licencie: l } = data
  const next = data.ledger.filter((x) => x.solde > 0).sort((a, c) => a.dueDate.localeCompare(c.dueDate))[0]
  const row = (label: string, key: keyof typeof HINTS, value: number) => (
    <DottedLeader
      label={
        <span className="inline-flex items-center gap-1.5">
          {label}
          <Tooltip content={HINTS[key]}>
            <Info className="size-3.5 text-muted" aria-label={HINTS[key]} />
          </Tooltip>
        </span>
      }
      value={<Money value={value} />}
    />
  )
  return (
    <>
      <PageHeader
        title="Mes redevances"
        subtitle="Redevances dues au concessionnaire StandSet au titre de votre licence."
        actions={
          <Button variant="outline" onClick={() => toast.success('Relevé PDF généré (démo)')}>
            <Download /> Télécharger le relevé
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card className={cn('p-6', totals.retard > 0 && 'border-danger/30')}>
          <p className="text-[13px] font-semibold text-muted">Solde à régler</p>
          <p className="mt-1 font-mono text-[34px] leading-none text-ink tabular">{money(totals.solde)}</p>
          <p className="mt-3 text-[13.5px]">{totals.retard > 0 ? <span className="font-semibold text-danger">Dont {money(totals.retard)} en retard</span> : <span className="text-success">Vous êtes à jour de vos échéances échues.</span>}</p>
          {next && <p className="mt-1 text-[13px] text-muted">Prochaine échéance : {ROYALTY_LABELS[next.type]} — {money(next.solde)} le {date(next.dueDate)}</p>}
          <div className="mt-5 rounded-md bg-canvas p-4 text-[13px]">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Building className="size-4 text-accent" /> Coordonnées de paiement
            </p>
            <p className="mt-1 text-ink-soft">StandSet SAS · Banque Atlantique CI</p>
            <p className="font-mono text-[12.5px] text-ink-soft">CI93 CI042 01234 567890123456 78</p>
            <p className="mt-1 text-[12px] text-muted">Orange Money marchand : 07 00 00 00 · référence {l.ref}</p>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-[14.5px] font-bold">Décomposition annuelle</h2>
          <p className="mb-2 text-[12.5px] text-muted">Selon la grille en vigueur et votre dernière déclaration d'activité.</p>
          {row("Droit d'entrée (une fois)", 'droitEntree', b.droitEntree)}
          {row('Redevance annuelle fixe', 'annuelle', b.annuelle)}
          {l.exclusivite && row('Majoration exclusivité', 'majoration', b.majoration)}
          {row('Variable sur CA sessions', 'variable', b.variable)}
          {row('Forfait programme', 'forfait', b.forfait)}
          <DottedLeader label="Total annuel récurrent" value={<Money value={b.anneesSuivantes} />} strong className="mt-1 border-t border-line pt-2" />
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader title="12 derniers mois" description="Montants dus et paiements enregistrés" />
        <div className="h-52 px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART_COLORS.line} />
              <XAxis dataKey="date" tickFormatter={monthLabel} {...axisProps} />
              <YAxis width={44} tickFormatter={(v) => moneyShort(v)} {...axisProps} />
              <RTooltip content={<ChartTooltip format={money} />} labelFormatter={(v) => monthLabel(String(v))} cursor={{ fill: 'oklch(0.972 0.016 264)' }} />
              <Bar dataKey="du" name="Dû" fill="var(--accent)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="paye" name="Payé" fill={CHART_COLORS.encaisse} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Échéancier" />
          <div className="px-5 pb-5">
            <DataTable
              caption="Échéancier"
              dense
              rows={data.ledger}
              getRowId={(r) => r.id}
              pageSize={8}
              initialSort={{ id: 'due', desc: true }}
              columns={[
                { id: 'due', header: 'Échéance', sortValue: (r) => r.dueDate, cell: (r) => date(r.dueDate) },
                { id: 't', header: 'Type', primary: true, cell: (r) => `${ROYALTY_LABELS[r.type]} · ${r.periode}` },
                { id: 'm', header: 'Montant', align: 'right', cell: (r) => <Money value={r.montantDu} className="text-[13px]" /> },
                { id: 'p', header: 'Payé', align: 'right', cell: (r) => <Money value={r.paye} tone="muted" className="text-[13px]" /> },
                { id: 's', header: 'Statut', cell: (r) => <StatusBadge status={r.status} /> },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Paiements enregistrés" />
          <ul className="divide-y divide-line border-t border-line">
            {data.payments.slice(0, 10).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
                <span>
                  {date(p.date)} <span className="font-mono text-[12px] text-muted">{p.reference}</span>
                </span>
                <Money value={p.montant} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
