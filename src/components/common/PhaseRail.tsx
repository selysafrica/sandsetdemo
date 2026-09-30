import { Check } from 'lucide-react'
import type { PhaseProgress } from '@/lib/calculations/progress'
import { cn } from '@/lib/utils'

export const PHASE_TITLES = [
  'Cadrage & diagnostic',
  "Analyse d'écart",
  'Planification des actions',
  'Mise en œuvre & documentation',
  'Formation & sensibilisation',
  'Audit interne & certification',
]

interface Props {
  phases: PhaseProgress[]
  current: number
  selected?: number | null
  onSelect?: (phase: number) => void
  variant?: 'full' | 'mini'
  /** Numbers and percentages only, for narrow containers. */
  dense?: boolean
  className?: string
}

/** The six transition phases as connected stations, filled by progress. */
export function PhaseRail({ phases, current, selected, onSelect, variant = 'full', dense, className }: Props) {
  if (variant === 'mini')
    return (
      <div className={cn('flex items-center gap-1', className)} role="img" aria-label={`Phase ${current} sur 6`}>
        {phases.map((p) => (
          <span
            key={p.phase}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              p.pct === 100 ? 'bg-accent' : p.phase === current ? 'bg-accent/45' : 'bg-panel',
            )}
          />
        ))}
      </div>
    )

  return (
    <ol className={cn('grid gap-y-5', dense ? 'grid-cols-6' : 'grid-cols-3 md:grid-cols-6', className)} aria-label="Phases du plan de transition">
      {phases.map((p, i) => {
        const done = p.pct === 100
        const active = p.phase === current
        const isSelected = selected === p.phase
        const Tag = onSelect ? 'button' : 'div'
        return (
          <li key={p.phase} className="relative flex flex-col items-center text-center">
            {i < phases.length - 1 && (
              <span className="absolute top-[17px] left-[calc(50%+20px)] hidden h-[3px] w-[calc(100%-40px)] overflow-hidden rounded-full bg-panel md:block" aria-hidden>
                <span className="block h-full bg-accent transition-[width] duration-700 ease-out" style={{ width: done ? '100%' : active ? `${p.pct}%` : '0%' }} />
              </span>
            )}
            <Tag
              {...(onSelect ? { type: 'button' as const, onClick: () => onSelect(p.phase), 'aria-pressed': isSelected } : {})}
              className={cn('group flex flex-col items-center gap-2 rounded-lg px-1 outline-offset-4', onSelect && 'cursor-pointer')}
            >
              <span
                className={cn(
                  'relative grid size-9 place-items-center rounded-full border-2 font-mono text-[13px] font-medium transition-[background-color,border-color,box-shadow] duration-200',
                  done && 'border-accent bg-accent text-accent-fg',
                  active && !done && 'border-accent bg-surface text-accent shadow-[0_0_0_4px_var(--accent-soft)]',
                  !done && !active && 'border-line-strong bg-surface text-muted',
                  isSelected && 'ring-2 ring-accent ring-offset-2',
                  onSelect && 'group-hover:border-accent',
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : p.phase}
              </span>
              {dense ? (
                <span className="font-mono text-[11px] text-muted tabular">{p.pct} %</span>
              ) : (
                <>
                  <span className="max-w-[16ch] text-[12px] leading-tight font-semibold text-ink">{PHASE_TITLES[p.phase - 1]}</span>
                  <span className="font-mono text-[11px] text-muted tabular">
                    {p.done}/{p.total} · {p.pct} %
                  </span>
                </>
              )}
            </Tag>
          </li>
        )
      })}
    </ol>
  )
}
