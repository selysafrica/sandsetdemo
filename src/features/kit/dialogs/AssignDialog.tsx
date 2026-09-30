import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { qk, useAppMutation, useTeam, workspaceKeys } from '@/hooks/queries'
import { PROFILE_LABELS } from '@/lib/labels'
import { dossiersService } from '@/services/dossiers.service'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { Avatar } from '@/components/ui/display'
import { Dialog, DialogContent } from '@/components/ui/dialog'

/** D-14 — assign consultants/trainers to a dossier. */
export function AssignDialog({ open, onOpenChange, dossierId, clientName, assigned }: { open: boolean; onOpenChange: (o: boolean) => void; dossierId: string; clientName: string; assigned: string[] }) {
  const { data: team = [] } = useTeam()
  const [ids, setIds] = useState<Set<string>>(new Set(assigned))
  useEffect(() => {
    if (open) setIds(new Set(assigned))
  }, [open, assigned])
  const mutation = useAppMutation(() => dossiersService.assign(dossierId, [...ids]), {
    invalidate: [...workspaceKeys(dossierId), qk.tenantUsers],
    success: 'Intervenants mis à jour',
    onSuccess: () => onOpenChange(false),
  })
  const members = team.filter((m) => m.profile !== 'ADMIN')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Affecter des intervenants"
        description={`Dossier ${clientName}. Un consultant ne voit que les dossiers qui lui sont affectés.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button loading={mutation.isPending} onClick={() => mutation.mutate(undefined)}>
              Enregistrer
            </Button>
          </>
        }
      >
        <ul className="divide-y divide-line rounded-md border border-line">
          {members.map((m) => (
            <li key={m.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-canvas">
                <Checkbox
                  checked={ids.has(m.id)}
                  onCheckedChange={(v) => {
                    const n = new Set(ids)
                    if (v === true) n.add(m.id)
                    else n.delete(m.id)
                    setIds(n)
                  }}
                />
                <Avatar name={m.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-ink">{m.name}</span>
                  <span className="block text-[12px] text-muted">{m.profile ? PROFILE_LABELS[m.profile] : ''}</span>
                </span>
                <span className="text-[12px] text-muted">
                  <span className="font-mono text-ink-soft">{'load' in m ? Number(m.load) : 0}</span> dossiers
                </span>
              </label>
            </li>
          ))}
        </ul>
        {ids.size === 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-md bg-warning-soft px-3 py-2 text-[13px] text-ink" role="alert">
            <AlertTriangle className="size-4 text-warning" /> Sans intervenant, seul l'administrateur du cabinet pourra travailler sur ce dossier.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
