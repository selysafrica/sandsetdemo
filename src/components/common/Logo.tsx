import { cn } from '@/lib/utils'
import type { Branding } from '@/types/domain'
import { readableOn } from '@/lib/utils'

export function StandSetMark({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill={inverted ? '#ffffff' : 'var(--color-brand-700)'} />
      <path d="M9 11.5 16 7l7 4.5-7 4.5z" fill={inverted ? 'var(--color-brand-700)' : '#fff'} />
      <path d="M9 20.5 16 16l7 4.5-7 4.5z" fill={inverted ? 'var(--color-brand-700)' : '#fff'} />
      <path d="M16 16l7-4.5v9z" fill={inverted ? 'var(--color-brand-400)' : 'var(--color-brand-300)'} />
    </svg>
  )
}

export function StandSetLogo({ className, inverted, subtitle }: { className?: string; inverted?: boolean; subtitle?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <StandSetMark inverted={inverted} />
      <span className="leading-none">
        <span className={cn('block text-[17px] font-extrabold tracking-[-0.02em]', inverted ? 'text-white' : 'text-ink')}>StandSet</span>
        {subtitle && <span className={cn('mt-0.5 block text-[11px] font-semibold', inverted ? 'text-brand-200' : 'text-muted')}>{subtitle}</span>}
      </span>
    </span>
  )
}

export function TenantMark({ branding, size = 'md', className }: { branding: Pick<Branding, 'logoText' | 'accentColor' | 'logoUrl' | 'nomCommercial'>; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dims = { sm: 'size-7 text-[11px]', md: 'size-9 text-[13px]', lg: 'size-14 text-lg' }[size]
  if (branding.logoUrl)
    return <img src={branding.logoUrl} alt={`Logo ${branding.nomCommercial}`} className={cn('shrink-0 rounded-md object-contain', dims, className)} />
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-md font-extrabold tracking-tight', dims, className)}
      style={{ background: branding.accentColor, color: readableOn(branding.accentColor) }}
      aria-hidden
    >
      {branding.logoText}
    </span>
  )
}
