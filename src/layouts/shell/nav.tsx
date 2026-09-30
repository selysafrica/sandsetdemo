import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/overlays'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  badge?: number
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

export function SidebarNav({ sections, tone, collapsed, onNavigate }: { sections: NavSection[]; tone: 'dark' | 'light'; collapsed?: boolean; onNavigate?: () => void }) {
  const dark = tone === 'dark'
  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-5">
      {sections.map((s, i) => (
        <div key={s.label ?? i}>
          {s.label && !collapsed && (
            <p className={cn('mb-1.5 px-3 text-[11.5px] font-semibold', dark ? 'text-brand-300/80' : 'text-muted')}>{s.label}</p>
          )}
          <ul className="flex flex-col gap-0.5">
            {s.items.map((item) => {
              const link = (
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex h-9 items-center gap-3 rounded-md px-3 text-[13.5px] font-semibold transition-colors [&_svg]:size-[18px] [&_svg]:shrink-0',
                      collapsed && 'justify-center px-0',
                      dark
                        ? isActive
                          ? 'bg-white/12 text-white'
                          : 'text-brand-100/80 hover:bg-white/6 hover:text-white'
                        : isActive
                          ? 'bg-accent-soft text-accent'
                          : 'text-ink-soft hover:bg-panel hover:text-ink',
                    )
                  }
                >
                  {() => (
                    <>
                      {item.icon}
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && item.badge !== undefined && item.badge > 0 && (
                        <span className={cn('ml-auto rounded-full px-1.5 font-mono text-[11px] tabular', dark ? 'bg-danger text-white' : 'bg-danger-soft text-danger')}>{item.badge}</span>
                      )}
                    </>
                  )}
                </NavLink>
              )
              return <li key={item.to}>{collapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link}</li>
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
