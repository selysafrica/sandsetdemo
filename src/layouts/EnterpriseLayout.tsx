import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUi } from '@/stores/ui.store'
import { NavDrawer } from '@/components/ui/dialog'
import { StandSetLogo } from '@/components/common/Logo'
import { PageSkeleton } from '@/components/common/states'
import { Topbar } from './shell/Topbar'

export function EnterpriseLayout() {
  const { t } = useTranslation()
  const mobileOpen = useUi((s) => s.mobileNavOpen)
  const setMobile = useUi((s) => s.setMobileNav)
  const links = [
    { to: '/espace', label: t('nav.dashboard'), end: true },
    { to: '/espace/dossier', label: t('nav.monDossier') },
    { to: '/espace/abonnement', label: t('nav.abonnement') },
    { to: '/espace/support', label: t('nav.support') },
  ]
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn('flex h-9 items-center rounded-md px-3 text-[13.5px] font-semibold transition-colors', isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-panel hover:text-ink')

  return (
    <div className="flex min-h-dvh flex-col">
      <Topbar
        base="/espace"
        left={
          <div className="flex items-center gap-6">
            <Link to="/espace" className="hidden sm:block" aria-label="Mon espace StandSet">
              <StandSetLogo />
            </Link>
            <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
        }
      />
      <NavDrawer open={mobileOpen} onOpenChange={setMobile} label="Menu">
        <div className="flex h-full flex-col gap-1 bg-surface p-4">
          <div className="mb-4">
            <StandSetLogo />
          </div>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setMobile(false)}>
              {l.label}
            </NavLink>
          ))}
        </div>
      </NavDrawer>
      <main id="contenu" className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
