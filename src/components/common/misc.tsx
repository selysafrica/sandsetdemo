import { CreditCard, FileCheck2, FilePlus2, GraduationCap, Layers, ListChecks, RefreshCw, ShieldAlert, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { UploadCloud, X } from 'lucide-react'
import { dateTime, relative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/overlays'
import type { ActivityEvent } from '@/types/domain'

export function AvatarStack({ names, max = 3, size = 'sm' }: { names: string[]; max?: number; size?: 'xs' | 'sm' }) {
  if (!names.length) return <span className="text-[12.5px] text-muted">Non affecté</span>
  const shown = names.slice(0, max)
  return (
    <Tooltip content={names.join(', ')}>
      <div className="flex -space-x-2">
        {shown.map((n) => (
          <Avatar key={n} name={n} size={size} />
        ))}
        {names.length > max && (
          <span className={cn('grid place-items-center rounded-full bg-panel font-mono font-medium text-ink-soft ring-2 ring-surface', size === 'xs' ? 'size-6 text-[10px]' : 'size-7 text-[11px]')}>
            +{names.length - max}
          </span>
        )}
      </div>
    </Tooltip>
  )
}

const kindIcon: Record<ActivityEvent['kind'], ReactNode> = {
  status: <ShieldAlert />,
  payment: <Wallet />,
  reminder: <RefreshCw />,
  kit: <Layers />,
  assessment: <ListChecks />,
  document: <FileCheck2 />,
  training: <GraduationCap />,
  task: <ListChecks />,
  create: <FilePlus2 />,
}

export interface TimelineItem {
  at: string
  label: ReactNode
  actor?: string
  kind?: ActivityEvent['kind']
  extra?: ReactNode
}

export function Timeline({ items, compact }: { items: TimelineItem[]; compact?: boolean }) {
  return (
    <ol className="relative">
      {items.map((it, i) => (
        <li key={i} className={cn('relative flex gap-3', compact ? 'pb-3' : 'pb-4', 'last:pb-0')}>
          {i < items.length - 1 && <span className="absolute top-7 bottom-0 left-[13px] w-px bg-line" aria-hidden />}
          <span className="relative grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface text-brand-600 [&_svg]:size-3.5">
            {kindIcon[it.kind ?? 'create'] ?? <CreditCard />}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-[13.5px] leading-snug text-ink">{it.label}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              <time dateTime={it.at} title={dateTime(it.at)}>
                {relative(it.at)}
              </time>
              {it.actor && <> · {it.actor}</>}
            </p>
            {it.extra}
          </div>
        </li>
      ))}
    </ol>
  )
}

interface DropzoneProps {
  onFiles: (files: File[]) => void
  accept?: Accept
  maxSizeMb?: number
  label?: string
  hint?: string
  files?: File[]
  onRemove?: (f: File) => void
  compact?: boolean
}

export function FileDropzone({ onFiles, accept, maxSizeMb = 10, label = 'Glissez un fichier ici ou parcourez', hint, files, onRemove, compact }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop: onFiles,
    accept,
    maxSize: maxSizeMb * 1024 * 1024,
    multiple: false,
  })
  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line-strong bg-canvas text-center transition-colors hover:border-brand-400 hover:bg-brand-50/50',
          compact ? 'px-4 py-4' : 'px-6 py-8',
          isDragActive && 'border-brand-500 bg-brand-50',
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className={cn('text-brand-500', compact ? 'size-5' : 'size-7')} aria-hidden />
        <p className="mt-2 text-[13.5px] font-semibold text-ink">{isDragActive ? 'Déposez le fichier' : label}</p>
        <p className="mt-0.5 text-[12px] text-muted">{hint ?? `Taille maximale ${maxSizeMb} Mo`}</p>
      </div>
      {fileRejections.length > 0 && (
        <p className="mt-2 text-[12.5px] font-medium text-danger" role="alert">
          Fichier refusé : {fileRejections[0].errors[0]?.message}
        </p>
      )}
      {files && files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-[13px]">
              <FileCheck2 className="size-4 text-success" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="font-mono text-[11.5px] text-muted">{Math.max(1, Math.round(f.size / 1024))} ko</span>
              {onRemove && (
                <button type="button" onClick={() => onRemove(f)} className="rounded p-0.5 text-muted hover:text-danger" aria-label={`Retirer ${f.name}`}>
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function FilterChip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: ReactNode; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors',
        active ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong bg-surface text-ink-soft hover:border-brand-300 hover:text-ink',
      )}
    >
      {children}
      {count !== undefined && <span className={cn('font-mono text-[11.5px] tabular', active ? 'text-accent' : 'text-muted')}>{count}</span>}
    </button>
  )
}
