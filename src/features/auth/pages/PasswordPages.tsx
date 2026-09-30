import { Check, MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!cooldown) return
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Saisissez un courriel valide.')
    setError('')
    setLoading(true)
    await authService.requestReset(email)
    setLoading(false)
    setSent(true)
    setCooldown(60)
  }

  if (sent)
    return (
      <div className="animate-rise text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-[24px] font-bold text-ink">Vérifiez votre boîte de réception</h1>
        <p className="mx-auto mt-2 max-w-sm text-[14px] text-muted">
          Si un compte existe pour <strong className="text-ink">{email}</strong>, un lien de réinitialisation valable 30 minutes vient d'être envoyé.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Button variant="outline" disabled={cooldown > 0} onClick={send} loading={loading}>
            {cooldown > 0 ? `Renvoyer dans ${cooldown} s` : 'Renvoyer le lien'}
          </Button>
          <Button variant="link" asChild>
            <Link to="/reinitialiser">Ouvrir le lien reçu (démo)</Link>
          </Button>
        </div>
      </div>
    )

  return (
    <div className="animate-rise">
      <h1 className="text-[26px] font-bold text-ink">Mot de passe oublié</h1>
      <p className="mt-1 text-[14px] text-muted">Indiquez votre courriel : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        noValidate
      >
        <Field label="Courriel" error={error}>
          {(p) => <Input {...p} type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />}
        </Field>
        <Button type="submit" size="lg" loading={loading}>
          Envoyer le lien
        </Button>
      </form>
      <p className="mt-5 text-center text-[13.5px]">
        <Link to="/connexion" className="font-semibold text-brand-700 hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  )
}

const RULES = [
  { label: '10 caractères minimum', test: (p: string) => p.length >= 10 },
  { label: 'Une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p: string) => /\d/.test(p) },
  { label: 'Un caractère spécial', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export function PasswordStrength({ value }: { value: string }) {
  const passed = RULES.filter((r) => r.test(value)).length
  const colors = ['bg-line-strong', 'bg-danger', 'bg-[oklch(0.72_0.15_70)]', 'bg-brand-500', 'bg-success']
  return (
    <div>
      <div className="flex gap-1" aria-hidden>
        {RULES.map((_, i) => (
          <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < passed ? colors[passed] : 'bg-panel')} />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {RULES.map((r) => {
          const ok = r.test(value)
          return (
            <li key={r.label} className={cn('flex items-center gap-1.5 text-[12.5px]', ok ? 'text-success' : 'text-muted')}>
              <Check className={cn('size-3.5', !ok && 'opacity-30')} aria-hidden />
              {r.label}
              <span className="sr-only">{ok ? ' : respecté' : ' : non respecté'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const isStrongPassword = (p: string) => RULES.every((r) => r.test(p))

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const mismatch = confirm.length > 0 && confirm !== pwd
  return (
    <div className="animate-rise">
      <h1 className="text-[26px] font-bold text-ink">Nouveau mot de passe</h1>
      <p className="mt-1 text-[14px] text-muted">Choisissez un mot de passe robuste que vous n'utilisez nulle part ailleurs.</p>
      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setLoading(true)
          await authService.resetPassword(pwd)
          toast.success('Mot de passe mis à jour. Vous pouvez vous connecter.')
          navigate('/connexion')
        }}
      >
        <Field label="Nouveau mot de passe">{(p) => <Input {...p} type="password" autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoFocus />}</Field>
        <PasswordStrength value={pwd} />
        <Field label="Confirmation" error={mismatch ? 'Les deux mots de passe ne correspondent pas.' : undefined}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </Field>
        <Button type="submit" size="lg" loading={loading} disabled={!isStrongPassword(pwd) || pwd !== confirm}>
          Enregistrer le mot de passe
        </Button>
      </form>
    </div>
  )
}
