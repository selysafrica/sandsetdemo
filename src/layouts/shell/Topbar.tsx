import { Bell, CheckCheck, CreditCard, FileCheck2, Layers, ListChecks, LogOut, Menu, RefreshCw, Search, ShieldAlert, User as UserIcon, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { qk, useAppMutation, useNotifications } from '@/hooks/queries'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { relative } from '@/lib/format'
import { ROLE_META } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { notificationsService } from '@/services/notifications.service'
import { useSession } from '@/stores/session.store'
import { useUi } from '@/stores/ui.store'
import type { AppNotification, NotificationType } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Avatar, Kbd } from '@/components/ui/display'
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger, Popover, PopoverContent, PopoverTrigger } from '@/components/ui/overlays'

export const NOTIF_ICON: Record<NotificationType, ReactNode> = {
  KIT_VERSION: <Layers />,
  RELANCE: <RefreshCw />,
  HABILITATION: <ShieldAlert />,
  TACHE: <ListChecks />,
  DOCUMENT: <FileCheck2 />,
  PAIEMENT: <Wallet />,
  AUDIT: <ShieldAlert />,
}

export function NotificationRow({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  return (
    <button type="button" onClick={() => onOpen(n)} className="flex w-full gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-brand-50/60">
      <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-md [&_svg]:size-4', n.readAt ? 'bg-panel text-muted' : 'bg-brand-50 text-brand-700')}>{NOTIF_ICON[n.type] ?? <CreditCard />}</span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[13.5px] leading-snug', n.readAt ? 'text-ink-soft' : 'font-semibold text-ink')}>{n.title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{n.body}</span>
        <span className="mt-1 block text-[11.5px] text-subtle">{relative(n.createdAt)}</span>
      </span>
      {!n.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Non lue" />}
    </button>
  )
}

function NotificationsPopover({ base }: { base: string }) {
  const { data = [] } = useNotifications()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const unread = data.filter((n) => !n.readAt).length
  const markAll = useAppMutation(notificationsService.markAllRead, { invalidate: [qk.notifications] })
  const open = async (n: AppNotification) => {
    await notificationsService.markRead([n.id])
    qc.invalidateQueries({ queryKey: qk.notifications })
    if (n.link) navigate(n.link)
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}>
          <Bell />
          {unread > 0 && <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 font-mono text-[10px] leading-4 text-white">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(380px,calc(100vw-24px))] p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[14px] font-bold">Notifications</h2>
          <Button variant="ghost" size="sm" disabled={!unread} onClick={() => markAll.mutate(undefined)}>
            <CheckCheck /> Tout marquer lu
          </Button>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-1.5">
          {data.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-muted">Aucune notification pour le moment.</p>
          ) : (
            data.slice(0, 8).map((n) => <NotificationRow key={n.id} n={n} onOpen={open} />)
          )}
        </div>
        <div className="border-t border-line p-1.5">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to={`${base}/notifications`}>Voir toutes les notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function UserMenu({ base }: { base: string }) {
  const user = useCurrentUser()
  const logout = useSession((s) => s.logout)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()
  if (!user) return null
  const name = `${user.firstName} ${user.lastName}`
  return (
    <DropdownMenu>
      <DropdownTrigger asChild>
        <button type="button" className="flex items-center gap-2.5 rounded-md py-1 pr-2 pl-1 transition-colors hover:bg-panel" aria-label="Menu du compte">
          <Avatar name={name} size="sm" color={ROLE_META[user.role].color} />
          <span className="hidden text-left leading-tight lg:block">
            <span className="block text-[13px] font-semibold text-ink">{name}</span>
            <span className="block text-[11.5px] text-muted">{ROLE_META[user.role].short}</span>
          </span>
        </button>
      </DropdownTrigger>
      <DropdownContent className="w-60">
        <DropdownLabel>
          <span className="block text-[13px] font-semibold text-ink">{name}</span>
          <span className="block truncate font-normal">{user.email}</span>
        </DropdownLabel>
        <DropdownSeparator />
        <DropdownItem onSelect={() => navigate(`${base}/profil`)}>
          <UserIcon /> {t('nav.profil')}
        </DropdownItem>
        <DropdownItem onSelect={() => navigate(`${base}/notifications`)}>
          <Bell /> {t('nav.notifications')}
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          danger
          onSelect={() => {
            logout()
            qc.clear()
            navigate('/connexion')
          }}
        >
          <LogOut /> {t('nav.logout')}
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  )
}

export function Topbar({ base, left }: { base: string; left?: ReactNode }) {
  const setCommandOpen = useUi((s) => s.setCommandOpen)
  const setMobileNav = useUi((s) => s.setMobileNav)
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-2 border-b border-line bg-surface/92 px-3 backdrop-blur-sm sm:px-5 print:hidden">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Ouvrir le menu">
        <Menu />
      </Button>
      {left}
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-canvas px-3 text-[13px] text-muted transition-colors hover:border-brand-300 hover:text-ink-soft sm:max-w-[380px]"
      >
        <Search className="size-4" aria-hidden />
        <span className="truncate">{t('nav.search')}</span>
        <span className="ml-auto hidden items-center gap-1 sm:flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <span className="hidden flex-1 sm:block" aria-hidden />
      <NotificationsPopover base={base} />
      <UserMenu base={base} />
    </header>
  )
}
