import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchInput({ value, onChange, placeholder = 'Rechercher…', className, label }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; label?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="h-9 w-full rounded-sm border border-line-strong bg-surface pr-8 pl-9 text-sm text-ink shadow-xs outline-none transition-[border-color,box-shadow] hover:border-brand-300 focus:border-brand-500 focus:ring-3 focus:ring-brand-100 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-ink" aria-label="Effacer la recherche">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export function matches(query: string, ...fields: (string | undefined)[]) {
  if (!query.trim()) return true
  const q = query
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
  return fields.some((f) =>
    f
      ?.normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .includes(q),
  )
}
