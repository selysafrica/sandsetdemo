import * as DM from '@radix-ui/react-dropdown-menu'
import * as P from '@radix-ui/react-popover'
import * as T from '@radix-ui/react-tooltip'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const DropdownMenu = DM.Root
export const DropdownTrigger = DM.Trigger

export function DropdownContent({ className, align = 'end', ...props }: ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={6}
        className={cn(
          'z-[var(--z-dropdown)] min-w-48 rounded-lg border border-line bg-surface p-1 shadow-pop data-[state=open]:animate-rise',
          className,
        )}
        {...props}
      />
    </DM.Portal>
  )
}

export function DropdownItem({ className, danger, ...props }: ComponentProps<typeof DM.Item> & { danger?: boolean }) {
  return (
    <DM.Item
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] text-ink outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-brand-50 [&_svg]:size-4 [&_svg]:text-muted',
        danger && 'text-danger data-[highlighted]:bg-danger-soft [&_svg]:text-danger',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownLabel({ className, ...props }: ComponentProps<typeof DM.Label>) {
  return <DM.Label className={cn('px-2.5 pt-2 pb-1 text-xs font-semibold text-muted', className)} {...props} />
}

export function DropdownSeparator() {
  return <DM.Separator className="my-1 h-px bg-line" />
}

export const Popover = P.Root
export const PopoverTrigger = P.Trigger
export const PopoverAnchor = P.Anchor

export function PopoverContent({ className, align = 'end', ...props }: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        sideOffset={8}
        className={cn('z-[var(--z-dropdown)] rounded-xl border border-line bg-surface shadow-pop outline-none data-[state=open]:animate-rise', className)}
        {...props}
      />
    </P.Portal>
  )
}

export const TooltipProvider = T.Provider

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  if (!content) return <>{children}</>
  return (
    <T.Root delayDuration={250}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className="z-[var(--z-tooltip)] max-w-72 rounded-md bg-brand-950 px-2.5 py-1.5 text-[12.5px] leading-snug text-white shadow-pop data-[state=delayed-open]:animate-fade-in"
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}
