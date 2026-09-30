import { addYears, formatISO, parseISO, subMonths } from 'date-fns'
import { AlertTriangle, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { qk, useAppMutation, useLicencies } from '@/hooks/queries'
import { date } from '@/lib/format'
import { cn } from '@/lib/utils'
import { habilitationsService } from '@/services/habilitations.service'
import type { AuditResult } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { CheckRow, Segmented } from '@/components/ui/controls'
import { Dialog, DialogContent, SheetContent } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/form'
import { DottedLeader } from '@/components/common/registre'
import { FileDropzone } from '@/components/common/misc'

const today = () => formatISO(new Date(), { representation: 'date' })
const INTITULES = ['Habilitation réseau StandSet', 'Formateur certifié ISO 9001:2026', 'Auditeur interne qualifié', 'Consultant senior agréé']

function LicencieSelect({ value, onChange, locked }: { value: string; onChange: (v: string) => void; locked?: boolean }) {
  const { data = [] } = useLicencies()
  return (
    <Field label="Licencié">
      {(p) => (
        <Select {...p} value={value} onChange={(e) => onChange(e.target.value)} disabled={locked}>
          <option value="">Choisir…</option>
          {data.map((l) => (
            <option key={l.id} value={l.id}>
              {l.raisonSociale}
            </option>
          ))}
        </Select>
      )}
    </Field>
  )
}

/** D-05 */
export function HabilitationDialog({ open, onOpenChange, licencieId }: { open: boolean; onOpenChange: (o: boolean) => void; licencieId?: string }) {
  const [lic, setLic] = useState(licencieId ?? '')
  const [intitule, setIntitule] = useState(INTITULES[0])
  const [delivree, setDelivree] = useState(today())
  const [duree, setDuree] = useState<'1' | '2' | '3'>('3')
  const [auditeur, setAuditeur] = useState('Koffi Mensah')
  const [files, setFiles] = useState<File[]>([])
  useEffect(() => {
    if (open) setLic(licencieId ?? '')
  }, [open, licencieId])
  const expire = formatISO(addYears(parseISO(delivree), Number(duree)), { representation: 'date' })
  const mutation = useAppMutation(() => habilitationsService.add({ licencieId: lic, intitule, delivreeLe: delivree, dureeAns: Number(duree), auditeur }), {
    invalidate: [qk.habilitations(), qk.habilitations(lic), qk.licencies, qk.licencie(lic), qk.network],
    success: 'Habilitation enregistrée',
    onSuccess: () => onOpenChange(false),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Ajouter une habilitation"
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button disabled={!lic} loading={mutation.isPending} onClick={() => mutation.mutate(undefined)}>
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <LicencieSelect value={lic} onChange={setLic} locked={!!licencieId} />
          <Field label="Intitulé">
            {(p) => (
              <Select {...p} value={intitule} onChange={(e) => setIntitule(e.target.value)}>
                {INTITULES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Délivrée le">{(p) => <Input {...p} type="date" value={delivree} onChange={(e) => setDelivree(e.target.value)} />}</Field>
            <Field label="Durée de validité">
              {() => (
                <Segmented
                  label="Durée"
                  value={duree}
                  onChange={setDuree}
                  options={[
                    { value: '1', label: '1 an' },
                    { value: '2', label: '2 ans' },
                    { value: '3', label: '3 ans' },
                  ]}
                />
              )}
            </Field>
          </div>
          <div className="rounded-md bg-canvas px-4 py-2">
            <DottedLeader label="Expire le" value={date(expire)} strong />
            <DottedLeader label="Alerte de renouvellement (12 mois avant)" value={date(subMonths(parseISO(expire), 12))} />
          </div>
          <Field label="Délivrée par">{(p) => <Input {...p} value={auditeur} onChange={(e) => setAuditeur(e.target.value)} />}</Field>
          <Field label="Justificatif" optional>
            {() => <FileDropzone compact onFiles={setFiles} files={files} onRemove={() => setFiles([])} />}
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** D-06 */
export function AuditSheet({ open, onOpenChange, licencieId, onProposeSuspension }: { open: boolean; onOpenChange: (o: boolean) => void; licencieId?: string; onProposeSuspension?: (licencieId: string) => void }) {
  const [lic, setLic] = useState(licencieId ?? '')
  const [day, setDay] = useState(today())
  const [auditeur, setAuditeur] = useState('Koffi Mensah')
  const [perimetre, setPerimetre] = useState('Application de la méthodologie StandSet et conformité au contrat de licence')
  const [resultat, setResultat] = useState<AuditResult>('CONFORME')
  const [constats, setConstats] = useState<string[]>([''])
  const [propose, setPropose] = useState(false)
  useEffect(() => {
    if (open) {
      setLic(licencieId ?? '')
      setResultat('CONFORME')
      setConstats([''])
      setPropose(false)
    }
  }, [open, licencieId])
  const mutation = useAppMutation(
    () => habilitationsService.addAudit({ licencieId: lic, date: day, auditeur, resultat, constats: constats.filter((c) => c.trim()), suspensionProposee: propose }),
    {
      invalidate: [qk.habilitations(), qk.habilitations(lic), qk.network, qk.licencieHistory(lic)],
      success: 'Audit consigné',
      onSuccess: () => {
        onOpenChange(false)
        if (propose) onProposeSuspension?.(lic)
      },
    },
  )
  const RESULTS: { value: AuditResult; label: string }[] = [
    { value: 'CONFORME', label: 'Conforme' },
    { value: 'ECART_MINEUR', label: 'Écart mineur' },
    { value: 'ECART_MAJEUR', label: 'Écart majeur' },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Consigner un audit"
        description="Audit de conformité du licencié au réseau StandSet."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button disabled={!lic} loading={mutation.isPending} onClick={() => mutation.mutate(undefined)}>
              {propose ? 'Consigner et proposer la suspension' : 'Consigner l’audit'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <LicencieSelect value={lic} onChange={setLic} locked={!!licencieId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">{(p) => <Input {...p} type="date" value={day} onChange={(e) => setDay(e.target.value)} />}</Field>
            <Field label="Auditeur">{(p) => <Input {...p} value={auditeur} onChange={(e) => setAuditeur(e.target.value)} />}</Field>
          </div>
          <Field label="Périmètre">{(p) => <Input {...p} value={perimetre} onChange={(e) => setPerimetre(e.target.value)} />}</Field>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">Résultat</legend>
            <div className="grid grid-cols-3 gap-2">
              {RESULTS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={resultat === r.value}
                  onClick={() => {
                    setResultat(r.value)
                    setPropose(r.value === 'ECART_MAJEUR')
                  }}
                  className={cn(
                    'rounded-md border px-3 py-2.5 text-[13px] font-semibold transition-colors',
                    resultat === r.value
                      ? r.value === 'CONFORME'
                        ? 'border-success bg-success-soft text-success'
                        : r.value === 'ECART_MINEUR'
                          ? 'border-warning bg-warning-soft text-warning'
                          : 'border-danger bg-danger-soft text-danger'
                      : 'border-line-strong text-ink-soft hover:border-brand-300',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">Constats</legend>
            <ul className="flex flex-col gap-2">
              {constats.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <Input value={c} onChange={(e) => setConstats(constats.map((x, k) => (k === i ? e.target.value : x)))} placeholder={`Constat ${i + 1}`} aria-label={`Constat ${i + 1}`} />
                  {constats.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => setConstats(constats.filter((_, k) => k !== i))} aria-label="Retirer">
                      <X />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <Button variant="link" size="sm" className="mt-1" onClick={() => setConstats([...constats, ''])}>
              <Plus /> Ajouter un constat
            </Button>
          </fieldset>
          {resultat === 'ECART_MAJEUR' && (
            <div className="rounded-md bg-danger-soft px-4 py-3" role="alert">
              <p className="flex items-center gap-2 text-[13.5px] font-semibold text-danger">
                <AlertTriangle className="size-4" /> Écart majeur
              </p>
              <p className="mt-1 text-[13px] text-ink">Un écart majeur peut justifier la suspension de la licence. Un plan de correction doit être exigé.</p>
              <div className="mt-2">
                <CheckRow checked={propose} onCheckedChange={setPropose} label="Proposer une suspension à l'issue de l'enregistrement" />
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Dialog>
  )
}
