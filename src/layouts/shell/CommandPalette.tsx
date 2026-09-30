import { Command } from 'cmdk'
import { Building2, FileText, FolderOpen, History, Layers, LayoutDashboard, ListChecks, Plus, Search, Users } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import * as D from '@radix-ui/react-dialog'
import { useDossiers, useLicencies } from '@/hooks/queries'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUi } from '@/stores/ui.store'
import { kitService } from '@/services/kit.service'
import type { Role } from '@/types/domain'
import { Kbd } from '@/components/ui/display'

interface Entry {
  label: string
  to: string
  icon: ReactNode
  keywords?: string
}

const NAV: Record<Role, Entry[]> = {
  ADMIN_CONCESSIONNAIRE: [
    { label: 'Tableau de bord réseau', to: '/console', icon: <LayoutDashboard /> },
    { label: 'Registre des licenciés', to: '/console/licencies', icon: <Building2 /> },
    { label: 'Entreprises abonnées', to: '/console/entreprises', icon: <Building2 /> },
    { label: 'Grille de redevances', to: '/console/redevances/grille', icon: <FileText /> },
    { label: 'Journal des redevances', to: '/console/redevances/journal', icon: <FileText /> },
    { label: 'Habilitations & audits', to: '/console/habilitations', icon: <ListChecks /> },
    { label: 'Kit & versions', to: '/console/kit', icon: <Layers /> },
    { label: 'Import JSON', to: '/console/import', icon: <FileText /> },
    { label: 'Paramètres', to: '/console/parametres', icon: <FileText /> },
    { label: "Journal d'accès", to: '/console/journal-acces', icon: <History /> },
  ],
  LICENCIE_ADMIN: [
    { label: 'Tableau de bord', to: '/app', icon: <LayoutDashboard /> },
    { label: 'Clients & dossiers', to: '/app/dossiers', icon: <FolderOpen /> },
    { label: 'Utilisateurs', to: '/app/utilisateurs', icon: <Users /> },
    { label: 'Marque & instance', to: '/app/marque', icon: <FileText /> },
    { label: 'Redevances', to: '/app/redevances', icon: <FileText /> },
    { label: 'Déclarations d’activité', to: '/app/declarations', icon: <FileText /> },
  ],
  LICENCIE_USER: [
    { label: 'Mon espace', to: '/app', icon: <LayoutDashboard /> },
    { label: 'Mes clients', to: '/app/dossiers', icon: <FolderOpen /> },
    { label: 'Mes tâches', to: '/app/mes-taches', icon: <ListChecks /> },
    { label: 'Aide & support', to: '/app/support', icon: <FileText /> },
  ],
  ENTREPRISE: [
    { label: 'Mon espace', to: '/espace', icon: <LayoutDashboard /> },
    { label: 'Analyse d’écart', to: '/espace/dossier/analyse-ecart', icon: <ListChecks /> },
    { label: 'Plan de transition', to: '/espace/dossier/plan', icon: <ListChecks /> },
    { label: 'Documents', to: '/espace/dossier/documents', icon: <FileText /> },
    { label: 'Formations', to: '/espace/dossier/formations', icon: <FileText /> },
    { label: 'Rapport de synthèse', to: '/espace/dossier/rapport', icon: <FileText /> },
    { label: 'Abonnement', to: '/espace/abonnement', icon: <FileText /> },
  ],
}

const ACTIONS: Partial<Record<Role, Entry[]>> = {
  ADMIN_CONCESSIONNAIRE: [
    { label: 'Nouveau licencié', to: '/console/licencies?nouveau=1', icon: <Plus /> },
    { label: 'Préparer une nouvelle version du Kit', to: '/console/kit?brouillon=1', icon: <Plus /> },
    { label: 'Enregistrer un encaissement', to: '/console/redevances/journal?encaissement=1', icon: <Plus /> },
  ],
  LICENCIE_ADMIN: [
    { label: 'Nouveau dossier client', to: '/app/dossiers?nouveau=1', icon: <Plus /> },
    { label: 'Inviter un utilisateur', to: '/app/utilisateurs?inviter=1', icon: <Plus /> },
  ],
}

const itemClass =
  'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[13.5px] text-ink data-[selected=true]:bg-brand-50 [&_svg]:size-4 [&_svg]:text-muted'
const groupClass = '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted'

function LicencieResults({ go }: { go: (to: string, label: string) => void }) {
  const { data = [] } = useLicencies()
  return (
    <Command.Group heading="Licenciés" className={groupClass}>
      {data.map((l) => (
        <Command.Item key={l.id} value={`${l.raisonSociale} ${l.ref} ${l.territoire}`} onSelect={() => go(`/console/licencies/${l.id}`, l.raisonSociale)} className={itemClass}>
          <Building2 />
          <span className="flex-1 truncate">{l.raisonSociale}</span>
          <span className="font-mono text-[11.5px] text-muted">{l.ref}</span>
        </Command.Item>
      ))}
    </Command.Group>
  )
}

function DossierResults({ go }: { go: (to: string, label: string) => void }) {
  const { data = [] } = useDossiers()
  const clauses = kitService.latest().content.clauses
  return (
    <>
      <Command.Group heading="Dossiers" className={groupClass}>
        {data.map(({ dossier: d, progress }) => (
          <Command.Item key={d.id} value={`${d.clientName} ${d.ref}`} onSelect={() => go(`/app/dossiers/${d.id}/vue-ensemble`, d.clientName)} className={itemClass}>
            <FolderOpen />
            <span className="flex-1 truncate">{d.clientName}</span>
            <span className="font-mono text-[11.5px] text-muted">{progress.overall} %</span>
          </Command.Item>
        ))}
      </Command.Group>
      {data[0] && (
        <Command.Group heading="Clauses ISO 9001:2026" className={groupClass}>
          {clauses.map((c) => (
            <Command.Item key={c.id} value={`${c.code} ${c.titre}`} onSelect={() => go(`/app/dossiers/${data[0].dossier.id}/analyse-ecart?clause=${c.id}`, `§ ${c.code}`)} className={itemClass}>
              <span className="w-10 font-mono text-[12px] text-brand-700">§ {c.code}</span>
              <span className="flex-1 truncate">{c.titre}</span>
            </Command.Item>
          ))}
        </Command.Group>
      )}
    </>
  )
}

export function CommandPalette() {
  const open = useUi((s) => s.commandOpen)
  const setOpen = useUi((s) => s.setCommandOpen)
  const recent = useUi((s) => s.recent)
  const pushRecent = useUi((s) => s.pushRecent)
  const user = useCurrentUser()
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useUi.getState().commandOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  if (!user) return null
  const go = (to: string, label: string) => {
    setOpen(false)
    pushRecent({ label, to })
    navigate(to)
  }

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-brand-950/35 data-[state=open]:animate-fade-in" />
        <D.Content className="fixed top-[12vh] left-1/2 z-[var(--z-modal)] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-surface shadow-pop data-[state=open]:animate-rise">
          <D.Title className="sr-only">Palette de commandes</D.Title>
          <D.Description className="sr-only">Rechercher une page, un élément ou lancer une action</D.Description>
          <Command label="Palette de commandes" loop>
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search className="size-4 text-muted" aria-hidden />
              <Command.Input autoFocus placeholder="Rechercher une page, un dossier, une clause…" className="h-12 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted" />
              <Kbd>Échap</Kbd>
            </div>
            <Command.List className="max-h-[min(60vh,440px)] overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-10 text-center text-[13.5px] text-muted">Aucun résultat.</Command.Empty>
              {recent.length > 0 && (
                <Command.Group heading="Consultés récemment" className={groupClass}>
                  {recent.map((r) => (
                    <Command.Item key={r.to} value={`récent ${r.label}`} onSelect={() => go(r.to, r.label)} className={itemClass}>
                      <History />
                      {r.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {ACTIONS[user.role] && (
                <Command.Group heading="Actions" className={groupClass}>
                  {ACTIONS[user.role]!.map((a) => (
                    <Command.Item key={a.to} value={a.label} onSelect={() => go(a.to, a.label)} className={itemClass}>
                      {a.icon}
                      {a.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              <Command.Group heading="Navigation" className={groupClass}>
                {NAV[user.role].map((a) => (
                  <Command.Item key={a.to} value={a.label} onSelect={() => go(a.to, a.label)} className={itemClass}>
                    {a.icon}
                    {a.label}
                  </Command.Item>
                ))}
              </Command.Group>
              {user.role === 'ADMIN_CONCESSIONNAIRE' && <LicencieResults go={go} />}
              {(user.role === 'LICENCIE_ADMIN' || user.role === 'LICENCIE_USER') && <DossierResults go={go} />}
            </Command.List>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
