import { AlertTriangle, CreditCard, Download, RefreshCw, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { qk, useAppMutation, useMyEnterprise } from '@/hooks/queries'
import { date, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { enterprisesService, planPrice } from '@/services/enterprises.service'
import type { Periodicity, Plan } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/controls'
import { Badge, Card, CardHeader } from '@/components/ui/display'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/form'
import { PageHeader } from '@/components/common/PageHeader'
import { DottedLeader, Money, StatusBadge } from '@/components/common/registre'
import { PageSkeleton } from '@/components/common/states'
import { PaymentForm } from './PaymentForm'

/** D-27 — change plan, or cancel with a retention step. */
function PlanDialog({ open, onOpenChange, mode, current }: { open: boolean; onOpenChange: (o: boolean) => void; mode: 'change' | 'cancel'; current: { plan: Plan; periodicity: Periodicity } }) {
  const { data } = useMyEnterprise()
  const [plan, setPlan] = useState(current.plan)
  const [periodicity, setPeriodicity] = useState(current.periodicity)
  const [step, setStep] = useState(0)
  const [reason, setReason] = useState('')
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (open) {
      setPlan(current.plan)
      setPeriodicity(current.periodicity)
      setStep(0)
      setTyped('')
    }
  }, [open, current])
  const change = useAppMutation(() => enterprisesService.changePlan(plan, periodicity), { invalidate: [qk.myEnterprise], success: 'Formule mise à jour — effet à la prochaine facturation', onSuccess: () => onOpenChange(false) })
  const cancel = useAppMutation(enterprisesService.cancel, { invalidate: [qk.myEnterprise], success: 'Abonnement résilié', onSuccess: () => onOpenChange(false) })
  if (!data) return null
  const diff = planPrice(plan, periodicity) - planPrice(current.plan, current.periodicity)

  if (mode === 'cancel')
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          title="Résilier l'abonnement"
          footer={
            step === 0 ? (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Garder mon abonnement</Button>
                <Button variant="danger-outline" disabled={!reason} onClick={() => setStep(1)}>Continuer la résiliation</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                <Button variant="danger" disabled={typed !== 'RÉSILIER'} loading={cancel.isPending} onClick={() => cancel.mutate(undefined)}>Résilier définitivement</Button>
              </>
            )
          }
        >
          {step === 0 ? (
            <div className="flex flex-col gap-4">
              <Field label="Pourquoi souhaitez-vous partir ?">
                {(p) => (
                  <Select {...p} value={reason} onChange={(e) => setReason(e.target.value)}>
                    <option value="">Choisir…</option>
                    <option>Transition terminée</option>
                    <option>Trop cher</option>
                    <option>Accompagnement par un cabinet</option>
                    <option>Outil trop complexe</option>
                    <option>Autre</option>
                  </Select>
                )}
              </Field>
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
                <p className="font-semibold text-brand-900">Avant de partir</p>
                <div className="mt-3 flex flex-col gap-2">
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => { toast.success('Abonnement mis en pause pour un mois'); onOpenChange(false) }}>
                    Mettre en pause un mois (gratuit)
                  </Button>
                  {current.plan === 'PRO' && (
                    <Button variant="outline" size="sm" className="justify-start" onClick={() => { setPlan('ESSENTIEL'); enterprisesService.changePlan('ESSENTIEL', current.periodicity).then(() => { toast.success('Passage à la formule Essentiel'); onOpenChange(false) }) }}>
                      Passer à Essentiel ({money(planPrice('ESSENTIEL', 'MENSUEL'))}/mois)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="flex gap-3 rounded-md bg-danger-soft px-4 py-3 text-[13.5px]">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
                Votre accès prendra fin à la date de la prochaine facturation. Vos données restent exportables pendant 90 jours.
              </p>
              <Field label={<>Saisissez <span className="font-mono">RÉSILIER</span> pour confirmer</>}>{(p) => <Input {...p} value={typed} onChange={(e) => setTyped(e.target.value)} />}</Field>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title="Changer de formule"
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button disabled={plan === current.plan && periodicity === current.periodicity} loading={change.isPending} onClick={() => change.mutate(undefined)}>Confirmer le changement</Button>
          </>
        }
      >
        <Segmented
          label="Périodicité"
          value={periodicity}
          onChange={setPeriodicity}
          options={[
            { value: 'MENSUEL', label: 'Mensuel' },
            { value: 'ANNUEL', label: `Annuel (−${data.discount} %)` },
          ]}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.plans.map((p) => (
            <button key={p.id} type="button" aria-pressed={plan === p.id} onClick={() => setPlan(p.id)} className={cn('rounded-lg border p-4 text-left transition-colors', plan === p.id ? 'border-accent bg-accent-soft' : 'border-line-strong hover:border-brand-300')}>
              <span className="flex items-center justify-between">
                <span className="font-bold">{p.name}</span>
                {current.plan === p.id && <Badge>Actuelle</Badge>}
              </span>
              <span className="mt-1 block font-mono text-[18px]">{money(planPrice(p.id, periodicity))}</span>
              <span className="text-[12px] text-muted">{periodicity === 'ANNUEL' ? 'par an' : 'par mois'}</span>
              <ul className="mt-3 flex flex-col gap-1 text-[12.5px] text-ink-soft">
                {p.features.map((f) => <li key={f}>· {f}</li>)}
              </ul>
            </button>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-ink-soft">
          {diff === 0 ? 'Aucun changement de montant.' : diff > 0 ? <>Supplément au prorata : <strong>{money(Math.round(diff / 2))}</strong> facturé aujourd'hui.</> : <>Crédit de <strong>{money(Math.round(-diff / 2))}</strong> sur la prochaine facture.</>}
        </p>
      </DialogContent>
    </Dialog>
  )
}

export function BillingPage() {
  const { data, isLoading } = useMyEnterprise()
  const [plan, setPlan] = useState<'change' | 'cancel' | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const retry = useAppMutation((id: string) => enterprisesService.retryInvoice(id), { invalidate: [qk.myEnterprise], success: 'Paiement réussi' })
  const updatePay = useAppMutation(enterprisesService.updatePayment, { invalidate: [qk.myEnterprise], success: 'Moyen de paiement mis à jour', onSuccess: () => setPayOpen(false) })
  if (isLoading || !data) return <PageSkeleton />
  const e = data.enterprise
  const price = planPrice(e.plan, e.periodicity)
  const failed = data.invoices.filter((i) => i.status === 'ECHOUEE')
  const lastFailed = failed.find((f) => !data.invoices.some((i) => i.status === 'PAYEE' && i.date > f.date))

  return (
    <>
      <PageHeader title="Abonnement & facturation" subtitle="Facturation automatique et récurrente. Sans engagement." />
      {(e.subscriptionStatus === 'IMPAYE' || lastFailed) && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3" role="alert">
          <AlertTriangle className="size-5 text-danger" />
          <p className="min-w-0 flex-1 text-[13.5px]">
            <strong className="text-danger">Paiement échoué{lastFailed ? ` le ${date(lastFailed.date)}` : ''}.</strong> Mettez à jour votre moyen de paiement pour éviter l'interruption du service.
          </p>
          {lastFailed && (
            <Button size="sm" variant="danger" loading={retry.isPending} onClick={() => retry.mutate(lastFailed.id)}>
              <RefreshCw /> Réessayer
            </Button>
          )}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-muted">Formule actuelle</p>
            <StatusBadge status={e.subscriptionStatus} />
          </div>
          <p className="mt-1 text-[24px] font-bold">{e.plan === 'PRO' ? 'Pro' : 'Essentiel'}</p>
          <p className="font-mono text-[15px] text-ink-soft">
            {money(price)} / {e.periodicity === 'ANNUEL' ? 'an' : 'mois'}
          </p>
          <div className="mt-4">
            <DottedLeader label="Prochaine facturation" value={e.subscriptionStatus === 'RESILIE' ? 'Aucune' : date(e.nextBillingAt)} />
            <DottedLeader label="Abonnée depuis" value={date(e.subscribedAt)} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPlan('change')} disabled={e.subscriptionStatus === 'RESILIE'}>
              Changer de formule
            </Button>
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-[13px] font-semibold text-muted">Moyen de paiement</p>
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-line px-4 py-3">
            {e.paymentMethod.kind === 'CARTE' ? <CreditCard className="size-5 text-brand-600" /> : <Smartphone className="size-5 text-brand-600" />}
            <span className="font-mono text-[14px]">{e.paymentMethod.label}</span>
          </div>
          <Button variant="outline" className="mt-4" onClick={() => setPayOpen(true)}>
            Mettre à jour le moyen de paiement
          </Button>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader title="Factures" />
        <ul className="divide-y divide-line border-t border-line">
          {data.invoices.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px]">
              <span className="font-mono text-[12.5px]">{inv.number}</span>
              <span className="text-muted">{date(inv.date)}</span>
              <StatusBadge status={inv.status === 'EN_ATTENTE' ? 'EN_ATTENTE_PAIEMENT' : inv.status} />
              <Money value={inv.amount} className="ml-auto" />
              <Button variant="ghost" size="icon-sm" aria-label={`Télécharger ${inv.number}`} onClick={() => toast.info('Facture PDF générée (démo)')}>
                <Download />
              </Button>
            </li>
          ))}
        </ul>
      </Card>
      {e.subscriptionStatus !== 'RESILIE' && (
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 border-danger/20 p-5">
          <div>
            <p className="font-semibold">Résilier l'abonnement</p>
            <p className="text-[12.5px] text-muted">Vos données restent exportables pendant 90 jours.</p>
          </div>
          <Button variant="danger-outline" onClick={() => setPlan('cancel')}>
            Résilier
          </Button>
        </Card>
      )}
      <PlanDialog open={!!plan} onOpenChange={(o) => !o && setPlan(null)} mode={plan ?? 'change'} current={{ plan: e.plan, periodicity: e.periodicity }} />
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent title="Mettre à jour le moyen de paiement" description="Une vérification de 100 FCFA est effectuée puis remboursée.">
          <PaymentForm amount={100} recurringLabel="Montant de vérification, remboursé immédiatement." submitLabel="Vérifier" onPaid={(m) => updatePay.mutateAsync(m).then(() => undefined)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
