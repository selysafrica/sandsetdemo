import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/display'

export function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target)
  const from = useRef(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    const start = performance.now()
    const origin = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      setValue(origin + (target - origin) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

interface Props {
  label: string
  value: number
  format?: (v: number) => string
  hint?: ReactNode
  delta?: { value: string; positive: boolean }
  icon?: ReactNode
  to?: string
  footer?: ReactNode
  loading?: boolean
  className?: string
}

export function KpiCard({ label, value, format = (v) => Math.round(v).toLocaleString('fr-FR'), hint, delta, icon, to, footer, loading, className }: Props) {
  const animated = useCountUp(value)
  const body = (
    <div className={cn('flex h-full flex-col rounded-lg border border-line bg-surface p-4 shadow-card transition-colors', to && 'hover:border-brand-200', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
        {icon && <span className="grid size-8 place-items-center rounded-md bg-brand-50 text-brand-700 [&_svg]:size-4">{icon}</span>}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-[26px] leading-9 font-medium tracking-tight text-ink tabular" aria-live="polite">
            {format(animated)}
          </span>
          {delta && (
            <span className={cn('inline-flex items-center text-[12.5px] font-semibold', delta.positive ? 'text-success' : 'text-danger')}>
              {delta.positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {delta.value}
            </span>
          )}
        </div>
      )}
      {hint && <div className="mt-1 text-[12.5px] text-muted">{hint}</div>}
      {footer && <div className="mt-auto pt-3">{footer}</div>}
    </div>
  )
  return to ? (
    <Link to={to} className="block rounded-lg">
      {body}
    </Link>
  ) : (
    body
  )
}
