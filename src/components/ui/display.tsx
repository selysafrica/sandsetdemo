import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn, initials } from '@/lib/utils'
import type { Tone } from '@/lib/labels'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-px text-[12px] font-semibold whitespace-nowrap [&_svg]:size-3',
  {
    variants: {
      tone: {
        neutral: 'border-line-strong bg-panel text-ink-soft',
        brand: 'border-brand-200 bg-brand-50 text-brand-800',
        success: 'border-[oklch(0.86_0.07_158)] bg-success-soft text-success',
        warning: 'border-[oklch(0.86_0.09_80)] bg-warning-soft text-warning',
        danger: 'border-[oklch(0.86_0.07_27)] bg-danger-soft text-danger',
        violet: 'border-[oklch(0.86_0.07_295)] bg-[oklch(0.96_0.03_295)] text-role-entreprise',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-line bg-surface shadow-card', className)} {...props} />
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-4 pb-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-panel', className)} aria-hidden />
}

export function Progress({ value, className, tone = 'accent', label }: { value: number; className?: string; tone?: 'accent' | Tone; label?: string }) {
  const color = {
    accent: 'bg-accent',
    brand: 'bg-brand-600',
    success: 'bg-success',
    warning: 'bg-[oklch(0.72_0.15_75)]',
    danger: 'bg-danger',
    neutral: 'bg-subtle',
    violet: 'bg-role-entreprise',
  }[tone]
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-panel', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

const avatarPalette = ['#1a3fc4', '#0e7490', '#047857', '#9a3412', '#7c3aed', '#be123c', '#334155', '#b45309']

export function Avatar({ name, size = 'md', className, color }: { name: string; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string; color?: string }) {
  const [first, ...rest] = name.split(' ')
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  const bg = color ?? avatarPalette[hash % avatarPalette.length]
  const dims = { xs: 'size-6 text-[10px]', sm: 'size-7 text-[11px]', md: 'size-9 text-[13px]', lg: 'size-12 text-base' }[size]
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-bold text-white ring-2 ring-surface', dims, className)}
      style={{ background: bg }}
      title={name}
      aria-label={name}
    >
      {initials(first, rest.at(-1))}
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface px-1 font-mono text-[11px] text-muted shadow-xs">
      {children}
    </kbd>
  )
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px bg-line', className)} role="separator" />
}
