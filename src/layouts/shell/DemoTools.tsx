import { ChevronDown, FlaskConical, RotateCcw, UserRoundCog } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { db, resetDemo } from '@/mocks/db'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { homePath } from '@/lib/permissions'
import { ROLE_META } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { useSession } from '@/stores/session.store'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/display'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/overlays'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'

export const PERSONAS = [
  { id: 'usr_admin', hint: 'Console · réseau' },
  { id: 'usr_licadmin', hint: 'Qualis Conseil · admin' },
  { id: 'usr_consultant', hint: 'Qualis Conseil · consultante' },
  { id: 'usr_entreprise', hint: 'Kora Plastiques · self-service' },
]

/** Floating demo helper: switch persona instantly, reset the dataset. Not part of the product. */
export function PersonaSwitcher() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirm, setConfirm] = useState(false)
  const [open, setOpen] = useState(false)
  const switchTo = (id: string) => {
    setOpen(false)
    authService.switchPersona(id)
    qc.clear()
    const u = db.users.find((x) => x.id === id)!
    navigate(homePath(u.role))
  }
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="demo-pill fixed right-4 bottom-4 z-[var(--z-toast)] flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-3 pl-1.5 text-[12.5px] font-semibold text-ink-soft shadow-pop transition-colors hover:text-ink print:hidden"
            aria-label="Outils de démonstration"
          >
            <span className="grid size-7 place-items-center rounded-full bg-brand-950 text-white">
              <FlaskConical className="size-3.5" />
            </span>
            Démo
            {user && <span className="size-2 rounded-full" style={{ background: ROLE_META[user.role].color }} aria-hidden />}
            <ChevronDown className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-72 p-2">
          <p className="flex items-center gap-2 px-2 pt-1 pb-2 text-[12px] font-semibold text-muted">
            <UserRoundCog className="size-3.5" /> Changer de persona
          </p>
          {PERSONAS.map((p) => {
            const u = db.users.find((x) => x.id === p.id)!
            const active = user?.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => switchTo(p.id)}
                className={cn('flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-brand-50', active && 'bg-brand-50')}
              >
                <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" color={ROLE_META[u.role].color} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink">{ROLE_META[u.role].short}</span>
                  <span className="block truncate text-[12px] text-muted">{p.hint}</span>
                </span>
                {active && <span className="text-[11px] font-semibold text-brand-700">actif</span>}
              </button>
            )
          })}
          <div className="mt-1 border-t border-line pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setConfirm(true)
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] text-danger hover:bg-danger-soft">
              <RotateCcw className="size-4" /> Réinitialiser la démo
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Réinitialiser la démonstration ?"
        impact="Toutes les modifications faites pendant la démo (licenciés, évaluations, paiements…) seront effacées et le jeu de données initial restauré."
        confirmLabel="Réinitialiser"
        destructive
        onConfirm={resetDemo}
      />
    </>
  )
}

export function ImpersonationBanner() {
  const impersonatorId = useSession((s) => s.impersonatorId)
  const stop = useSession((s) => s.stopImpersonation)
  const user = useCurrentUser()
  const navigate = useNavigate()
  const qc = useQueryClient()
  if (!impersonatorId || !user) return null
  const lic = db.licencies.find((l) => l.id === user.tenantId)
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 bg-brand-950 px-4 py-2 text-[13px] text-white print:hidden" role="status">
      <UserRoundCog className="size-4 text-brand-300" aria-hidden />
      <span>
        Vous consultez l'instance <strong>{lic?.branding.nomCommercial}</strong> en tant qu'administrateur. Cette session est journalisée.
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          stop()
          qc.clear()
          navigate(`/console/licencies/${lic?.id ?? ''}`)
        }}
      >
        Revenir à la Console
      </Button>
    </div>
  )
}

/** D-30 — non-dismissable session expiry dialog. */
export function SessionExpiredDialog() {
  const expired = useSession((s) => s.expired)
  const setExpired = useSession((s) => s.setExpired)
  const logout = useSession((s) => s.logout)
  const user = useCurrentUser()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  return (
    <Dialog open={expired}>
      <DialogContent
        size="sm"
        hideClose
        onInteractOutside={(e) => e.preventDefault()}
        title="Votre session a expiré"
        description="Pour votre sécurité, saisissez à nouveau votre mot de passe. La page en cours est conservée."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                logout()
                navigate('/connexion')
              }}
            >
              Se déconnecter
            </Button>
            <Button
              onClick={() => {
                if (password !== 'demo1234') return setError('Mot de passe incorrect.')
                setExpired(false)
                setPassword('')
                toast.success('Session rétablie')
              }}
            >
              Reprendre
            </Button>
          </>
        }
      >
        <Field label={`Mot de passe de ${user?.email ?? ''}`} error={error}>
          {(p) => <Input {...p} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />}
        </Field>
      </DialogContent>
    </Dialog>
  )
}
