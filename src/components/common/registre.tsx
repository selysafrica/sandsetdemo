import type { ReactNode } from 'react'
import { STATUS_META, ROLE_META, type AnyStatus } from '@/lib/labels'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/domain'
import { Badge } from '@/components/ui/display'

export function RefCode({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-[4px] bg-brand-50 px-1.5 py-px font-mono text-[11.5px] font-medium text-brand-800 tabular', className)}>
      {value}
    </span>
  )
}

export function Money({ value, className, tone }: { value: number; className?: string; tone?: 'auto' | 'danger' | 'muted' }) {
  return (
    <span
      className={cn(
        'font-mono whitespace-nowrap tabular',
        tone === 'danger' && 'text-danger',
        tone === 'muted' && 'text-muted',
        tone === 'auto' && value < 0 && 'text-danger',
        className,
      )}
    >
      {money(value)}
    </span>
  )
}

/** Section heading with a hairline rule — the register's ruled page. */
export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-end justify-between gap-3 border-b border-line pb-2', className)}>
      <h3 className="text-[13.5px] font-bold text-ink">{children}</h3>
      {action}
    </div>
  )
}

/** Label ........ value, as in a ledger entry. */
export function DottedLeader({ label, value, strong, className }: { label: ReactNode; value: ReactNode; strong?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-baseline gap-2 py-1.5 text-[13.5px]', className)}>
      <span className={cn('shrink-0', strong ? 'font-bold text-ink' : 'text-ink-soft')}>{label}</span>
      <span className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-line-strong" aria-hidden />
      <span className={cn('shrink-0 text-right', strong ? 'font-bold text-ink' : 'text-ink')}>{value}</span>
    </div>
  )
}

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <Badge tone={meta.tone} className={className}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {meta.label}
    </Badge>
  )
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const meta = ROLE_META[role]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[12px] font-semibold', className)} style={{ color: meta.color }}>
      <span className="size-2 rounded-full" style={{ background: meta.color }} aria-hidden />
      {meta.short}
    </span>
  )
}

/** Official-looking stamp for a record's status, used once per record header. */
export function Stamp({ status }: { status: 'HABILITE' | 'SUSPENDU' | 'EN_ATTENTE' | 'VALIDE' }) {
  const meta = STATUS_META[status]
  const color = { success: 'text-success', danger: 'text-danger', warning: 'text-warning' }[meta.tone as 'success'] ?? 'text-brand-700'
  return (
    <span
      className={cn('inline-flex -rotate-[4deg] items-center rounded-md border-[3px] border-double border-current px-2.5 py-0.5 font-mono text-[12px] font-medium tracking-[0.14em] uppercase opacity-85 select-none', color)}
      aria-label={`Statut : ${meta.label}`}
    >
      {meta.label}
    </span>
  )
}
