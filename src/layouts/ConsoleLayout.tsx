import { Building2, ChevronsLeft, ClipboardCheck, FileInput, History, Landmark, Layers, LayoutDashboard, ReceiptText, Settings, Store } from 'lucide-react'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router-dom'
import { useNetworkOverview } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { useUi } from '@/stores/ui.store'
import { Button } from '@/components/ui/button'
import { NavDrawer } from '@/components/ui/dialog'
import { StandSetLogo, StandSetMark } from '@/components/common/Logo'
import { PageSkeleton } from '@/components/common/states'
import { TransitionClock } from '@/components/common/TransitionClock'
import { SidebarNav, type NavSection } from './shell/nav'
import { Topbar } from './shell/Topbar'

function useSections(): NavSection[] {
  const { t } = useTranslation()
  const { data } = useNetworkOverview()
  return [
    { label: t('nav.pilotage'), items: [{ to: '/console', label: t('nav.dashboard'), icon: <LayoutDashboard />, end: true }] },
    {
      label: t('nav.reseau'),
      items: [
        { to: '/console/licencies', label: t('nav.licencies'), icon: <Building2 />, badge: data?.enAttente },
        { to: '/console/entreprises', label: t('nav.entreprises'), icon: <Store /> },
      ],
    },
    {
      label: t('nav.finances'),
      items: [
        { to: '/console/redevances/grille', label: t('nav.grille'), icon: <Landmark /> },
        { to: '/console/redevances/journal', label: t('nav.journal'), icon: <ReceiptText />, badge: data?.lateCount },
      ],
    },
    { label: t('nav.conformite'), items: [{ to: '/console/habilitations', label: t('nav.habilitations'), icon: <ClipboardCheck /> }] },
    {
      label: t('nav.contenu'),
      items: [
        { to: '/console/kit', label: t('nav.kit'), icon: <Layers /> },
        { to: '/console/import', label: t('nav.import'), icon: <FileInput /> },
      ],
    },
    {
      label: t('nav.systeme'),
      items: [
        { to: '/console/parametres', label: t('nav.parametres'), icon: <Settings /> },
        { to: '/console/journal-acces', label: t('nav.journalAcces'), icon: <History /> },
      ],
    },
  ]
}

function SidebarBody({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const sections = useSections()
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-brand-950 to-[oklch(0.25_0.09_264)] text-white">
      <div className={cn('flex h-14 items-center border-b border-white/10', collapsed ? 'justify-center' : 'px-5')}>
        <Link to="/console" onClick={onNavigate} aria-label="Console StandSet">
          {collapsed ? <StandSetMark inverted /> : <StandSetLogo inverted subtitle="Console concessionnaire" />}
        </Link>
      </div>
      <div className={cn('flex-1 overflow-y-auto py-5 scrollbar-none', collapsed ? 'px-2' : 'px-3')}>
        <SidebarNav sections={sections} tone="dark" collapsed={collapsed} onNavigate={onNavigate} />
      </div>
      {!collapsed && (
        <div className="border-t border-white/10 p-4">
          <TransitionClock tone="dark" />
        </div>
      )}
    </div>
  )
}

export function ConsoleLayout() {
  const collapsed = useUi((s) => s.sidebarCollapsed)
  const toggle = useUi((s) => s.toggleSidebar)
  const mobileOpen = useUi((s) => s.mobileNavOpen)
  const setMobile = useUi((s) => s.setMobileNav)
  return (
    <div className="flex min-h-dvh">
      <aside className={cn('sticky top-0 hidden h-dvh shrink-0 transition-[width] duration-200 lg:block', collapsed ? 'w-[68px]' : 'w-[256px]')}>
        <SidebarBody collapsed={collapsed} />
        <Button
          variant="outline"
          size="icon-sm"
          onClick={toggle}
          className="absolute top-3.5 -right-4 z-[var(--z-sidebar)] rounded-full"
          aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
        >
          <ChevronsLeft className={cn('transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </aside>
      <NavDrawer open={mobileOpen} onOpenChange={setMobile} label="Menu de la Console">
        <SidebarBody onNavigate={() => setMobile(false)} />
      </NavDrawer>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar base="/console" />
        <main id="contenu" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
