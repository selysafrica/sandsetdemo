import { ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { homePath } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { useSession } from '@/stores/session.store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'

export function TwoFactorPage() {
  const pending = useSession((s) => s.pending2faUserId)
  const navigate = useNavigate()
  const location = useLocation()
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [seconds, setSeconds] = useState(30)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => (s <= 1 ? 30 : s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [])

  const code = digits.join('')
  useEffect(() => {
    if (code.length === 6 && !loading) void verify(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  if (!pending) return <Navigate to="/connexion" replace />

  const verify = async (code: string) => {
    setLoading(true)
    setError(null)
    try {
      const user = await authService.verify2fa(code)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? homePath(user.role), { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setDigits(Array(6).fill(''))
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const setAt = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, '')
    if (clean.length <= 1) {
      setDigits((prev) => prev.map((d, k) => (k === i ? clean : d)))
      if (clean && i < 5) refs.current[i + 1]?.focus()
      return
    }
    const ch = clean.slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      let j = i
      while (j < 6 && next[j]) j++
      if (j < 6) next[j] = ch
      refs.current[Math.min(5, j + 1)]?.focus()
      return next
    })
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      e.preventDefault()
      setDigits(text.split(''))
    }
  }

  return (
    <div className="animate-rise">
      <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <ShieldCheck className="size-6" aria-hidden />
      </span>
      <h1 className="mt-5 text-[26px] font-bold text-ink">Vérification en deux étapes</h1>
      <p className="mt-1 text-[14px] text-muted">Saisissez le code à 6 chiffres affiché dans votre application d'authentification.</p>

      <fieldset className="mt-8" aria-describedby={error ? 'otp-error' : undefined}>
        <legend className="sr-only">Code de vérification</legend>
        <div className={cn('flex justify-between gap-2', error && 'animate-shake')} onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKey(e, i)}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              autoFocus={i === 0}
              aria-label={`Chiffre ${i + 1}`}
              disabled={loading}
              className={cn(
                'h-14 w-full max-w-12 rounded-md border bg-surface text-center font-mono text-[22px] text-ink shadow-xs outline-none transition-[border-color,box-shadow] focus:border-brand-500 focus:ring-3 focus:ring-brand-100',
                error ? 'border-danger' : 'border-line-strong',
              )}
            />
          ))}
        </div>
        {error && (
          <p id="otp-error" role="alert" className="mt-3 text-[13px] font-medium text-danger">
            {error}
          </p>
        )}
      </fieldset>

      <div className="mt-4 flex items-center justify-between text-[12.5px] text-muted">
        <span>
          Code renouvelé dans <span className="font-mono text-ink tabular">{String(seconds).padStart(2, '0')} s</span>
        </span>
        <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => setError('Codes de secours : utilisez un des 10 codes remis lors de l’activation.')}>
          Utiliser un code de secours
        </button>
      </div>

      <label className="mt-6 flex items-center gap-2 text-[13.5px] text-ink-soft">
        <Checkbox /> Faire confiance à cet appareil pendant 30 jours
      </label>

      <Button size="lg" className="mt-6 w-full" loading={loading} disabled={!digits.every(Boolean)} onClick={() => verify(digits.join(''))}>
        Vérifier
      </Button>
      <p className="mt-5 text-center text-[13.5px]">
        <Link to="/connexion" className="font-semibold text-brand-700 hover:underline">
          Retour à la connexion
        </Link>
      </p>
      <p className="mt-6 rounded-md bg-panel px-3 py-2 text-center text-[12.5px] text-muted">Démo : code 123456</p>
    </div>
  )
}
