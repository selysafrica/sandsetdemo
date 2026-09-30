import { zodResolver } from '@hookform/resolvers/zod'
import { addMonths, formatISO } from 'date-fns'
import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { qk, useAppMutation, useTeam } from '@/hooks/queries'
import { PROFILE_LABELS } from '@/lib/labels'
import { dossiersService } from '@/services/dossiers.service'
import { kitService } from '@/services/kit.service'
import { Button } from '@/components/ui/button'
import { Checkbox, Stepper, Switch } from '@/components/ui/controls'
import { Avatar } from '@/components/ui/display'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/form'

const SECTEURS = ['Agroalimentaire', 'Industrie', 'BTP', 'Logistique', 'Santé', 'Services financiers', 'Énergie', 'Distribution', 'Services']
const EFFECTIFS = ['10 à 49', '50 à 249', '250 à 999', '1 000 et plus']

const schema = z.object({
  clientName: z.string().min(2, 'Nom du client requis.'),
  secteur: z.string().min(1),
  effectif: z.string().min(1),
  siteCount: z.number().min(1),
  ville: z.string().min(2, 'Ville requise.'),
  responsableQualite: z.string().min(3, 'Responsable qualité requis.'),
  responsableEmail: z.string().email('Courriel invalide.'),
  certifie2015: z.boolean(),
  certificateExpiry: z.string().optional(),
  targetAuditDate: z.string().min(1, 'Date requise.'),
})
type Values = z.infer<typeof schema>

/** D-13 */
export function CreateDossierDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState(0)
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const { data: team = [] } = useTeam()
  const navigate = useNavigate()
  const latest = kitService.latest()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { clientName: '', secteur: 'Industrie', effectif: '50 à 249', siteCount: 1, ville: '', responsableQualite: '', responsableEmail: '', certifie2015: true, certificateExpiry: formatISO(addMonths(new Date(), 18), { representation: 'date' }), targetAuditDate: formatISO(addMonths(new Date(), 10), { representation: 'date' }) },
  })
  const { register, watch, setValue, trigger, formState, handleSubmit, reset } = form
  const certifie = watch('certifie2015')
  useEffect(() => {
    if (!open) {
      setStep(0)
      reset()
      setAssigned(new Set())
    }
  }, [open, reset])
  const create = useAppMutation((v: Values) => dossiersService.create({ ...v, assignedUserIds: [...assigned] }), {
    invalidate: [qk.dossiers, qk.tenantUsers],
    success: (d) => `Dossier ${d.clientName} créé`,
    onSuccess: (d) => {
      onOpenChange(false)
      navigate(`/app/dossiers/${d.id}/vue-ensemble`)
    },
  })
  const e = formState.errors
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title="Nouveau dossier client"
        description="Un dossier par organisation accompagnée : il contient tous les modules du Kit."
        footer={
          <>
            {step > 0 && (
              <Button variant="ghost" className="mr-auto" onClick={() => setStep(0)}>
                Retour
              </Button>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            {step === 0 ? (
              <Button onClick={async () => (await trigger()) && setStep(1)}>Continuer</Button>
            ) : (
              <Button loading={create.isPending} onClick={handleSubmit((v) => create.mutate(v))}>
                Créer le dossier
              </Button>
            )}
          </>
        }
      >
        <Stepper steps={['Client', 'Équipe & socle']} current={step} className="mb-6" />
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Field label="Raison sociale du client" error={e.clientName?.message}>
              {(p) => <Input {...p} autoFocus {...register('clientName')} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Secteur">
                {(p) => (
                  <Select {...p} {...register('secteur')}>
                    {SECTEURS.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Effectif">
                {(p) => (
                  <Select {...p} {...register('effectif')}>
                    {EFFECTIFS.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Nombre de sites">{(p) => <Input {...p} type="number" min={1} {...register('siteCount', { valueAsNumber: true })} className="font-mono" />}</Field>
            </div>
            <Field label="Ville" error={e.ville?.message}>{(p) => <Input {...p} {...register('ville')} />}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Responsable qualité" error={e.responsableQualite?.message}>{(p) => <Input {...p} {...register('responsableQualite')} />}</Field>
              <Field label="Son courriel" error={e.responsableEmail?.message}>{(p) => <Input {...p} type="email" {...register('responsableEmail')} />}</Field>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3">
              <span className="text-[13.5px] font-semibold">Certifié ISO 9001:2015 aujourd'hui</span>
              <Switch checked={certifie} onCheckedChange={(v) => setValue('certifie2015', v)} aria-label="Certifié ISO 9001:2015" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {certifie && <Field label="Échéance du certificat actuel">{(p) => <Input {...p} type="date" {...register('certificateExpiry')} />}</Field>}
              <Field label="Audit de transition visé" error={e.targetAuditDate?.message}>{(p) => <Input {...p} type="date" {...register('targetAuditDate')} />}</Field>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <fieldset>
              <legend className="mb-2 text-[13px] font-semibold text-ink-soft">Intervenants affectés</legend>
              <ul className="divide-y divide-line rounded-md border border-line">
                {team
                  .filter((m) => m.profile !== 'ADMIN')
                  .map((m) => (
                    <li key={m.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-canvas">
                        <Checkbox
                          checked={assigned.has(m.id)}
                          onCheckedChange={(v) => {
                            const n = new Set(assigned)
                            if (v === true) n.add(m.id)
                            else n.delete(m.id)
                            setAssigned(n)
                          }}
                        />
                        <Avatar name={m.name} size="sm" />
                        <span className="flex-1 text-[13.5px]">{m.name}</span>
                        <span className="text-[12px] text-muted">{m.profile ? PROFILE_LABELS[m.profile] : ''}</span>
                      </label>
                    </li>
                  ))}
              </ul>
            </fieldset>
            <div className="rounded-lg bg-canvas p-4">
              <p className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                <Lock className="size-4 text-muted" /> Socle version {latest.number}
              </p>
              <p className="mt-1 text-[13px] text-ink-soft">Le dossier sera créé avec :</p>
              <ul className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
                <li><span className="font-mono text-ink">{latest.content.clauses.length}</span> clauses à évaluer</li>
                <li><span className="font-mono text-ink">{latest.content.tasks.length}</span> tâches types en 6 phases</li>
                <li><span className="font-mono text-ink">{latest.content.documents.length}</span> documents socle</li>
                <li><span className="font-mono text-ink">{latest.content.trainings.length}</span> parcours de formation</li>
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
