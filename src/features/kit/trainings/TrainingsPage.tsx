import { formatISO } from 'date-fns'
import { CalendarPlus, Download, GraduationCap, MapPin, Plus, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { qk, useAppMutation, useSessions, workspaceKeys } from '@/hooks/queries'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { date } from '@/lib/format'
import { cn, downloadText, toCsv } from '@/lib/utils'
import { trainingsService } from '@/services/workspace.service'
import type { Participant, TrainingPath, TrainingSession } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Checkbox, TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/controls'
import { Card, Skeleton } from '@/components/ui/display'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { Field, Input, MoneyInput, Select } from '@/components/ui/form'
import { CoverageRing } from '@/components/common/indicators'
import { Money } from '@/components/common/registre'
import { EmptyState } from '@/components/common/states'
import { useDossierContext } from '../context'

/** D-20 */
function SessionSheet({ open, onOpenChange, paths, initialPath, knownParticipants }: { open: boolean; onOpenChange: (o: boolean) => void; paths: TrainingPath[]; initialPath?: string; knownParticipants: Participant[] }) {
  const { dossierId, isEnterprise, summary } = useDossierContext()
  const user = useCurrentUser()
  const [pathId, setPathId] = useState(initialPath ?? paths[0]?.id)
  const [modules, setModules] = useState<Set<string>>(new Set())
  const [day, setDay] = useState(formatISO(new Date(), { representation: 'date' }))
  const [duree, setDuree] = useState(4)
  const [lieu, setLieu] = useState(`Site ${summary.dossier.ville}`)
  const [formateur, setFormateur] = useState(user ? `${user.firstName} ${user.lastName}` : '')
  const [people, setPeople] = useState<Participant[]>([])
  const [newName, setNewName] = useState('')
  const [newFn, setNewFn] = useState('')
  const [ca, setCa] = useState(0)
  const [satisfaction, setSatisfaction] = useState(0)
  useEffect(() => {
    if (open) {
      setPathId(initialPath ?? paths[0]?.id)
      setModules(new Set())
      setPeople([])
    }
  }, [open, initialPath, paths])
  const path = paths.find((p) => p.id === pathId)
  const save = useAppMutation(
    () => trainingsService.save({ dossierId, pathId: pathId!, moduleIds: [...modules], date: day, dureeHeures: duree, lieu, formateur, participants: people, caFacture: isEnterprise ? undefined : ca }),
    { invalidate: [qk.sessions(dossierId), ...workspaceKeys(dossierId)], success: `Session enregistrée — ${people.length} participants`, onSuccess: () => onOpenChange(false) },
  )
  const addPerson = () => {
    if (!newName.trim()) return
    setPeople([...people, { name: newName.trim(), fonction: newFn.trim() || '—', present: true }])
    setNewName('')
    setNewFn('')
  }
  const known = knownParticipants.filter((k) => !people.some((p) => p.name === k.name))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent
        width="lg"
        title="Enregistrer une session de formation"
        footer={
          <>
            <span className="mr-auto text-[13px] text-muted">
              {people.filter((p) => p.present).length} présents · {modules.size} module{modules.size > 1 ? 's' : ''}
            </span>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button loading={save.isPending} disabled={!modules.size || !people.length} onClick={() => save.mutate(undefined)}>Enregistrer la session</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-ink-soft">Parcours</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {paths.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={pathId === p.id}
                  onClick={() => {
                    setPathId(p.id)
                    setModules(new Set())
                  }}
                  className={cn('rounded-lg border px-3 py-2.5 text-left transition-colors', pathId === p.id ? 'border-accent bg-accent-soft' : 'border-line-strong hover:border-brand-300')}
                >
                  <span className="block text-[11.5px] font-semibold text-muted">Parcours {i + 1}</span>
                  <span className="block text-[13px] leading-snug font-semibold text-ink">{p.nom}</span>
                </button>
              ))}
            </div>
          </fieldset>
          {path && (
            <fieldset>
              <legend className="mb-2 text-[13px] font-semibold text-ink-soft">Modules couverts</legend>
              <ul className="divide-y divide-line rounded-md border border-line">
                {path.modules.map((m) => (
                  <li key={m.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-[13.5px] hover:bg-canvas">
                      <Checkbox
                        checked={modules.has(m.id)}
                        onCheckedChange={(v) => {
                          const n = new Set(modules)
                          if (v === true) n.add(m.id)
                          else n.delete(m.id)
                          setModules(n)
                          setDuree(path.modules.filter((x) => n.has(x.id)).reduce((a, x) => a + x.dureeHeures, 0) || 1)
                        }}
                      />
                      <span className="flex-1">{m.titre}</span>
                      <span className="font-mono text-[12px] text-muted">{m.dureeHeures} h</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date">{(p) => <Input {...p} type="date" value={day} onChange={(e) => setDay(e.target.value)} />}</Field>
            <Field label="Durée (heures)">{(p) => <Input {...p} type="number" min={1} value={duree} onChange={(e) => setDuree(Number(e.target.value))} className="font-mono" />}</Field>
            <Field label="Lieu">
              {(p) => (
                <Select {...p} value={lieu} onChange={(e) => setLieu(e.target.value)}>
                  <option>Site {summary.dossier.ville}</option>
                  <option>À distance</option>
                  <option>Locaux du cabinet</option>
                </Select>
              )}
            </Field>
          </div>
          <Field label="Formateur">{(p) => <Input {...p} value={formateur} onChange={(e) => setFormateur(e.target.value)} />}</Field>
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-ink-soft">Participants</legend>
            <div className="flex gap-2">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom et prénom" aria-label="Nom du participant" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPerson())} />
              <Input value={newFn} onChange={(e) => setNewFn(e.target.value)} placeholder="Fonction" aria-label="Fonction" className="w-44" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPerson())} />
              <Button variant="outline" onClick={addPerson} aria-label="Ajouter le participant">
                <Plus />
              </Button>
            </div>
            {known.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] text-muted">Déjà connus :</span>
                {known.slice(0, 8).map((k) => (
                  <button key={k.name} type="button" onClick={() => setPeople([...people, { ...k, present: true }])} className="rounded-full border border-line-strong px-2 py-0.5 text-[12px] hover:border-brand-300 hover:bg-brand-50">
                    + {k.name}
                  </button>
                ))}
              </div>
            )}
            {people.length > 0 && (
              <ul className="mt-3 divide-y divide-line rounded-md border border-line">
                {people.map((p, i) => (
                  <li key={p.name + i} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                    <Checkbox checked={p.present} onCheckedChange={(v) => setPeople(people.map((x, k) => (k === i ? { ...x, present: v === true } : x)))} aria-label={`${p.name} présent`} />
                    <span className="flex-1">{p.name}</span>
                    <span className="text-muted">{p.fonction}</span>
                    <button type="button" onClick={() => setPeople(people.filter((_, k) => k !== i))} className="rounded p-0.5 text-muted hover:text-danger" aria-label={`Retirer ${p.name}`}>
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-ink-soft">Satisfaction moyenne <span className="font-normal text-muted">(facultatif)</span></legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setSatisfaction(n)} aria-pressed={satisfaction === n} className={cn('size-9 rounded-md border font-mono text-[13px]', satisfaction >= n ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong text-muted hover:border-brand-300')}>
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
          {!isEnterprise && (
            <Field label="CA facturé pour cette session" hint="Alimente la déclaration trimestrielle (agrégat transmis au concessionnaire)." optional>
              {(p) => <MoneyInput {...p} value={ca} onChange={setCa} />}
            </Field>
          )}
        </div>
      </SheetContent>
    </Dialog>
  )
}

export function TrainingsPage() {
  const { dossierId, summary, isEnterprise } = useDossierContext()
  const { data: sessions, isLoading } = useSessions(dossierId)
  const user = useCurrentUser()
  const [open, setOpen] = useState<string | null | undefined>(undefined)
  const paths = summary.version.content.trainings

  const participants = useMemo(() => {
    const map = new Map<string, Participant & { modules: Set<string> }>()
    for (const s of sessions ?? [])
      for (const p of s.participants) {
        const e = map.get(p.name) ?? { ...p, modules: new Set<string>() }
        if (p.present) s.moduleIds.forEach((m) => e.modules.add(m))
        map.set(p.name, e)
      }
    return [...map.values()]
  }, [sessions])

  if (isLoading || !sessions) return <Skeleton className="h-96 w-full rounded-lg" />
  const stats = (p: TrainingPath) => {
    const ss = sessions.filter((s) => s.pathId === p.id)
    const covered = new Set(ss.flatMap((s) => s.moduleIds))
    const trained = new Set(ss.flatMap((s) => s.participants.filter((x) => x.present).map((x) => x.name)))
    return { sessions: ss, pct: p.modules.length ? Math.round((covered.size / p.modules.length) * 100) : 0, trained: trained.size, hours: ss.reduce((a, s) => a + s.dureeHeures, 0), ca: ss.reduce((a, s) => a + (s.caFacture ?? 0), 0) }
  }
  const allModules = paths.flatMap((p) => p.modules.map((m) => ({ ...m, path: p })))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[70ch] text-[13.5px] text-muted">Trois parcours suivis pour ancrer la culture qualité : direction, pilotes de processus et auditeurs internes.</p>
        <div className="flex gap-2">
          {user?.profile === 'FORMATEUR' && (
            <Button variant="outline" onClick={() => setOpen(null)}>
              <CalendarPlus /> Session d'aujourd'hui
            </Button>
          )}
          <Button onClick={() => setOpen(null)}>
            <Plus /> Enregistrer une session
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {paths.map((p, i) => {
          const s = stats(p)
          return (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-start gap-4">
                <CoverageRing value={s.pct} size="md" toned={false} label={`Modules couverts — ${p.nom}`} />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-muted">Parcours {i + 1}</p>
                  <h3 className="leading-snug font-bold text-ink">{p.nom}</h3>
                  <p className="mt-0.5 text-[12.5px] text-muted">{p.publicCible}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                <div>
                  <dt className="text-[11.5px] text-muted">Sessions</dt>
                  <dd className="font-mono text-[17px] text-ink">{s.sessions.length}</dd>
                </div>
                <div>
                  <dt className="text-[11.5px] text-muted">Formés</dt>
                  <dd className="font-mono text-[17px] text-ink">{s.trained}</dd>
                </div>
                <div>
                  <dt className="text-[11.5px] text-muted">Heures</dt>
                  <dd className="font-mono text-[17px] text-ink">{s.hours}</dd>
                </div>
              </dl>
              {!isEnterprise && s.ca > 0 && <p className="mt-2 text-center text-[12px] text-muted">CA facturé <Money value={s.ca} /></p>}
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(p.id)}>
                <Plus /> Session sur ce parcours
              </Button>
            </Card>
          )
        })}
      </div>

      <TabsRoot defaultValue="sessions" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="sessions" count={sessions.length}>Sessions</TabsTrigger>
          <TabsTrigger value="participants" count={participants.length}>Participants</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions">
          {sessions.length === 0 ? (
            <EmptyState
              title="Aucune session enregistrée"
              description="Enregistrez chaque session réalisée : les participants et les modules couverts alimentent l'avancement du dossier et le rapport de synthèse."
              action={<Button onClick={() => setOpen(null)}><Plus /> Enregistrer une session</Button>}
            />
          ) : (
            <ul className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
              {[...sessions]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((s: TrainingSession) => {
                  const p = paths.find((x) => x.id === s.pathId)
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-line px-4 py-3 last:border-0">
                      <span className="w-24 font-mono text-[12.5px] text-ink-soft">{date(s.date)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold text-ink">
                          <GraduationCap className="size-4 text-brand-600" /> {p?.nom}
                        </span>
                        <span className="block truncate text-[12.5px] text-muted">{s.moduleIds.map((m) => p?.modules.find((x) => x.id === m)?.titre).join(' · ')}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[12.5px] text-muted"><MapPin className="size-3.5" />{s.lieu}</span>
                      <span className="inline-flex items-center gap-1 text-[12.5px] text-muted"><Users className="size-3.5" />{s.participants.filter((x) => x.present).length}</span>
                      <span className="w-28 truncate text-[12.5px] text-ink-soft">{s.formateur}</span>
                      <span className="w-12 text-right font-mono text-[12.5px] text-muted">{s.dureeHeures} h</span>
                    </li>
                  )
                })}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="participants">
          <div className="mb-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => downloadText('participants-formation.csv', toCsv(participants.map((p) => ({ Participant: p.name, Fonction: p.fonction, ...Object.fromEntries(allModules.map((m) => [m.titre, p.modules.has(m.id) ? 'Oui' : ''])) }))))}>
              <Download /> Exporter CSV
            </Button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-[12.5px]">
              <caption className="sr-only">Matrice participants par module</caption>
              <thead>
                <tr className="border-b border-line bg-canvas">
                  <th className="sticky left-0 bg-canvas px-3 py-2 text-left font-semibold text-muted">Participant</th>
                  {allModules.map((m) => (
                    <th key={m.id} className="px-1 py-2 text-center align-bottom font-semibold text-muted" title={`${m.path.nom} — ${m.titre}`}>
                      <span className="block max-w-20 truncate">{m.titre}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.name} className="border-b border-line last:border-0">
                    <th scope="row" className="sticky left-0 bg-surface px-3 py-1.5 text-left font-normal">
                      <span className="block font-semibold text-ink">{p.name}</span>
                      <span className="block text-[11.5px] text-muted">{p.fonction}</span>
                    </th>
                    {allModules.map((m) => (
                      <td key={m.id} className="text-center">
                        {p.modules.has(m.id) ? <span className="inline-block size-3 rounded-[3px] bg-accent" aria-label="Suivi" /> : <span className="inline-block size-3 rounded-[3px] border border-line-strong" aria-label="Non suivi" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </TabsRoot>

      <SessionSheet open={open !== undefined} onOpenChange={(o) => !o && setOpen(undefined)} paths={paths} initialPath={open ?? undefined} knownParticipants={participants} />
    </div>
  )
}
