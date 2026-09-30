import { Outlet, ScrollRestoration } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { OfflineBanner } from '@/components/common/banners'
import { CommandPalette } from './shell/CommandPalette'
import { PersonaSwitcher, SessionExpiredDialog } from './shell/DemoTools'

export function RootLayout() {
  const user = useCurrentUser()
  return (
    <>
      <a href="#contenu" className="sr-only z-[var(--z-toast)] rounded-md bg-brand-700 px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Aller au contenu
      </a>
      <OfflineBanner />
      <Outlet />
      {user && <CommandPalette />}
      {user && <SessionExpiredDialog />}
      <PersonaSwitcher />
      <ScrollRestoration />
    </>
  )
}
