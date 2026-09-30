import { Layers, WifiOff } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useOnline } from '@/hooks/useOnline'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function OfflineBanner() {
  const online = useOnline()
  const { t } = useTranslation()
  const wasOffline = useRef(false)
  useEffect(() => {
    if (!online) wasOffline.current = true
    else if (wasOffline.current) {
      wasOffline.current = false
      toast.success(t('common.backOnline'))
    }
  }, [online, t])
  if (online) return null
  return (
    <div role="status" className="sticky top-0 z-[var(--z-sticky)] flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-[13px] font-medium text-ink">
      <WifiOff className="size-4 text-warning" aria-hidden />
      {t('common.offline')}
    </div>
  )
}

export function NewVersionBanner({ children, onAction, actionLabel = 'Voir les changements', className }: { children: ReactNode; onAction?: () => void; actionLabel?: string; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3', className)} role="status">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface text-brand-700 shadow-xs">
        <Layers className="size-4" aria-hidden />
      </span>
      <p className="min-w-0 flex-1 text-[13.5px] text-brand-900">{children}</p>
      {onAction && (
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export function InfoNote({ children, icon, className }: { children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-3 rounded-lg bg-panel px-4 py-3 text-[13px] text-ink-soft [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-brand-600', className)}>
      {icon}
      <div className="min-w-0">{children}</div>
    </div>
  )
}
