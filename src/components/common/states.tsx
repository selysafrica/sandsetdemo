import { AlertTriangle, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/display'

/** Line illustration: a ruled register page. */
function LedgerIllustration() {
  return (
    <svg width="96" height="80" viewBox="0 0 96 80" fill="none" aria-hidden>
      <rect x="14" y="6" width="60" height="70" rx="6" fill="var(--color-brand-50)" stroke="var(--color-brand-300)" strokeWidth="1.5" />
      <rect x="22" y="2" width="60" height="70" rx="6" fill="white" stroke="var(--color-brand-400)" strokeWidth="1.5" />
      {[18, 28, 38, 48].map((y) => (
        <line key={y} x1="30" x2="74" y1={y} y2={y} stroke="var(--color-brand-200)" strokeWidth="1.5" strokeLinecap="round" />
      ))}
      <line x1="30" x2="52" y1="58" y2="58" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="74" cy="60" r="11" fill="var(--color-brand-600)" />
      <path d="M69.5 60l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function EmptyState({ title, description, action, className, icon }: { title: string; description?: ReactNode; action?: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <div className={cn('flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center', className)}>
      {icon ?? <LedgerIllustration />}
      <h3 className="mt-4 text-[15px] font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-[52ch] text-[13.5px] text-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const message = error instanceof Error ? error.message : 'Une erreur inattendue est survenue.'
  return (
    <div className={cn('flex flex-col items-center rounded-lg border border-danger/25 bg-danger-soft/40 px-6 py-10 text-center', className)} role="alert">
      <AlertTriangle className="size-7 text-danger" aria-hidden />
      <h3 className="mt-3 text-[15px] font-bold text-ink">Chargement impossible</h3>
      <p className="mt-1 max-w-[52ch] text-[13.5px] text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCcw /> Réessayer
        </Button>
      )}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="animate-fade-in" aria-busy="true" aria-label="Chargement">
      <Skeleton className="mb-2 h-4 w-40" />
      <Skeleton className="mb-8 h-8 w-72" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-lg lg:col-span-2" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  )
}
