import { motion, useReducedMotion } from 'motion/react'
import { coverageTone } from '@/lib/calculations/coverage'
import { cn } from '@/lib/utils'
import type { Score } from '@/types/domain'

const toneColor = {
  danger: 'var(--color-danger)',
  warning: 'oklch(0.7 0.15 70)',
  brand: 'var(--color-brand-600)',
  success: 'var(--color-success)',
}

export const SCORE_COLORS: Record<Score | 'null' | 'na', string> = {
  0: 'oklch(0.6 0.19 27)',
  1: 'oklch(0.7 0.16 50)',
  2: 'oklch(0.8 0.13 85)',
  3: 'oklch(0.66 0.14 245)',
  4: 'oklch(0.56 0.13 158)',
  null: 'var(--color-panel)',
  na: 'repeating-linear-gradient(135deg, var(--color-panel) 0 4px, var(--color-line) 4px 5px)',
}

interface RingProps {
  value: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  label?: string
  sublabel?: string
  className?: string
  toned?: boolean
}

const ringDims = {
  sm: { box: 44, stroke: 5, text: 'text-[11px]' },
  md: { box: 72, stroke: 7, text: 'text-[16px]' },
  lg: { box: 120, stroke: 10, text: 'text-[26px]' },
  xl: { box: 160, stroke: 12, text: 'text-[34px]' },
}

export function CoverageRing({ value, size = 'md', label, sublabel, className, toned = true }: RingProps) {
  const reduce = useReducedMotion()
  const { box, stroke, text } = ringDims[size]
  const r = (box - stroke) / 2
  const c = 2 * Math.PI * r
  const color = toned ? toneColor[coverageTone(value)] : 'var(--accent)'
  return (
    <div className={cn('relative inline-grid shrink-0 place-items-center', className)} style={{ width: box, height: box }} role="img" aria-label={`${label ?? 'Couverture'} : ${Math.round(value)} %`}>
      <svg width={box} height={box} className="-rotate-90">
        <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="var(--color-panel)" strokeWidth={stroke} />
        <motion.circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - value / 100) : c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(100, value)) / 100) }}
          transition={{ duration: reduce ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={cn('font-mono leading-none font-medium text-ink tabular', text)}>
            {Math.round(value)}
            <span className="text-[0.6em] text-muted">%</span>
          </div>
          {sublabel && size !== 'sm' && <div className="mt-1 text-[11px] font-semibold text-muted">{sublabel}</div>}
        </div>
      </div>
    </div>
  )
}

export function ScoreBar({ value, className, showValue = true }: { value: number; className?: string; showValue?: boolean }) {
  const color = toneColor[coverageTone(value)]
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${value}%`, background: color }} />
      </div>
      {showValue && <span className="w-10 text-right font-mono text-[12.5px] text-ink-soft tabular">{value} %</span>}
    </div>
  )
}

/** Distribution of document statuses in one bar. */
export function SegmentBar({ parts, className }: { parts: { value: number; color: string; label: string }[]; className?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1
  return (
    <div className={cn('flex h-2 w-full overflow-hidden rounded-full bg-panel', className)} role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(', ')}>
      {parts.map((p) => (
        <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} className="h-full transition-[width] duration-500" />
      ))}
    </div>
  )
}
