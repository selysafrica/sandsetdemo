import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useSearchParams } from 'react-router-dom'
import { tenantService } from '@/services/tenant.service'
import { cn, readableOn, shade } from '@/lib/utils'
import { StandSetLogo, TenantMark } from '@/components/common/Logo'
import { TransitionClock } from '@/components/common/TransitionClock'

const POINTS = [
  "Analyse d'écart clause par clause, score de couverture calculé en direct",
  'Plan de transition en 6 phases, du cadrage à la certification',
  'Rapport de synthèse à votre marque, prêt pour la direction',
]

export function AuthLayout({ wide }: { wide?: boolean }) {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const branding = tenantService.brandingForSubdomain(params.get('tenant'))
  const panelStyle = branding
    ? { background: `linear-gradient(160deg, ${shade(branding.accentColor, 0.35)}, ${shade(branding.accentColor, 0.6)})`, color: readableOn(shade(branding.accentColor, 0.45)) }
    : undefined

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(380px,0.9fr)_1.1fr]">
      <aside
        className={cn('relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex', !branding && 'bg-gradient-to-b from-brand-950 to-brand-900')}
        style={panelStyle}
      >
        <div className="ledger-lines pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          {branding ? (
            <span className="flex items-center gap-3">
              <TenantMark branding={branding} size="md" className="ring-2 ring-white/30" />
              <span className="text-lg font-bold">{branding.nomCommercial}</span>
            </span>
          ) : (
            <Link to="/" aria-label="Accueil StandSet">
              <StandSetLogo inverted subtitle="Transition ISO 9001:2026" />
            </Link>
          )}
        </div>
        <div className="relative max-w-md">
          <h2 className="text-[30px] leading-[1.15] font-bold tracking-[-0.02em]">
            {branding ? `Votre espace ${branding.nomCommercial}` : 'Structurez votre transition, clause après clause.'}
          </h2>
          <p className="mt-3 text-[15px] text-brand-100/90">{t('auth.tagline')}</p>
          <ul className="mt-8 flex flex-col gap-3">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3 text-[14px] text-brand-50">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <TransitionClock tone="dark" />
          {branding && <p className="mt-4 text-[12px] text-white/60">Propulsé par StandSet</p>}
        </div>
      </aside>
      <main id="contenu" className="flex flex-col bg-surface">
        <div className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link to="/">
            <StandSetLogo />
          </Link>
        </div>
        <div className={cn('mx-auto flex w-full flex-1 flex-col justify-center px-6 py-10', wide ? 'max-w-3xl' : 'max-w-[440px]')}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
