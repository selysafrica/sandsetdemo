import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type DossierView = 'cards' | 'table' | 'kanban'

interface UiState {
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  commandOpen: boolean
  dossierView: DossierView
  recent: { label: string; to: string }[]
  dataRevision: number
  bumpRevision: () => void
  toggleSidebar: () => void
  setMobileNav: (open: boolean) => void
  setCommandOpen: (open: boolean) => void
  setDossierView: (view: DossierView) => void
  pushRecent: (item: { label: string; to: string }) => void
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      commandOpen: false,
      dossierView: 'cards',
      recent: [],
      dataRevision: 0,
      bumpRevision: () => set((s) => ({ dataRevision: s.dataRevision + 1 })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setDossierView: (dossierView) => set({ dossierView }),
      pushRecent: (item) =>
        set((s) => ({ recent: [item, ...s.recent.filter((r) => r.to !== item.to)].slice(0, 5) })),
    }),
    {
      name: 'standset-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, dossierView: s.dossierView, recent: s.recent }),
    },
  ),
)
