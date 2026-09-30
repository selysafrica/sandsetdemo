import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { Skeleton } from '@/components/ui/display'

export interface Column<T> {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  className?: string
  headerClassName?: string
  align?: 'left' | 'right' | 'center'
  /** Hidden in the mobile card layout. */
  hideOnMobile?: boolean
  /** Shown as the card title on mobile. */
  primary?: boolean
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[] | undefined
  getRowId: (row: T) => string
  loading?: boolean
  onRowClick?: (row: T) => void
  selectable?: boolean
  selected?: Set<string>
  onSelectedChange?: (ids: Set<string>) => void
  bulkActions?: ReactNode
  empty?: ReactNode
  pageSize?: number
  initialSort?: { id: string; desc?: boolean }
  rowClassName?: (row: T) => string | undefined
  caption: string
  dense?: boolean
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  onRowClick,
  selectable,
  selected,
  onSelectedChange,
  bulkActions,
  empty,
  pageSize = 12,
  initialSort,
  rowClassName,
  caption,
  dense,
}: Props<T>) {
  const [sort, setSort] = useState(initialSort)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!rows) return []
    const col = columns.find((c) => c.id === sort?.id)
    if (!col?.sortValue) return rows
    const get = col.sortValue
    return [...rows].sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'fr')
      return sort?.desc ? -cmp : cmp
    })
  }, [rows, columns, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize)
  const allIds = sorted.map(getRowId)
  const selectedCount = selected?.size ?? 0
  const allChecked = selectedCount > 0 && selectedCount === allIds.length ? true : selectedCount > 0 ? 'indeterminate' : false

  const toggleSort = (c: Column<T>) => {
    if (!c.sortValue) return
    setSort((s) => (s?.id === c.id ? (s.desc ? undefined : { id: c.id, desc: true }) : { id: c.id }))
  }
  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectedChange?.(next)
  }

  if (loading)
    return (
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-0">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="hidden h-4 w-20 md:block" />
          </div>
        ))}
      </div>
    )

  if (!sorted.length) return <>{empty}</>

  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3'
  const primaryCol = columns.find((c) => c.primary) ?? columns[0]

  return (
    <div className="flex flex-col gap-3">
      {selectable && selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 animate-fade-in" role="status">
          <span className="text-[13.5px] font-semibold text-brand-800">
            {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap items-center gap-2">{bulkActions}</div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onSelectedChange?.(new Set())}>
            Désélectionner
          </Button>
        </div>
      )}

      <div className="hidden overflow-x-auto rounded-lg border border-line bg-surface shadow-card md:block">
        <table className="w-full border-collapse text-left text-[13.5px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line bg-canvas">
              {selectable && (
                <th className="w-10 px-4 py-2.5">
                  <Checkbox
                    aria-label="Tout sélectionner"
                    checked={allChecked}
                    onCheckedChange={(v) => onSelectedChange?.(v === true ? new Set(allIds) : new Set())}
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  aria-sort={sort?.id === c.id ? (sort.desc ? 'descending' : 'ascending') : undefined}
                  className={cn('px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap text-muted', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.headerClassName)}
                >
                  {c.sortValue ? (
                    <button type="button" onClick={() => toggleSort(c)} className={cn('inline-flex items-center gap-1 rounded-sm hover:text-ink', c.align === 'right' && 'flex-row-reverse')}>
                      {c.header}
                      {sort?.id === c.id ? sort.desc ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-50" />}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const id = getRowId(row)
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-line transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-brand-50/50',
                    selected?.has(id) && 'bg-brand-50/70',
                    rowClassName?.(row),
                  )}
                >
                  {selectable && (
                    <td className="w-10 px-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label="Sélectionner la ligne" checked={selected?.has(id) ?? false} onCheckedChange={() => toggle(id)} />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.id} className={cn(cellPad, 'align-middle', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden" aria-label={caption}>
        {visible.map((row) => {
          const id = getRowId(row)
          return (
            <li key={id}>
              <div
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                className={cn('rounded-lg border border-line bg-surface p-4 shadow-card', rowClassName?.(row))}
              >
                <div className="flex items-start gap-3">
                  {selectable && (
                    <span onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label="Sélectionner" checked={selected?.has(id) ?? false} onCheckedChange={() => toggle(id)} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">{primaryCol.cell(row)}</div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  {columns
                    .filter((c) => c !== primaryCol && !c.hideOnMobile)
                    .map((c) => (
                      <div key={c.id} className="min-w-0">
                        <dt className="text-[11.5px] font-semibold text-muted">{c.header}</dt>
                        <dd className="mt-0.5 text-[13px]">{c.cell(row)}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            </li>
          )
        })}
      </ul>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
          <span>
            {safePage * pageSize + 1}–{Math.min(sorted.length, (safePage + 1) * pageSize)} sur {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} aria-label="Page précédente">
              <ChevronLeft />
            </Button>
            <span className="px-2 font-mono tabular">
              {safePage + 1}/{pageCount}
            </span>
            <Button variant="outline" size="icon-sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} aria-label="Page suivante">
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
