import { useEffect, useMemo, useState } from 'react'
import { formatISO } from 'date-fns'
import { qk, useAppMutation, useLedger, useLicencies } from '@/hooks/queries'
import { ROYALTY_LABELS } from '@/lib/calculations/royalties'
import { date, money } from '@/lib/format'
import { royaltiesService } from '@/services/royalties.service'
import type { PaymentMode } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, MoneyInput, Select } from '@/components/ui/form'
import { DottedLeader, Money, StatusBadge } from '@/components/common/registre'
import { FileDropzone } from '@/components/common/misc'

const invalidateFinance = [qk.ledger(), qk.payments(), qk.reminders(), qk.licencies, qk.network]

/** D-03 — record a (possibly partial) payment against one or more due lines. */
export function RecordPaymentDialog({ open, onOpenChange, licencieId: initial }: { open: boolean; onOpenChange: (o: boolean) => void; licencieId?: string }) {
  const { data: licencies = [] } = useLicencies()
  const [licencieId, setLicencieId] = useState(initial ?? '')
  const { data: ledger = [] } = useLedger(licencieId || undefined)
  const open_ = useMemo(() => (licencieId ? ledger.filter((l) => l.solde > 0) : []), [ledger, licencieId])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [amount, setAmount] = useState(0)
  const [day, setDay] = useState(formatISO(new Date(), { representation: 'date' }))
  const [mode, setMode] = useState<PaymentMode>('VIREMENT')
  const [reference, setReference] = useState('')
  const [proof, setProof] = useState<File[]>([])

  useEffect(() => {
    if (open) setLicencieId(initial ?? '')
  }, [open, initial])
  useEffect(() => {
    const ids = new Set(open_.filter((l) => l.status === 'EN_RETARD').map((l) => l.id))
    setChecked(ids)
  }, [open_])
  const selectedTotal = open_.filter((l) => checked.has(l.id)).reduce((a, l) => a + l.solde, 0)
  useEffect(() => setAmount(selectedTotal), [selectedTotal])

  const mutation = useAppMutation(
    () => {
      let remaining = amount
      const allocations = open_
        .filter((l) => checked.has(l.id))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .map((l) => {
          const m = Math.min(l.solde, remaining)
          remaining -= m
          return { lineId: l.id, montant: m }
        })
        .filter((a) => a.montant > 0)
      return royaltiesService.recordPayment({ licencieId, allocations, date: day, mode, reference })
    },
    { invalidate: [...invalidateFinance, qk.ledger(licencieId), qk.payments(licencieId), qk.licencie(licencieId)], success: (t) => `Encaissement de ${money(t)} enregistré`, onSuccess: () => onOpenChange(false) },
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title="Enregistrer un encaissement"
        description="Répartissez le montant reçu sur les échéances à solder, de la plus ancienne à la plus récente."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button loading={mutation.isPending} disabled={!licencieId || amount <= 0 || !checked.size || !reference.trim()} onClick={() => mutation.mutate(undefined)}>
              Enregistrer {amount > 0 && money(amount)}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <Field label="Licencié">
            {(p) => (
              <Select {...p} value={licencieId} onChange={(e) => setLicencieId(e.target.value)} disabled={!!initial}>
                <option value="">Choisir un licencié…</option>
                {licencies.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.raisonSociale} — solde {money(l.solde)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {licencieId && (
            <fieldset>
              <legend className="mb-2 text-[13px] font-semibold text-ink-soft">Échéances à solder</legend>
              {open_.length === 0 ? (
                <p className="rounded-md bg-success-soft px-3 py-2.5 text-[13.5px] text-success">Ce licencié est à jour : aucune échéance ouverte.</p>
              ) : (
                <ul className="max-h-56 divide-y divide-line overflow-y-auto rounded-md border border-line">
                  {open_.map((l) => (
                    <li key={l.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-canvas">
                        <Checkbox
                          checked={checked.has(l.id)}
                          onCheckedChange={(v) => {
                            const n = new Set(checked)
                            if (v === true) n.add(l.id)
                            else n.delete(l.id)
                            setChecked(n)
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] text-ink">
                            {ROYALTY_LABELS[l.type]} · {l.periode}
                          </span>
                          <span className="block text-[12px] text-muted">Échéance {date(l.dueDate)}</span>
                        </span>
                        <StatusBadge status={l.status} />
                        <Money value={l.solde} className="w-32 text-right text-[13px]" />
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Montant reçu" hint={amount < selectedTotal ? 'Paiement partiel : le reliquat reste dû.' : undefined}>
              {(p) => <MoneyInput {...p} value={amount} onChange={setAmount} />}
            </Field>
            <Field label="Date de réception">{(p) => <Input {...p} type="date" value={day} onChange={(e) => setDay(e.target.value)} />}</Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mode de paiement">
              {(p) => (
                <Select {...p} value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
                  <option value="VIREMENT">Virement</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="CARTE">Carte</option>
                </Select>
              )}
            </Field>
            <Field label="Référence">{(p) => <Input {...p} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="VIR-458213" />}</Field>
          </div>
          <Field label="Justificatif" optional>
            {() => <FileDropzone compact onFiles={setProof} files={proof} onRemove={() => setProof([])} accept={{ 'application/pdf': ['.pdf'], 'image/*': [] }} />}
          </Field>
          {licencieId && (
            <div className="rounded-md bg-canvas px-4 py-2">
              <DottedLeader label="Total sélectionné" value={<Money value={selectedTotal} />} />
              <DottedLeader label="Solde restant après encaissement" value={<Money value={Math.max(0, selectedTotal - amount)} />} strong />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const LEVELS = {
  1: { label: 'Niveau 1 — rappel courtois', subject: 'Rappel : échéance de redevance', body: 'nous vous rappelons qu’une échéance de redevance reste à régler. Si le paiement a déjà été effectué, merci de ne pas tenir compte de ce message.' },
  2: { label: 'Niveau 2 — relance ferme', subject: 'Deuxième relance : redevances impayées', body: 'malgré notre précédent rappel, le règlement ci-dessous n’a pas été reçu. Nous vous remercions de procéder au paiement sous 8 jours.' },
  3: { label: 'Niveau 3 — mise en demeure', subject: 'Mise en demeure de payer', body: 'faute de règlement sous 15 jours, le concessionnaire se réserve le droit de suspendre l’accès à votre instance conformément au contrat de licence.' },
} as const

/** D-04 — reminder with a live e-mail preview. */
export function ReminderDialog({ open, onOpenChange, licencieIds }: { open: boolean; onOpenChange: (o: boolean) => void; licencieIds: string[] }) {
  const { data: licencies = [] } = useLicencies()
  const targets = licencies.filter((l) => licencieIds.includes(l.id))
  const [niveau, setNiveau] = useState<'1' | '2' | '3'>('1')
  const total = targets.reduce((a, l) => a + (l.retard || l.solde), 0)
  const first = targets[0]
  const level = LEVELS[Number(niveau) as 1 | 2 | 3]
  const mutation = useAppMutation(() => royaltiesService.sendReminder(licencieIds, Number(niveau) as 1 | 2 | 3), {
    invalidate: [qk.reminders(), ...licencieIds.map((id) => qk.reminders(id))],
    success: (n) => `${n} relance${n > 1 ? 's' : ''} envoyée${n > 1 ? 's' : ''}`,
    onSuccess: () => onOpenChange(false),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="xl"
        title={targets.length > 1 ? `Relancer ${targets.length} licenciés` : `Relancer ${first?.raisonSociale ?? ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button loading={mutation.isPending} disabled={!targets.length} onClick={() => mutation.mutate(undefined)}>
              Envoyer la relance
            </Button>
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <Field label="Niveau de relance">
              {() => (
                <div className="flex flex-col gap-2">
                  {(Object.keys(LEVELS) as ('1' | '2' | '3')[]).map((k) => (
                    <label key={k} className="flex cursor-pointer items-center gap-3 rounded-md border border-line px-3 py-2.5 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                      <input type="radio" name="niveau" value={k} checked={niveau === k} onChange={() => setNiveau(k)} className="accent-[var(--accent)]" />
                      <span className="text-[13.5px] font-semibold text-ink">{LEVELS[Number(k) as 1].label}</span>
                    </label>
                  ))}
                </div>
              )}
            </Field>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Destinataires</p>
              <ul className="divide-y divide-line rounded-md border border-line">
                {targets.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                    <span className="truncate">{l.raisonSociale}</span>
                    <Money value={l.retard || l.solde} tone={l.retard ? 'danger' : undefined} />
                  </li>
                ))}
              </ul>
              <DottedLeader className="mt-2" label="Total réclamé" value={<Money value={total} />} strong />
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-canvas">
            <div className="border-b border-line bg-surface px-4 py-3 text-[12.5px]">
              <p>
                <span className="text-muted">À :</span> {first?.contactEmail}
                {targets.length > 1 && ` (+${targets.length - 1})`}
              </p>
              <p className="mt-0.5">
                <span className="text-muted">Objet :</span> <strong>{level.subject}</strong>
              </p>
            </div>
            <div className="bg-surface p-5 text-[13.5px] leading-relaxed text-ink">
              <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
                <span className="size-6 rounded bg-brand-700" aria-hidden />
                <strong>StandSet — Réseau des licenciés</strong>
              </div>
              <p>Bonjour {first?.contactName.split(' ')[0]},</p>
              <p className="mt-3">
                Au nom du concessionnaire StandSet, {level.body}
              </p>
              <p className="mt-3">
                Montant dû : <strong>{money(first?.retard || first?.solde || 0)}</strong>
              </p>
              <p className="mt-3">Le détail des échéances est disponible dans votre espace, rubrique « Redevances ».</p>
              <p className="mt-4">Cordialement,<br />Koffi Mensah — Direction du réseau</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function useReminderDialog() {
  const [ids, setIds] = useState<string[] | null>(null)
  return {
    open: (licencieIds: string[]) => setIds(licencieIds),
    element: <ReminderDialog open={!!ids} onOpenChange={(o) => !o && setIds(null)} licencieIds={ids ?? []} />,
  }
}

