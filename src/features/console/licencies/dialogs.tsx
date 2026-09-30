import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Building2, Factory, GraduationCap, Landmark, Store } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { qk, useAppMutation, useGrid } from '@/hooks/queries'
import { computeBreakdown } from '@/lib/calculations/royalties'
import { SEGMENT_LABELS, STATUS_META } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { licenciesService, type LicencieRow } from '@/services/licencies.service'
import type { LicenceStatus, Segment } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { CheckRow, Stepper, Switch } from '@/components/ui/controls'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { DottedLeader, Money, StatusBadge } from '@/components/common/registre'

const SEGMENT_ICONS: Record<Segment, ReactNode> = {
  CABINET: <Building2 />,
  FORMATION: <GraduationCap />,
  INSTITUTION: <Landmark />,
  PME: <Store />,
  ETI: <Factory />,
}

const PAYS = ["Côte d'Ivoire", 'Sénégal', 'Bénin', 'Togo', 'Burkina Faso', 'Mali', 'Niger', 'Guinée', 'Cameroun']

const schema = z.object({
  raisonSociale: z.string().min(2, 'Raison sociale requise.'),
  nomCommercial: z.string(),
  segment: z.enum(['CABINET', 'FORMATION', 'INSTITUTION', 'PME', 'ETI']),
  pays: z.string().min(1, 'Choisissez un pays.'),
  territoire: z.string().min(2, 'Territoire requis.'),
  exclusivite: z.boolean(),
  contactName: z.string().min(3, 'Nom du contact requis.'),
  contactEmail: z.string().email('Courriel invalide.'),
  contactPhone: z.string().min(8, 'Téléphone requis.'),
})
type Values = z.infer<typeof schema>

const STEP_FIELDS: (keyof Values)[][] = [['raisonSociale', 'segment', 'pays', 'territoire'], ['contactName', 'contactEmail', 'contactPhone'], []]

/** D-01 — register a new licensee in three steps. */
export function CreateLicencieDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState(0)
  const [conflict, setConflict] = useState<string | null>(null)
  const { data: grid } = useGrid()
  const navigate = useNavigate()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { raisonSociale: '', nomCommercial: '', segment: 'CABINET', pays: "Côte d'Ivoire", territoire: '', exclusivite: false, contactName: '', contactEmail: '', contactPhone: '' },
  })
  const { register, watch, setValue, trigger, formState, handleSubmit, reset } = form
  const v = watch()

  useEffect(() => {
    if (!open) {
      setStep(0)
      reset()
    }
  }, [open, reset])

  useEffect(() => {
    if (!v.exclusivite || !v.territoire) return setConflict(null)
    void licenciesService.exclusivityConflict(v.territoire).then((l) => setConflict(l ? l.raisonSociale : null))
  }, [v.exclusivite, v.territoire])

  const create = useAppMutation(licenciesService.create, {
    invalidate: [qk.licencies, qk.network],
    success: (l) => `${l.raisonSociale} enregistré — invitation envoyée`,
    onSuccess: (l) => {
      onOpenChange(false)
      navigate(`/console/licencies/${l.id}`)
    },
  })

  const next = async () => {
    if (await trigger(STEP_FIELDS[step])) setStep((s) => s + 1)
  }
  const b = grid ? computeBreakdown(grid, { segment: v.segment, exclusivite: v.exclusivite, caSessions: 0 }) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title="Nouveau licencié"
        description="Le tenant est créé au statut « En attente » ; l'administrateur désigné reçoit une invitation."
        footer={
          <>
            {step > 0 && (
              <Button variant="ghost" className="mr-auto" onClick={() => setStep((s) => s - 1)}>
                Retour
              </Button>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            {step < 2 ? (
              <Button onClick={next}>Continuer</Button>
            ) : (
              <Button loading={create.isPending} onClick={handleSubmit((values) => create.mutate(values))}>
                Créer le licencié
              </Button>
            )}
          </>
        }
      >
        <Stepper steps={['Entité', 'Administrateur', 'Récapitulatif']} current={step} className="mb-6" />
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Raison sociale" error={formState.errors.raisonSociale?.message}>
                {(p) => <Input {...p} autoFocus {...register('raisonSociale')} />}
              </Field>
              <Field label="Nom commercial" optional>
                {(p) => <Input {...p} {...register('nomCommercial')} />}
              </Field>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">Segment</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(Object.keys(SEGMENT_LABELS) as Segment[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={v.segment === s}
                    onClick={() => setValue('segment', s)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center text-[12.5px] font-semibold transition-colors [&_svg]:size-5',
                      v.segment === s ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-ink-soft hover:border-brand-300',
                    )}
                  >
                    {SEGMENT_ICONS[s]}
                    {SEGMENT_LABELS[s]}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pays" error={formState.errors.pays?.message}>
                {(p) => (
                  <Select {...p} {...register('pays')}>
                    {PAYS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Territoire" hint="Ville ou région couverte" error={formState.errors.territoire?.message}>
                {(p) => <Input {...p} placeholder="Abidjan" {...register('territoire')} />}
              </Field>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3">
              <div>
                <p className="text-[13.5px] font-semibold text-ink">Exclusivité territoriale</p>
                <p className="text-[12.5px] text-muted">Aucun autre licencié ne pourra être habilité sur ce territoire. Majoration de {grid?.exclusivityMarkupPct} % sur la redevance annuelle.</p>
              </div>
              <Switch checked={v.exclusivite} onCheckedChange={(c) => setValue('exclusivite', c)} aria-label="Exclusivité territoriale" />
            </div>
            {conflict && (
              <p className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2.5 text-[13px] text-ink" role="alert">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                {conflict} détient déjà l'exclusivité sur « {v.territoire} ». Vérifiez le contrat avant de poursuivre.
              </p>
            )}
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Field label="Nom et prénom de l'administrateur" error={formState.errors.contactName?.message}>
              {(p) => <Input {...p} autoFocus {...register('contactName')} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Courriel" hint="Recevra l'invitation d'activation" error={formState.errors.contactEmail?.message}>
                {(p) => <Input {...p} type="email" {...register('contactEmail')} />}
              </Field>
              <Field label="Téléphone" error={formState.errors.contactPhone?.message}>
                {(p) => <Input {...p} type="tel" placeholder="+225 07 00 00 00 00" {...register('contactPhone')} />}
              </Field>
            </div>
          </div>
        )}
        {step === 2 && b && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[13px] font-bold text-ink">Entité</p>
              <DottedLeader label="Raison sociale" value={v.raisonSociale} />
              <DottedLeader label="Segment" value={SEGMENT_LABELS[v.segment]} />
              <DottedLeader label="Territoire" value={`${v.territoire}, ${v.pays}`} />
              <DottedLeader label="Exclusivité" value={v.exclusivite ? 'Oui' : 'Non'} />
              <DottedLeader label="Administrateur" value={v.contactName} />
              <DottedLeader label="Statut initial" value={<StatusBadge status="EN_ATTENTE" />} />
            </div>
            <div className="rounded-lg bg-canvas px-4 py-3">
              <p className="mb-1 text-[13px] font-bold text-ink">Redevances calculées (T = <Money value={grid!.T} />)</p>
              <DottedLeader label={`Droit d'entrée (× ${grid!.entryFeeCoef[v.segment]})`} value={<Money value={b.droitEntree} />} />
              <DottedLeader label="Redevance annuelle" value={<Money value={b.annuelle} />} />
              {v.exclusivite && <DottedLeader label="Majoration exclusivité" value={<Money value={b.majoration} />} />}
              <DottedLeader label="Forfait programme" value={<Money value={b.forfait} />} />
              <DottedLeader label="Variable" value={`${grid!.caFormationPct} % du CA déclaré`} />
              <DottedLeader label="Première année (hors variable)" value={<Money value={b.premiereAnnee} />} strong />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

const MOTIFS = ["Écart majeur d'audit", 'Impayés', 'Demande du licencié', 'Habilitation obtenue', 'Autre']

/** D-02 — change status; suspension requires typing the name. */
export function StatusDialog({ open, onOpenChange, licencie, initialStatus, initialMotif }: { open: boolean; onOpenChange: (o: boolean) => void; licencie: LicencieRow; initialStatus?: LicenceStatus; initialMotif?: string }) {
  const [status, setStatus] = useState<LicenceStatus>(initialStatus ?? licencie.status)
  const [motif, setMotif] = useState(initialMotif ?? '')
  const [comment, setComment] = useState('')
  const [notify, setNotify] = useState(true)
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (open) {
      setStatus(initialStatus ?? (licencie.status === 'HABILITE' ? 'SUSPENDU' : 'HABILITE'))
      setMotif(initialMotif ?? '')
      setTyped('')
    }
  }, [open, initialStatus, initialMotif, licencie.status])
  const impact = licenciesService.impact(licencie.id)
  const suspend = status === 'SUSPENDU'
  const mutation = useAppMutation(() => licenciesService.changeStatus(licencie.id, status, [motif, comment].filter(Boolean).join(' — '), notify), {
    invalidate: [qk.licencies, qk.licencie(licencie.id), qk.licencieHistory(licencie.id), qk.network],
    success: `Statut mis à jour : ${STATUS_META[status].label}`,
    onSuccess: () => onOpenChange(false),
  })
  const blocked = status === licencie.status || !motif || (suspend && typed.trim() !== licencie.raisonSociale)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="md"
        title="Changer le statut"
        description={`${licencie.raisonSociale} — statut actuel : ${STATUS_META[licencie.status].label}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button variant={suspend ? 'danger' : 'primary'} disabled={blocked} loading={mutation.isPending} onClick={() => mutation.mutate(undefined)}>
              {suspend ? 'Suspendre l’accès' : `Passer en « ${STATUS_META[status].label} »`}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Nouveau statut">
            {(['EN_ATTENTE', 'HABILITE', 'SUSPENDU'] as LicenceStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                disabled={s === licencie.status}
                onClick={() => setStatus(s)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border px-2 py-3 text-[12.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                  status === s ? (s === 'SUSPENDU' ? 'border-danger bg-danger-soft' : 'border-accent bg-accent-soft') : 'border-line-strong hover:border-brand-300',
                )}
              >
                <StatusBadge status={s} />
                {s === licencie.status && <span className="text-muted">actuel</span>}
              </button>
            ))}
          </div>
          <Field label="Motif">
            {(p) => (
              <Select {...p} value={motif} onChange={(e) => setMotif(e.target.value)}>
                <option value="">Choisir un motif…</option>
                {MOTIFS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Commentaire" optional>
            {(p) => <Textarea {...p} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />}
          </Field>
          {suspend && (
            <div className="rounded-md bg-danger-soft px-4 py-3 text-[13.5px] text-ink" role="alert">
              <p className="flex items-center gap-2 font-semibold text-danger">
                <AlertTriangle className="size-4" /> Effet immédiat
              </p>
              <p className="mt-1">
                {impact.users} utilisateur{impact.users > 1 ? 's' : ''} et {impact.dossiers} dossier{impact.dossiers > 1 ? 's' : ''} perdront l'accès dès la validation. Les données sont conservées.
              </p>
            </div>
          )}
          {suspend && (
            <Field label={<>Saisissez <span className="font-mono text-ink">{licencie.raisonSociale}</span> pour confirmer</>}>
              {(p) => <Input {...p} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />}
            </Field>
          )}
          <CheckRow checked={notify} onCheckedChange={setNotify} label="Notifier le licencié par courriel" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
