import { CHAPTER_TITLES } from '@/lib/labels'
import { SCORE_LABELS } from '@/lib/calculations/coverage'
import { cn } from '@/lib/utils'
import type { Clause, ClauseAssessment, Score } from '@/types/domain'
import { Tooltip } from '@/components/ui/overlays'
import { SCORE_COLORS } from './indicators'

interface Props {
  clauses: Clause[]
  assessments: ClauseAssessment[]
  onSelect?: (clauseId: string) => void
  size?: 'sm' | 'lg'
  highlight?: Set<string>
}

/** Every clause as a coloured cell, grouped by chapter 4 → 10. */
export function ClauseHeatmap({ clauses, assessments, onSelect, size = 'lg', highlight }: Props) {
  const byClause = new Map(assessments.map((a) => [a.clauseId, a]))
  const chapters = [...new Set(clauses.map((c) => c.chapitre))].sort((a, b) => a - b)
  const cell = size === 'lg' ? 'h-11 min-w-[52px] text-[11.5px]' : 'h-6 min-w-7 text-[9.5px]'
  return (
    <div className={cn('flex flex-col', size === 'lg' ? 'gap-3' : 'gap-1.5')}>
      {chapters.map((ch) => (
        <div key={ch} className="flex items-start gap-3">
          <div className={cn('shrink-0 pt-1', size === 'lg' ? 'w-40' : 'w-6')}>
            <span className="font-mono text-[12px] font-medium text-brand-700">§ {ch}</span>
            {size === 'lg' && <span className="block text-[12px] leading-tight text-muted">{CHAPTER_TITLES[ch]}</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            {clauses
              .filter((c) => c.chapitre === ch)
              .map((c) => {
                const a = byClause.get(c.id)
                const na = a && !a.applicable
                const score = a?.score ?? null
                const bg = na ? SCORE_COLORS.na : score === null ? SCORE_COLORS.null : SCORE_COLORS[score as Score]
                const text = score === null || na ? 'text-muted' : score === 2 ? 'text-ink' : 'text-white'
                const tip = `§ ${c.code} ${c.titre} — ${na ? 'Non applicable' : score === null ? 'Non évaluée' : SCORE_LABELS[score as Score]}`
                return (
                  <Tooltip key={c.id} content={tip}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(c.id)}
                      aria-label={tip}
                      className={cn(
                        'grid place-items-center rounded-[5px] px-1 font-mono font-medium transition-transform duration-150 hover:scale-105 hover:shadow-card',
                        cell,
                        text,
                        !onSelect && 'cursor-default',
                        highlight?.has(c.id) && 'ring-2 ring-offset-1 ring-brand-500',
                      )}
                      style={{ background: bg }}
                    >
                      {size === 'lg' ? c.code : ''}
                    </button>
                  </Tooltip>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ScoreLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-soft', className)}>
      {([0, 1, 2, 3, 4] as Score[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[3px]" style={{ background: SCORE_COLORS[s] }} aria-hidden />
          {s} · {SCORE_LABELS[s]}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-[3px] border border-line-strong" style={{ background: SCORE_COLORS.null }} aria-hidden />
        Non évaluée
      </span>
    </div>
  )
}
