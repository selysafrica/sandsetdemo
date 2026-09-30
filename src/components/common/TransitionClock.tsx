import { Hourglass } from 'lucide-react'
import { date, transitionRemaining, TRANSITION_DEADLINE } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Countdown to the end of the ISO 9001:2015 → 2026 transition period. */
export function TransitionClock({ variant = 'compact', tone = 'light', className }: { variant?: 'hero' | 'compact'; tone?: 'light' | 'dark'; className?: string }) {
  const r = transitionRemaining()
  const dark = tone === 'dark'
  if (variant === 'compact')
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Hourglass className={cn('size-4 shrink-0', dark ? 'text-brand-300' : 'text-brand-600')} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className={cn('flex items-baseline justify-between gap-2 text-[12px] whitespace-nowrap', dark ? 'text-brand-100' : 'text-ink-soft')}>
            <span>
              Transition · <span className="font-semibold">{date(TRANSITION_DEADLINE)}</span>
            </span>
            <span className={cn('font-mono tabular', dark ? 'text-white' : 'text-ink')}>J-{r.totalDays}</span>
          </div>
          <div className={cn('mt-1.5 h-1 overflow-hidden rounded-full', dark ? 'bg-white/15' : 'bg-panel')}>
            <div className={cn('h-full rounded-full', dark ? 'bg-brand-300' : 'bg-brand-500')} style={{ width: `${r.elapsedPct}%` }} />
          </div>
        </div>
      </div>
    )

  const units = [
    { v: r.years, l: r.years > 1 ? 'ans' : 'an' },
    { v: r.months, l: 'mois' },
    { v: r.days, l: r.days > 1 ? 'jours' : 'jour' },
  ]
  return (
    <div className={cn(className)}>
      <p className={cn('text-[13px] font-semibold', dark ? 'text-brand-200' : 'text-brand-700')}>Il reste pour migrer vers ISO 9001:2026</p>
      <div className="mt-2 flex items-end gap-5">
        {units.map((u) => (
          <div key={u.l}>
            <div className={cn('font-mono text-[40px] leading-none font-medium tabular', dark ? 'text-white' : 'text-ink')}>{String(u.v).padStart(2, '0')}</div>
            <div className={cn('mt-1 text-[12px] font-semibold', dark ? 'text-brand-200' : 'text-muted')}>{u.l}</div>
          </div>
        ))}
      </div>
      <div className={cn('mt-4 h-1.5 max-w-sm overflow-hidden rounded-full', dark ? 'bg-white/15' : 'bg-panel')}>
        <div className={cn('h-full rounded-full', dark ? 'bg-brand-300' : 'bg-brand-500')} style={{ width: `${r.elapsedPct}%` }} />
      </div>
      <p className={cn('mt-2 text-[12.5px]', dark ? 'text-brand-200' : 'text-muted')}>
        Échéance : {date(TRANSITION_DEADLINE)} · {Math.round(r.elapsedPct)} % de la période écoulée
      </p>
    </div>
  )
}
