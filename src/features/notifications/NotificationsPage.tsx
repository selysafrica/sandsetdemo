import { CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { qk, useAppMutation, useNotifications } from '@/hooks/queries'
import { notificationsService } from '@/services/notifications.service'
import type { AppNotification, NotificationType } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Switch, TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/controls'
import { Card } from '@/components/ui/display'
import { FilterChip } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/states'
import { NotificationRow } from '@/layouts/shell/Topbar'

const TYPES: Record<NotificationType, string> = {
  KIT_VERSION: 'Versions du Kit',
  RELANCE: 'Redevances & relances',
  HABILITATION: 'Habilitations',
  TACHE: 'Tâches',
  DOCUMENT: 'Documents',
  PAIEMENT: 'Paiements',
  AUDIT: 'Audits',
}

export function NotificationsPage() {
  const { data = [] } = useNotifications()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [type, setType] = useState<NotificationType | ''>('')
  const [unread, setUnread] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, { mail: boolean; app: boolean }>>(() => Object.fromEntries(Object.keys(TYPES).map((k) => [k, { mail: k !== 'DOCUMENT', app: true }])))
  const markAll = useAppMutation(notificationsService.markAllRead, { invalidate: [qk.notifications], success: 'Toutes les notifications sont lues' })
  const rows = data.filter((n) => (!type || n.type === type) && (!unread || !n.readAt))
  const present = [...new Set(data.map((n) => n.type))]
  const open = async (n: AppNotification) => {
    await notificationsService.markRead([n.id])
    qc.invalidateQueries({ queryKey: qk.notifications })
    if (n.link) navigate(n.link)
  }
  const today = new Date().toISOString().slice(0, 10)
  const groups = [
    { label: "Aujourd'hui", items: rows.filter((n) => n.createdAt.slice(0, 10) === today) },
    { label: 'Plus tôt', items: rows.filter((n) => n.createdAt.slice(0, 10) !== today) },
  ]

  return (
    <>
      <PageHeader
        title="Notifications"
        actions={
          <Button variant="outline" onClick={() => markAll.mutate(undefined)} disabled={!data.some((n) => !n.readAt)}>
            <CheckCheck /> Tout marquer comme lu
          </Button>
        }
      />
      <TabsRoot defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger value="list" count={data.filter((n) => !n.readAt).length}>Notifications</TabsTrigger>
          <TabsTrigger value="prefs">Préférences</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip active={unread} onClick={() => setUnread((v) => !v)}>Non lues</FilterChip>
            {present.map((t) => (
              <FilterChip key={t} active={type === t} onClick={() => setType(type === t ? '' : t)} count={data.filter((n) => n.type === t).length}>
                {TYPES[t]}
              </FilterChip>
            ))}
          </div>
          {rows.length === 0 ? (
            <EmptyState title="Aucune notification" description="Vous êtes à jour." />
          ) : (
            <div className="flex max-w-3xl flex-col gap-5">
              {groups
                .filter((g) => g.items.length)
                .map((g) => (
                  <section key={g.label}>
                    <h2 className="mb-2 text-[13px] font-bold text-ink-soft">{g.label}</h2>
                    <Card className="p-1.5">
                      {g.items.map((n) => (
                        <NotificationRow key={n.id} n={n} onOpen={open} />
                      ))}
                    </Card>
                  </section>
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="prefs">
          <Card className="max-w-2xl">
            <table className="w-full text-[13.5px]">
              <caption className="sr-only">Préférences de notification</caption>
              <thead>
                <tr className="border-b border-line bg-canvas text-left text-[12px] text-muted">
                  <th className="px-5 py-2.5 font-semibold">Type</th>
                  <th className="px-5 py-2.5 text-center font-semibold">Courriel</th>
                  <th className="px-5 py-2.5 text-center font-semibold">Dans l'application</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(TYPES) as NotificationType[]).map((t) => (
                  <tr key={t} className="border-b border-line last:border-0">
                    <td className="px-5 py-3">{TYPES[t]}</td>
                    {(['mail', 'app'] as const).map((k) => (
                      <td key={k} className="px-5 py-3 text-center">
                        <Switch
                          checked={prefs[t][k]}
                          onCheckedChange={(v) => {
                            setPrefs({ ...prefs, [t]: { ...prefs[t], [k]: v } })
                            toast.success('Préférence enregistrée')
                          }}
                          aria-label={`${TYPES[t]} — ${k === 'mail' ? 'courriel' : 'application'}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </TabsRoot>
    </>
  )
}
