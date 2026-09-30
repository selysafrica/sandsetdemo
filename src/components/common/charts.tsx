import type { ReactNode } from 'react'

export const CHART_COLORS = {
  entree: 'oklch(0.31 0.118 264)',
  annuelle: 'oklch(0.51 0.222 264)',
  variable: 'oklch(0.672 0.172 264)',
  forfait: 'oklch(0.82 0.09 264)',
  encaisse: 'oklch(0.56 0.13 158)',
  line: 'oklch(0.915 0.013 264)',
  axis: 'oklch(0.49 0.028 264)',
}

export const axisProps = {
  stroke: CHART_COLORS.axis,
  fontSize: 11.5,
  tickLine: false,
  axisLine: false,
}

interface TooltipPayload {
  name?: string | number
  value?: number | string
  color?: string
  dataKey?: string | number
}

export function ChartTooltip({ active, payload, label, format }: { active?: boolean; payload?: TooltipPayload[]; label?: ReactNode; format?: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] shadow-pop">
      {label && <p className="mb-1 font-semibold text-ink">{label}</p>}
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 text-ink-soft">
          <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
          {p.name}
          <span className="ml-auto pl-3 font-mono text-ink tabular">{format ? format(Number(p.value)) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function LegendDots({ items, className }: { items: { label: string; color: string }[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-soft ${className ?? ''}`}>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} aria-hidden />
          {i.label}
        </span>
      ))}
    </div>
  )
}
