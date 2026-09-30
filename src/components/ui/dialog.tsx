import * as D from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

const overlay =
  'fixed inset-0 z-[var(--z-overlay)] bg-brand-950/35 data-[state=open]:animate-fade-in'

interface ContentProps {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  hideClose?: boolean
  onInteractOutside?: (e: Event) => void
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export function DialogContent({ title, description, children, footer, size = 'md', className, hideClose, onInteractOutside }: ContentProps) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={hideClose ? (e) => e.preventDefault() : undefined}
        className={cn(
          'fixed top-1/2 left-1/2 z-[var(--z-modal)] flex max-h-[min(88vh,860px)] w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-line bg-surface shadow-pop outline-none data-[state=open]:animate-rise',
          sizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 pt-5 pb-4">
          <div className="min-w-0">
            <D.Title className="text-[17px] font-bold text-ink">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-[13.5px] text-muted">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{typeof title === 'string' ? title : ''}</D.Description>
            )}
          </div>
          {!hideClose && (
            <D.Close className="-mt-1 -mr-2 rounded-md p-1.5 text-muted transition-colors hover:bg-panel hover:text-ink" aria-label="Fermer">
              <X className="size-4" />
            </D.Close>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas/60 px-6 py-3.5">{footer}</div>}
      </D.Content>
    </D.Portal>
  )
}

interface SheetProps extends Omit<ContentProps, 'size'> {
  width?: 'md' | 'lg' | 'full'
  headerExtra?: ReactNode
}

const widths = { md: 'sm:max-w-[520px]', lg: 'sm:max-w-[680px]', full: 'sm:max-w-[min(1100px,96vw)]' }

/** Right-hand drawer for rich editing; full screen on mobile. */
export function SheetContent({ title, description, children, footer, width = 'md', className, headerExtra }: SheetProps) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content
        className={cn(
          'fixed inset-y-0 right-0 z-[var(--z-modal)] flex w-full flex-col border-l border-line bg-surface shadow-pop outline-none data-[state=open]:animate-slide-in-right',
          widths[width],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 pt-5 pb-4">
          <div className="min-w-0 flex-1">
            <D.Title className="text-[17px] font-bold text-ink">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-[13.5px] text-muted">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{typeof title === 'string' ? title : ''}</D.Description>
            )}
          </div>
          <div className="flex items-center gap-1">
            {headerExtra}
            <D.Close className="rounded-md p-1.5 text-muted transition-colors hover:bg-panel hover:text-ink" aria-label="Fermer">
              <X className="size-4" />
            </D.Close>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas/60 px-6 py-3.5">{footer}</div>}
      </D.Content>
    </D.Portal>
  )
}

/** Left navigation drawer used on mobile. */
export function NavDrawer({ open, onOpenChange, children, label }: { open: boolean; onOpenChange: (o: boolean) => void; children: ReactNode; label: string }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className={overlay} />
        <D.Content className="fixed inset-y-0 left-0 z-[var(--z-modal)] flex w-[280px] flex-col outline-none data-[state=open]:animate-fade-in">
          <D.Title className="sr-only">{label}</D.Title>
          <D.Description className="sr-only">{label}</D.Description>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
