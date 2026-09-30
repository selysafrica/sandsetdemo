import { CreditCard, Lock, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Enterprise } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/controls'
import { Field, Input } from '@/components/ui/form'

const OPERATORS = [
  { id: 'Orange Money', color: '#ff7900' },
  { id: 'MTN MoMo', color: '#ffcb05' },
  { id: 'Moov Money', color: '#0066b3' },
  { id: 'Wave', color: '#1dc8f2' },
]

interface Props {
  amount: number
  recurringLabel: string
  submitLabel?: string
  onPaid: (method: Enterprise['paymentMethod']) => void | Promise<void>
}

/** D-26 — simulated card / mobile money payment. A number ending in 0000 fails. */
export function PaymentForm({ amount, recurringLabel, submitLabel = 'Payer', onPaid }: Props) {
  const [kind, setKind] = useState<'CARTE' | 'MOBILE_MONEY'>('MOBILE_MONEY')
  const [card, setCard] = useState({ number: '', exp: '', cvc: '', name: '' })
  const [op, setOp] = useState(OPERATORS[0].id)
  const [phone, setPhone] = useState('')
  const [state, setState] = useState<'idle' | 'processing' | 'waiting' | 'error'>('idle')
  const [countdown, setCountdown] = useState(60)
  const [error, setError] = useState('')

  useEffect(() => {
    if (state !== 'waiting') return
    const id = window.setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearInterval(id)
  }, [state])

  const digits = card.number.replace(/\D/g, '')
  const brand = digits.startsWith('4') ? 'Visa' : /^5[1-5]/.test(digits) ? 'Mastercard' : ''
  const cardValid = digits.length === 16 && /^\d{2}\/\d{2}$/.test(card.exp) && card.cvc.length >= 3 && card.name.length > 2
  const phoneDigits = phone.replace(/\D/g, '')
  const mmValid = phoneDigits.length >= 8

  const pay = async () => {
    setError('')
    const failing = (kind === 'CARTE' ? digits : phoneDigits).endsWith('0000')
    if (kind === 'MOBILE_MONEY') {
      setState('waiting')
      setCountdown(60)
      await new Promise((r) => setTimeout(r, 2600))
    } else {
      setState('processing')
      await new Promise((r) => setTimeout(r, 1500))
    }
    if (failing) {
      setState('error')
      setError(kind === 'CARTE' ? 'Paiement refusé par la banque émettrice. Vérifiez vos informations ou utilisez un autre moyen.' : 'Le paiement n’a pas été validé sur votre téléphone (solde insuffisant ou délai dépassé).')
      return
    }
    await onPaid(kind === 'CARTE' ? { kind, label: `${brand || 'Carte'} •• ${digits.slice(-4)}` } : { kind, label: `${op} •• ${phoneDigits.slice(-4, -2)} ${phoneDigits.slice(-2)}` })
    setState('idle')
  }

  if (state === 'waiting')
    return (
      <div className="flex flex-col items-center py-8 text-center" role="status" aria-live="polite">
        <span className="relative grid size-20 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-100" />
          <Smartphone className="relative size-9 text-brand-700" />
        </span>
        <p className="mt-5 text-[16px] font-bold text-ink">Validez le paiement sur votre téléphone</p>
        <p className="mt-1 max-w-sm text-[13.5px] text-muted">
          Une demande de {money(amount)} a été envoyée au {phone} ({op}). Composez votre code secret pour confirmer.
        </p>
        <p className="mt-4 font-mono text-[13px] text-ink-soft">Expiration dans {countdown} s</p>
      </div>
    )

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label="Moyen de paiement"
        value={kind}
        onChange={(k) => {
          setKind(k)
          setState('idle')
        }}
        options={[
          { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: <Smartphone /> },
          { value: 'CARTE', label: 'Carte bancaire', icon: <CreditCard /> },
        ]}
      />
      {kind === 'CARTE' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Numéro de carte" className="sm:col-span-2" hint={brand || undefined}>
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                autoComplete="cc-number"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })}
                placeholder="4242 4242 4242 4242"
                className="font-mono"
              />
            )}
          </Field>
          <Field label="Expiration">
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                autoComplete="cc-exp"
                value={card.exp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setCard({ ...card, exp: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v })
                }}
                placeholder="MM/AA"
                className="font-mono"
              />
            )}
          </Field>
          <Field label="CVC">{(p) => <Input {...p} inputMode="numeric" autoComplete="cc-csc" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} className="font-mono" />}</Field>
          <Field label="Titulaire" className="sm:col-span-2">{(p) => <Input {...p} autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />}</Field>
        </div>
      ) : (
        <>
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-ink-soft">Opérateur</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {OPERATORS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={op === o.id}
                  onClick={() => setOp(o.id)}
                  className={cn('flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors', op === o.id ? 'border-accent bg-accent-soft text-ink' : 'border-line-strong text-ink-soft hover:border-brand-300')}
                >
                  <span className="size-3 rounded-full" style={{ background: o.color }} aria-hidden />
                  {o.id}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="Numéro de téléphone" hint="Vous recevrez une demande de confirmation sur ce numéro.">
            {(p) => <Input {...p} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 07 00 00 00 00" className="font-mono" />}
          </Field>
        </>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2.5 text-[13.5px] text-danger">
          {error}
        </p>
      )}
      <div className="rounded-md bg-canvas px-4 py-3 text-[13px] text-ink-soft">
        <p className="flex items-baseline justify-between">
          <span>Montant débité aujourd'hui</span>
          <span className="font-mono text-[16px] text-ink">{money(amount)}</span>
        </p>
        <p className="mt-1 text-[12px] text-muted">{recurringLabel}</p>
      </div>
      <Button size="lg" disabled={kind === 'CARTE' ? !cardValid : !mmValid} loading={state === 'processing'} onClick={pay}>
        {state !== 'processing' && <Lock />} {submitLabel} {money(amount)}
      </Button>
      <p className="text-center text-[12px] text-muted">Paiement sécurisé · démonstration : aucune donnée bancaire n'est transmise. Un numéro finissant par 0000 simule un échec.</p>
    </div>
  )
}
