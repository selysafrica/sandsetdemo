import { useRef, type KeyboardEvent } from 'react'
import { SCORE_HINTS, SCORE_LABELS } from '@/lib/calculations/coverage'
import { cn } from '@/lib/utils'
import type { Score } from '@/types/domain'
import { Tooltip } from '@/components/ui/overlays'
import { SCORE_COLORS } from './indicators'

type Value = Score | null | 'NA'

interface Props {
  value: Value
  onChange: (v: Value) => void
  size?: 'sm' | 'md'
  disabled?: boolean
}

const OPTIONS: Value[] = [0, 1, 2, 3, 4, 'NA']

/** 0–4 score scale plus "not applicable", keyboard navigable with arrow keys. */
export function ClauseScorePicker({ value, onChange, size = 'md', disabled }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + OPTIONS.length) % OPTIONS.length
    refs.current[next]?.focus()
    onChange(OPTIONS[next])
  }
  return (
    <div role="radiogroup" aria-label="Score de couverture" className="inline-flex gap-1">
      {OPTIONS.map((o, i) => {
        const selected = value === o
        const label = o === 'NA' ? 'N/A' : String(o)
        const hint = o === 'NA' ? 'Non applicable : exclue du calcul de couverture.' : `${SCORE_LABELS[o as Score]} — ${SCORE_HINTS[o as Score]}`
        return (
          <Tooltip key={label} content={hint}>
            <button
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={o === 'NA' ? 'Non applicable' : `${o} — ${SCORE_LABELS[o as Score]}`}
              tabIndex={selected || (value === null && i === 0) ? 0 : -1}
              disabled={disabled}
              onKeyDown={(e) => onKey(e, i)}
              onClick={() => onChange(selected ? null : o)}
              className={cn(
                'grid place-items-center rounded-md border font-mono font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-95 disabled:opacity-50',
                size === 'sm' ? 'h-7 min-w-7 px-1.5 text-[12px]' : 'h-10 min-w-10 px-2 text-sm',
                selected ? 'border-transparent text-white shadow-xs' : 'border-line-strong bg-surface text-ink-soft hover:border-brand-300 hover:text-ink',
                selected && o === 'NA' && 'text-ink',
              )}
              style={selected ? { background: o === 'NA' ? 'var(--color-line-strong)' : SCORE_COLORS[o as Score] } : undefined}
            >
              {label}
            </button>
          </Tooltip>
        )
      })}
    </div>
  )
}

export function ScoreDot({ score, applicable = true, className }: { score: Score | null; applicable?: boolean; className?: string }) {
  if (!applicable)
    return (
      <span className={cn('inline-flex h-6 min-w-9 items-center justify-center rounded-md border border-line-strong px-1.5 font-mono text-[11px] text-muted', className)}>N/A</span>
    )
  if (score === null)
    return (
      <span className={cn('inline-flex h-6 min-w-9 items-center justify-center rounded-md border border-dashed border-line-strong px-1.5 font-mono text-[11px] text-muted', className)} aria-label="Non évaluée">
        —
      </span>
    )
  return (
    <span
      className={cn('inline-flex h-6 min-w-9 items-center justify-center gap-1 rounded-md px-1.5 font-mono text-[11.5px] font-medium text-white', className)}
      style={{ background: SCORE_COLORS[score] }}
      title={SCORE_LABELS[score]}
    >
      {score}
      <span className="sr-only"> — {SCORE_LABELS[score]}</span>
    </span>
  )
}
