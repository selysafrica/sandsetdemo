import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  to?: string
}

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  crumbs?: Crumb[]
  actions?: ReactNode
  meta?: ReactNode
  className?: string
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-[12.5px] text-muted">
        {crumbs.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {c.to ? (
              <Link to={c.to} className="rounded-sm hover:text-ink hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className="text-ink-soft" aria-current="page">
                {c.label}
              </span>
            )}
            {i < crumbs.length - 1 && <ChevronRight className="size-3.5" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageHeader({ title, subtitle, crumbs, actions, meta, className }: Props) {
  return (
    <header className={cn('mb-6', className)}>
      {crumbs && <Breadcrumbs crumbs={crumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[24px] leading-8 font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 max-w-[70ch] text-[14px] text-muted">{subtitle}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
