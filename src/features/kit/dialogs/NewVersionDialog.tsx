import { ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'
import { qk, useAppMutation, workspaceKeys } from '@/hooks/queries'
import { dossiersService } from '@/services/dossiers.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/display'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { InfoNote } from '@/components/common/banners'
import type { ItemChange } from '@/lib/calculations/diff'

const KIND = { added: { label: 'Nouveau', tone: 'success' }, removed: { label: 'Retiré', tone: 'danger' }, modified: { label: 'Modifié', tone: 'warning' } } as const

function ChangeList({ title, items }: { title: string; items: ItemChange[] }) {
  if (!items.length) return null
  return (
    <div>
      <h3 className="mb-1.5 text-[13px] font-bold text-ink">
        {title} <span className="font-mono font-normal text-muted">({items.length})</span>
      </h3>
      <ul className="divide-y divide-line rounded-md border border-line">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
            <Badge tone={KIND[c.kind].tone}>{KIND[c.kind].label}</Badge>
            <span className="min-w-0 flex-1 truncate">{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** D-21 — adopt the latest socle without overwriting existing evaluations. */
export function NewVersionDialog({ open, onOpenChange, dossierId }: { open: boolean; onOpenChange: (o: boolean) => void; dossierId: string }) {
  const info = useMemo(() => (open ? dossiersService.newerVersionDiff(dossierId) : null), [open, dossierId])
  const adopt = useAppMutation(() => dossiersService.adoptLatest(dossierId), {
    invalidate: [...workspaceKeys(dossierId), qk.assessments(dossierId), qk.tasks(dossierId), qk.documents(dossierId)],
    success: (r) => `Version adoptée — ${r.newClauseIds.length} nouvelle(s) clause(s) à évaluer`,
    onSuccess: () => onOpenChange(false),
  })
  if (!info) return null
  const upToDate = info.current.id === info.latest.id
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={upToDate ? `Socle ${info.latest.number} à jour` : `La version ${info.latest.number} est disponible`}
        description={upToDate ? 'Ce dossier utilise déjà la dernière version publiée du socle.' : `Ce dossier utilise la version ${info.current.number}. Voici ce qui change pour lui.`}
        footer={
          upToDate ? (
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Plus tard
              </Button>
              <Button loading={adopt.isPending} onClick={() => adopt.mutate(undefined)}>
                Adopter la version {info.latest.number}
              </Button>
            </>
          )
        }
      >
        {!upToDate && (
          <div className="flex flex-col gap-5">
            <InfoNote icon={<ShieldCheck />}>
              <strong className="text-ink">Vos évaluations, tâches et documents existants sont conservés.</strong> Seuls les nouveaux éléments du socle sont ajoutés ; les nouvelles clauses apparaîtront « à évaluer ».
            </InfoNote>
            {info.latest.changelog && (
              <blockquote className="rounded-md bg-canvas px-4 py-3 text-[13.5px] leading-relaxed text-ink-soft">{info.latest.changelog}</blockquote>
            )}
            <ChangeList title="Clauses" items={info.diff.clauses} />
            <ChangeList title="Tâches types" items={info.diff.tasks} />
            <ChangeList title="Documents socle" items={info.diff.documents} />
            <ChangeList title="Parcours de formation" items={info.diff.trainings} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
