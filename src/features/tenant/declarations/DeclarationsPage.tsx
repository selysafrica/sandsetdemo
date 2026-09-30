import { ArrowRight, Building2, CheckCircle2, EyeOff, Landmark, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { qk, useAppMutation, useDeclarations } from '@/hooks/queries'
import { useTenant } from '@/hooks/useCurrentUser'
import { dateTime, money } from '@/lib/format'
import { tenantService } from '@/services/tenant.service'
import { Button } from '@/components/ui/button'
import { CheckRow } from '@/components/ui/controls'
import { Card, CardHeader } from '@/components/ui/display'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, MoneyInput } from '@/components/ui/form'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { DottedLeader, Money } from '@/components/common/registre'
import { PageSkeleton } from '@/components/common/states'

/** D-23 */
function DeclareDialog({ open, onOpenChange, current, pct }: { open: boolean; onOpenChange: (o: boolean) => void; current: { periode: string; dossiersActifs: number; sessions: number; caSuggested: number }; pct: number }) {
  const [ca, setCa] = useState(current.caSuggested)
  const [honor, setHonor] = useState(false)
  useEffect(() => {
    if (open) {
      setCa(current.caSuggested)
      setHonor(false)
    }
  }, [open, current.caSuggested])
  const send = useAppMutation(() => tenantService.declare({ periode: current.periode, dossiersActifs: current.dossiersActifs, sessions: current.sessions, caSessions: ca }), {
    invalidate: [qk.declarations, qk.ownLedger],
    success: `Déclaration ${current.periode} transmise au concessionnaire`,
    onSuccess: () => onOpenChange(false),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Déclarer l'activité — ${current.periode}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button disabled={!honor} loading={send.isPending} onClick={() => send.mutate(undefined)}>
              <Send /> Transmettre
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dossiers actifs" hint="Calculé automatiquement">{(p) => <Input {...p} value={current.dossiersActifs} readOnly className="font-mono" />}</Field>
            <Field label="Sessions réalisées" hint="Calculé automatiquement">{(p) => <Input {...p} value={current.sessions} readOnly className="font-mono" />}</Field>
          </div>
          <Field label="CA des sessions de formation (HT)" hint="Pré-rempli depuis les sessions enregistrées ; ajustez si nécessaire.">
            {(p) => <MoneyInput {...p} value={ca} onChange={setCa} />}
          </Field>
          <div className="rounded-md bg-canvas px-4 py-2">
            <DottedLeader label={`Redevance variable (${pct} %)`} value={<Money value={(ca * pct) / 100} />} strong />
          </div>
          <CheckRow checked={honor} onCheckedChange={setHonor} label="Je certifie l'exactitude de cette déclaration." description="Seuls ces trois agrégats sont transmis au concessionnaire." />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function DeclarationsPage() {
  const { data, isLoading } = useDeclarations()
  const { licencie } = useTenant()
  const [open, setOpen] = useState(false)
  if (isLoading || !data) return <PageSkeleton />
  const done = data.history.find((h) => h.periode === data.current.periode)
  return (
    <>
      <PageHeader title="Déclarations d'activité" subtitle="Chaque trimestre, vous transmettez trois agrégats qui servent au calcul de la redevance variable." />
      <Card className="mb-6 p-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center">
          <div className="flex items-center gap-3 rounded-lg border border-line px-4 py-3">
            <Building2 className="size-5 text-accent" />
            <div>
              <p className="text-[13px] font-bold">Votre instance</p>
              <p className="text-[12px] text-muted">{licencie?.branding.nomCommercial} — dossiers, écarts, documents</p>
            </div>
          </div>
          <ArrowRight className="size-5 rotate-90 text-muted md:rotate-0" />
          <div className="rounded-lg border-2 border-dashed border-accent/40 bg-accent-soft px-4 py-3 text-center">
            <p className="text-[12px] font-semibold text-accent">Agrégats uniquement</p>
            <p className="font-mono text-[12.5px] text-ink">dossiers actifs · sessions · CA</p>
          </div>
          <ArrowRight className="size-5 rotate-90 text-muted md:rotate-0" />
          <div className="flex items-center gap-3 rounded-lg border border-line px-4 py-3">
            <Landmark className="size-5 text-brand-700" />
            <div>
              <p className="text-[13px] font-bold">Console StandSet</p>
              <p className="text-[12px] text-muted">Calcul des redevances</p>
            </div>
          </div>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-center text-[13px] text-ink-soft">
          <EyeOff className="size-4 text-accent" /> Aucune donnée de vos clients (analyses, documents) ne quitte votre instance.
        </p>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <Card className="p-6">
          <p className="text-[13px] font-semibold text-muted">Période en cours</p>
          <p className="text-[22px] font-bold">{data.current.periode}</p>
          <div className="mt-3">
            <DottedLeader label="Dossiers actifs" value={<span className="font-mono">{data.current.dossiersActifs}</span>} />
            <DottedLeader label="Sessions réalisées" value={<span className="font-mono">{data.current.sessions}</span>} />
            <DottedLeader label="CA sessions (estimé)" value={<Money value={data.current.caSuggested} />} />
            <DottedLeader label={`Redevance variable estimée (${data.pct} %)`} value={<Money value={(data.current.caSuggested * data.pct) / 100} />} strong />
          </div>
          {done ? (
            <p className="mt-5 flex items-center gap-2 rounded-md bg-success-soft px-3 py-2.5 text-[13.5px] text-success">
              <CheckCircle2 className="size-4" /> Transmise le {dateTime(done.sentAt)}
            </p>
          ) : (
            <Button className="mt-5 w-full" onClick={() => setOpen(true)}>
              <Send /> Déclarer {data.current.periode}
            </Button>
          )}
        </Card>
        <Card>
          <CardHeader title="Historique des déclarations" />
          <div className="px-5 pb-5">
            <DataTable
              caption="Historique des déclarations"
              dense
              rows={data.history}
              getRowId={(d) => d.id}
              columns={[
                { id: 'p', header: 'Période', primary: true, cell: (d) => <span className="font-semibold">{d.periode}</span> },
                { id: 'd', header: 'Dossiers', align: 'right', cell: (d) => <span className="font-mono">{d.dossiersActifs}</span> },
                { id: 's', header: 'Sessions', align: 'right', cell: (d) => <span className="font-mono">{d.sessions}</span> },
                { id: 'ca', header: 'CA', align: 'right', cell: (d) => <Money value={d.caSessions} className="text-[13px]" /> },
                { id: 'r', header: 'Redevance', align: 'right', cell: (d) => <span className="font-mono text-[13px]">{money((d.caSessions * data.pct) / 100)}</span> },
                { id: 'at', header: 'Envoyée', cell: (d) => <span className="text-[12.5px] text-muted">{dateTime(d.sentAt)}</span> },
              ]}
            />
          </div>
        </Card>
      </div>
      <DeclareDialog open={open} onOpenChange={setOpen} current={data.current} pct={data.pct} />
    </>
  )
}
