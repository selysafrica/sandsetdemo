import { Compass, LockKeyhole, Mail, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useRouteError } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { homePath } from '@/lib/permissions'
import { useSession } from '@/stores/session.store'
import { Button } from '@/components/ui/button'
import { StandSetLogo } from '@/components/common/Logo'
import { RefCode, Stamp } from '@/components/common/registre'

function Frame({ icon, title, children, actions, stamp }: { icon: ReactNode; title: string; children: ReactNode; actions: ReactNode; stamp?: ReactNode }) {
  return (
    <div className="ledger-lines-light flex min-h-dvh flex-col items-center bg-canvas px-6">
      <header className="w-full max-w-5xl py-6">
        <Link to="/">
          <StandSetLogo />
        </Link>
      </header>
      <main id="contenu" className="flex w-full max-w-lg flex-1 flex-col items-center justify-center pb-24 text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-line bg-surface text-brand-700 shadow-card [&_svg]:size-7">{icon}</span>
        {stamp && <div className="mt-5">{stamp}</div>}
        <h1 className="mt-5 text-[26px] font-bold text-ink">{title}</h1>
        <div className="mt-2 text-[14.5px] text-muted">{children}</div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">{actions}</div>
      </main>
    </div>
  )
}

export function SuspendedPage() {
  const logout = useSession((s) => s.logout)
  const navigate = useNavigate()
  return (
    <Frame
      icon={<LockKeyhole />}
      stamp={<Stamp status="SUSPENDU" />}
      title="L'accès à cette instance est suspendu"
      actions={
        <>
          <Button variant="outline" asChild>
            <a href="mailto:reseau@standset.com">
              <Mail /> Contacter le concessionnaire
            </a>
          </Button>
          <Button
            onClick={() => {
              logout()
              navigate('/connexion')
            }}
          >
            Se déconnecter
          </Button>
        </>
      }
    >
      Le concessionnaire StandSet a suspendu cette licence. Vos données sont conservées et restent intactes. Pour connaître le motif et les conditions de réactivation, contactez le réseau : reseau@standset.com.
    </Frame>
  )
}

export function ForbiddenPage() {
  const user = useCurrentUser()
  return (
    <Frame
      icon={<LockKeyhole />}
      title="Ce dossier ne vous est pas affecté"
      actions={
        <Button asChild>
          <Link to={user ? (user.role === 'ENTREPRISE' ? '/espace' : user.role === 'ADMIN_CONCESSIONNAIRE' ? '/console' : '/app/dossiers') : '/connexion'}>Revenir à mes dossiers</Link>
        </Button>
      }
    >
      Vous ne voyez que les dossiers clients qui vous ont été attribués. Si vous devez intervenir sur celui-ci, demandez à l'administrateur de votre cabinet de vous l'affecter.
    </Frame>
  )
}

export function NotFoundPage() {
  const user = useCurrentUser()
  return (
    <Frame
      icon={<Compass />}
      title="Page introuvable"
      actions={
        <Button asChild>
          <Link to={user ? homePath(user.role) : '/'}>Retour à l'accueil</Link>
        </Button>
      }
    >
      Cette adresse ne correspond à aucune page. Elle a peut-être été déplacée, ou le lien est incomplet.
    </Frame>
  )
}

export function RouteError() {
  const error = useRouteError() as Error | undefined
  const qc = useQueryClient()
  const ref = `INC-${Date.now().toString(36).toUpperCase().slice(-6)}`
  return (
    <Frame
      icon={<RotateCcw />}
      title="Une erreur est survenue"
      actions={
        <Button
          onClick={() => {
            qc.clear()
            window.location.reload()
          }}
        >
          <RotateCcw /> Réessayer
        </Button>
      }
    >
      <p>La page n'a pas pu s'afficher. Si le problème persiste, communiquez cette référence au support :</p>
      <p className="mt-3">
        <RefCode value={ref} />
      </p>
      {import.meta.env.DEV && error?.message && <pre className="mt-4 max-w-full overflow-x-auto rounded-md bg-panel p-3 text-left text-[12px] text-danger">{error.message}</pre>}
    </Frame>
  )
}
