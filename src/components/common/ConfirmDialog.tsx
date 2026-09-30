import { AlertTriangle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/form'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  impact?: ReactNode
  confirmLabel: string
  destructive?: boolean
  /** When set, the user must type this text to enable confirmation. */
  confirmText?: string
  loading?: boolean
  onConfirm: () => void
  children?: ReactNode
}

export function ConfirmDialog({ open, onOpenChange, title, description, impact, confirmLabel, destructive, confirmText, loading, onConfirm, children }: Props) {
  const [typed, setTyped] = useState('')
  const blocked = confirmText !== undefined && typed.trim() !== confirmText
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setTyped('')
        onOpenChange(o)
      }}
    >
      <DialogContent
        size="sm"
        title={title}
        description={description}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button variant={destructive ? 'danger' : 'primary'} disabled={blocked} loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {impact && (
            <div className={destructive ? 'flex gap-3 rounded-md bg-danger-soft px-4 py-3 text-[13.5px] text-ink' : 'flex gap-3 rounded-md bg-brand-50 px-4 py-3 text-[13.5px] text-ink'}>
              <AlertTriangle className={destructive ? 'mt-0.5 size-4 shrink-0 text-danger' : 'mt-0.5 size-4 shrink-0 text-brand-600'} aria-hidden />
              <div>{impact}</div>
            </div>
          )}
          {children}
          {confirmText !== undefined && (
            <Field label={<>Saisissez <span className="font-mono text-ink">{confirmText}</span> pour confirmer</>}>
              {(p) => <Input {...p} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />}
            </Field>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
