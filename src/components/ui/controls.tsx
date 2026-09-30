import * as C from '@radix-ui/react-checkbox'
import * as S from '@radix-ui/react-switch'
import * as Tabs from '@radix-ui/react-tabs'
import { Check, Minus } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Checkbox({ className, ...props }: ComponentProps<typeof C.Root>) {
  return (
    <C.Root
      className={cn(
        'peer grid size-[18px] shrink-0 place-items-center rounded-[5px] border border-line-strong bg-surface shadow-xs transition-colors hover:border-brand-400 data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <C.Indicator className="text-accent-fg">
        {props.checked === 'indeterminate' ? <Minus className="size-3.5" strokeWidth={3} /> : <Check className="size-3.5" strokeWidth={3} />}
      </C.Indicator>
    </C.Root>
  )
}

export function Switch({ className, ...props }: ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn(
        'relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center rounded-full bg-line-strong transition-colors data-[state=checked]:bg-accent disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <S.Thumb className="block size-[18px] translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out data-[state=checked]:translate-x-[20px]" />
    </S.Root>
  )
}

export function CheckRow({ checked, onCheckedChange, label, description, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 rounded-md py-1.5', disabled && 'cursor-not-allowed opacity-60')}>
      <Checkbox className="mt-0.5" checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} disabled={disabled} />
      <span className="min-w-0">
        <span className="block text-sm text-ink">{label}</span>
        {description && <span className="block text-[12.5px] text-muted">{description}</span>}
      </span>
    </label>
  )
}

export const TabsRoot = Tabs.Root
export const TabsContent = Tabs.Content

export function TabsList({ className, ...props }: ComponentProps<typeof Tabs.List>) {
  return <Tabs.List className={cn('flex gap-1 overflow-x-auto border-b border-line scrollbar-none', className)} {...props} />
}

export function TabsTrigger({ className, children, count, ...props }: ComponentProps<typeof Tabs.Trigger> & { count?: number }) {
  return (
    <Tabs.Trigger
      className={cn(
        'relative -mb-px flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 pt-2 pb-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink data-[state=active]:border-accent data-[state=active]:text-ink',
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && <span className="rounded-full bg-panel px-1.5 py-px font-mono text-[11px] text-ink-soft tabular">{count}</span>}
    </Tabs.Trigger>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode; icon?: ReactNode }[]
  size?: 'sm' | 'md'
  label: string
  className?: string
}

export function Segmented<T extends string>({ value, onChange, options, size = 'md', label, className }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-md border border-line bg-panel p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[5px] font-semibold text-muted transition-[background-color,color,box-shadow] duration-150 hover:text-ink [&_svg]:size-4',
            size === 'sm' ? 'h-7 px-2.5 text-[12.5px]' : 'h-8 px-3 text-[13px]',
            value === o.value && 'bg-surface text-ink shadow-xs',
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={cn('flex items-center gap-2', className)} aria-label="Étapes">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-medium transition-colors',
                done && 'border-accent bg-accent text-accent-fg',
                active && 'border-accent bg-accent-soft text-accent',
                !done && !active && 'border-line-strong text-muted',
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn('truncate text-[13px] font-semibold', active ? 'text-ink' : 'text-muted', 'hidden sm:inline')}>{s}</span>
            {i < steps.length - 1 && <span className={cn('h-px min-w-4 flex-1', done ? 'bg-accent' : 'bg-line-strong')} />}
          </li>
        )
      })}
    </ol>
  )
}
