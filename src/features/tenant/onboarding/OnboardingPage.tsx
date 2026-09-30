import { ArrowRight, CheckCircle2, FolderPlus, Layers, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTenant } from '@/hooks/useCurrentUser'
import { useAppMutation } from '@/hooks/queries'
import { tenantService } from '@/services/tenant.service'
import { useUi } from '@/stores/ui.store'
import type { Branding } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Stepper } from '@/components/ui/controls'
import { Card } from '@/components/ui/display'
import { PageSkeleton } from '@/components/common/states'
import { accentStyle } from '@/lib/theme'
import { BrandPreview, ColorField, ContactFields, DomainDialog, IdentityFields } from '../branding/brand-kit'

const STEPS = ['Identité', 'Couleur', 'Coordonnées', 'Domaine']

export function OnboardingPage() {
  const { licencie } = useTenant()
  const navigate = useNavigate()
  const bump = useUi((s) => s.bumpRevision)
  const [step, setStep] = useState(0)
  const [b, setB] = useState<Branding | null>(licencie?.branding ?? null)
  const [domainOpen, setDomainOpen] = useState(false)
  const [done, setDone] = useState(false)
  const save = useAppMutation(() => tenantService.saveBranding(b!, true), {
    onSuccess: () => {
      bump()
      setDone(true)
    },
  })
  if (!licencie || !b) return <PageSkeleton />
  const set = (patch: Partial<Branding>) => setB({ ...b, ...patch })

  if (done)
    return (
      <div style={accentStyle(b.accentColor)} className="mx-auto max-w-2xl py-10 text-center animate-rise">
        <CheckCircle2 className="mx-auto size-12 text-accent" />
        <h1 className="mt-4 text-[26px] font-bold">Votre instance {b.nomCommercial} est prête</h1>
        <p className="mt-2 text-muted">Vos clients verront désormais votre marque. Trois étapes pour bien démarrer :</p>
        <ul className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {[
            { icon: <UserPlus />, title: 'Inviter votre équipe', to: '/app/utilisateurs?inviter=1' },
            { icon: <FolderPlus />, title: 'Créer un premier dossier', to: '/app/dossiers?nouveau=1' },
            { icon: <Layers />, title: 'Découvrir le Kit', to: '/app/dossiers' },
          ].map((s) => (
            <li key={s.title}>
              <Link to={s.to} className="group flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-card hover:border-accent">
                <span className="grid size-9 place-items-center rounded-md bg-accent-soft text-accent [&_svg]:size-5">{s.icon}</span>
                <span className="font-semibold text-ink">{s.title}</span>
                <ArrowRight className="mt-auto size-4 text-muted group-hover:text-accent" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )

  return (
    <div style={accentStyle(b.accentColor.length === 7 ? b.accentColor : licencie.branding.accentColor)}>
      <div className="mb-8">
        <p className="text-[13px] font-semibold text-accent">Bienvenue dans le réseau StandSet</p>
        <h1 className="mt-1 text-[26px] font-bold">Donnez à l'instance les couleurs de {licencie.raisonSociale}</h1>
        <p className="mt-1 max-w-[65ch] text-muted">Quatre étapes, environ deux minutes. Tout reste modifiable dans « Marque & instance ».</p>
      </div>
      <div className="grid gap-8 xl:grid-cols-[1fr_460px]">
        <Card className="p-6">
          <Stepper steps={STEPS} current={step} className="mb-8" />
          {step === 0 && <IdentityFields b={b} set={set} />}
          {step === 1 && <ColorField b={b} set={set} />}
          {step === 2 && <ContactFields b={b} set={set} />}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-[14px] text-ink-soft">
                Votre instance est accessible sur <strong className="font-mono text-ink">{b.subdomain ? `${b.subdomain}.standset.com` : 'un sous-domaine à choisir'}</strong>. Vous pouvez aussi utiliser votre propre domaine.
              </p>
              <Button variant="outline" className="self-start" onClick={() => setDomainOpen(true)}>
                Configurer le domaine
              </Button>
            </div>
          )}
          <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
            <Button variant="ghost" onClick={() => (step === 0 ? navigate('/app') : setStep(step - 1))}>
              {step === 0 ? 'Passer pour l’instant' : 'Retour'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>
                Continuer <ArrowRight />
              </Button>
            ) : (
              <Button loading={save.isPending} onClick={() => save.mutate(undefined)}>
                Terminer la personnalisation
              </Button>
            )}
          </div>
        </Card>
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <BrandPreview b={b} initialTab={step === 2 ? 'mail' : 'app'} key={step === 2 ? 'mail' : 'app'} />
        </aside>
      </div>
      <DomainDialog open={domainOpen} onOpenChange={setDomainOpen} b={b} set={set} />
    </div>
  )
}
