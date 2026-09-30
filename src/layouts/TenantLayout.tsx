import { FolderOpen, HelpCircle, Landmark, LayoutDashboard, ListChecks, Palette, Send, Users } from 'lucide-react'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCurrentUser, useTenant } from '@/hooks/useCurrentUser'
import { accentStyle } from '@/lib/theme'
import { useUi } from '@/stores/ui.store'
import { NavDrawer } from '@/components/ui/dialog'
import { StandSetMark, TenantMark } from '@/components/common/Logo'
import { NewVersionBanner } from '@/components/common/banners'
import { PageSkeleton } from '@/components/common/states'
import { ImpersonationBanner } from './shell/DemoTools'
import { SidebarNav, type NavSection } from './shell/nav'
import { Topbar } from './shell/Topbar'

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const { licencie } = useTenant()
  if (!licencie || !user) return null
  const isAdmin = user.role === 'LICENCIE_ADMIN'
  const sections: NavSection[] = isAdmin
    ? [
        {
          items: [
            { to: '/app', label: t('nav.dashboard'), icon: <LayoutDashboard />, end: true },
            { to: '/app/dossiers', label: t('nav.dossiers'), icon: <FolderOpen /> },
          ],
        },
        {
          label: 'Mon instance',
          items: [
            { to: '/app/utilisateurs', label: t('nav.utilisateurs'), icon: <Users /> },
            { to: '/app/marque', label: t('nav.marque'), icon: <Palette /> },
          ],
        },
        {
          label: 'Réseau StandSet',
          items: [
            { to: '/app/redevances', label: t('nav.redevances'), icon: <Landmark /> },
            { to: '/app/declarations', label: t('nav.declarations'), icon: <Send /> },
          ],
        },
      ]
    : [
        {
          items: [
            { to: '/app', label: t('nav.dashboard'), icon: <LayoutDashboard />, end: true },
            { to: '/app/dossiers', label: t('nav.mesClients'), icon: <FolderOpen /> },
            { to: '/app/mes-taches', label: t('nav.mesTaches'), icon: <ListChecks /> },
            { to: '/app/support', label: t('nav.support'), icon: <HelpCircle /> },
          ],
        },
      ]
  return (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <Link to="/app" onClick={onNavigate} className="flex h-14 items-center gap-3 border-b border-line px-4">
        <TenantMark branding={licencie.branding} size="sm" />
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[14.5px] font-bold text-ink">{licencie.branding.nomCommercial}</span>
          <span className="block text-[11.5px] text-muted">Kit ISO 9001:2026</span>
        </span>
      </Link>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <SidebarNav sections={sections} tone="light" onNavigate={onNavigate} />
      </div>
      <div className="flex items-center gap-2 border-t border-line px-5 py-3 text-[11.5px] text-muted">
        <StandSetMark className="size-4" />
        {t('nav.poweredBy')}
      </div>
    </div>
  )
}

export function TenantLayout() {
  const { licencie } = useTenant()
  const user = useCurrentUser()
  const mobileOpen = useUi((s) => s.mobileNavOpen)
  const setMobile = useUi((s) => s.setMobileNav)
  const location = useLocation()
  const navigate = useNavigate()
  const style = licencie ? accentStyle(licencie.branding.accentColor) : undefined
  const needsOnboarding = user?.role === 'LICENCIE_ADMIN' && licencie && !licencie.onboarded && !location.pathname.startsWith('/app/bienvenue')

  return (
    <div style={style} className="flex min-h-dvh flex-col">
      <ImpersonationBanner />
      <div className="flex min-h-0 flex-1">
        <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 lg:block print:hidden">
          <SidebarBody />
        </aside>
        <NavDrawer open={mobileOpen} onOpenChange={setMobile} label="Menu">
          <div style={style} className="h-full">
            <SidebarBody onNavigate={() => setMobile(false)} />
          </div>
        </NavDrawer>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar base="/app" />
          <main id="contenu" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {needsOnboarding && (
              <NewVersionBanner className="mb-6" actionLabel="Personnaliser" onAction={() => navigate('/app/bienvenue')}>
                Votre instance n'est pas encore personnalisée : ajoutez votre logo et votre couleur pour vos clients.
              </NewVersionBanner>
            )}
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
