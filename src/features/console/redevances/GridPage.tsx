import { ArrowRight, Calculator, History, Save, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { qk, useAppMutation, useGrid, useGridHistory, useLicencies } from '@/hooks/queries'
import { computeBreakdown, estimateNetworkAnnual } from '@/lib/calculations/royalties'
import { date, money, moneyShort } from '@/lib/format'
import { SEGMENT_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { royaltiesService } from '@/services/royalties.service'
import type { RoyaltyGrid, Segment } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/controls'
import { Card, CardHeader } from '@/components/ui/display'
import { Field, Input, MoneyInput, Select } from '@/components/ui/form'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { DottedLeader, Money, SectionTitle } from '@/components/common/registre'
import { PageSkeleton } from '@/components/common/states'

function CoefRow({ label, coef, onChange, T, min = 0, max = 3, step = 0.05 }: { label: string; coef: number; onChange: (v: number) => void; T: number; min?: number; max?: number; step?: number }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[180px_1fr_88px_140px]">
      <span className="text-[13.5px] font-semibold text-ink">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={coef}
        onChange={(e) => onChange(Number(e.target.value))}
        className="order-last col-span-2 accent-[var(--accent)] sm:order-none sm:col-span-1"
        aria-label={`Coefficient — ${label}`}
      />
      <div className="relative">
        <Input type="number" step={step} min={min} max={max} value={coef} onChange={(e) => onChange(Number(e.target.value))} className="pr-7 text-right font-mono" aria-label={`Coefficient ${label}`} />
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[12px] text-muted">× T</span>
      </div>
      <Money value={coef * T} className="hidden text-right text-[13px] sm:block" />
    </div>
  )
}

export function GridPage() {
  const { data: grid, isLoading } = useGrid()
  const { data: history = [] } = useGridHistory()
  const { data: licencies = [] } = useLicencies()
  const [draft, setDraft] = useState<RoyaltyGrid | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [sim, setSim] = useState({ segment: 'CABINET' as Segment, exclusivite: false, ca: 12_000_000 })

  useEffect(() => {
    if (grid && !draft) setDraft(structuredClone(grid))
  }, [grid, draft])

  const dirty = useMemo(() => !!grid && !!draft && JSON.stringify(grid) !== JSON.stringify(draft), [grid, draft])
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)

  const save = useAppMutation(() => royaltiesService.saveGrid(draft!), {
    invalidate: [qk.grid, qk.gridHistory, qk.licencies],
    success: (g) => `Grille v${g.version} enregistrée — appliquée aux prochaines échéances`,
    onSuccess: (g) => {
      setDraft(structuredClone(g))
      setConfirm(false)
    },
  })

  if (isLoading || !grid || !draft) return <PageSkeleton />
  const set = (patch: Partial<RoyaltyGrid>) => setDraft({ ...draft, ...patch })
  const b = computeBreakdown(draft, { segment: sim.segment, exclusivite: sim.exclusivite, caSessions: sim.ca })
  const before = estimateNetworkAnnual(grid, licencies)
  const after = estimateNetworkAnnual(draft, licencies)
  const delta = after - before
  const concerned = licencies.filter((l) => l.status !== 'SUSPENDU').length

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', to: '/console' }, { label: 'Grille de redevances' }]}
        title="Grille de redevances"
        subtitle="Tous les montants sont ancrés sur un montant de référence T. Modifiez T ou un coefficient : le simulateur recalcule immédiatement."
        meta={<span className="text-[12.5px] text-muted">Version en vigueur : v{grid.version} · modifiée le {date(grid.updatedAt)} par {grid.updatedBy}</span>}
        actions={
          <>
            <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(structuredClone(grid))}>
              <Undo2 /> Annuler les modifications
            </Button>
            <Button disabled={!dirty} onClick={() => setConfirm(true)}>
              <Save /> Enregistrer la nouvelle grille
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <Field label="Montant de référence T" hint="Toutes les redevances fixes sont exprimées en multiples de T.">
              {(p) => <MoneyInput {...p} value={draft.T} onChange={(T) => set({ T })} className="h-12 text-[20px]" />}
            </Field>
          </Card>
          <Card className="px-5 pt-4 pb-2">
            <SectionTitle>Droit d'entrée par segment</SectionTitle>
            <div className="divide-y divide-line">
              {(Object.keys(SEGMENT_LABELS) as Segment[]).map((s) => (
                <CoefRow key={s} label={SEGMENT_LABELS[s]} coef={draft.entryFeeCoef[s]} T={draft.T} onChange={(v) => set({ entryFeeCoef: { ...draft.entryFeeCoef, [s]: v } })} />
              ))}
            </div>
          </Card>
          <Card className="px-5 pt-4 pb-2">
            <SectionTitle>Redevances récurrentes</SectionTitle>
            <div className="divide-y divide-line">
              <CoefRow label="Redevance annuelle fixe" coef={draft.annualFixedCoef} T={draft.T} max={1.5} onChange={(annualFixedCoef) => set({ annualFixedCoef })} />
              <CoefRow label="Forfait programme" coef={draft.programmeForfaitCoef} T={draft.T} max={1.5} onChange={(programmeForfaitCoef) => set({ programmeForfaitCoef })} />
              <div className="grid grid-cols-[1fr_120px] items-center gap-4 py-3 sm:grid-cols-[180px_1fr_120px]">
                <span className="text-[13.5px] font-semibold text-ink">Majoration exclusivité</span>
                <span className="hidden text-[12.5px] text-muted sm:block">Appliquée à la redevance annuelle en cas d'exclusivité territoriale</span>
                <div className="relative">
                  <Input type="number" min={0} max={100} value={draft.exclusivityMarkupPct} onChange={(e) => set({ exclusivityMarkupPct: Number(e.target.value) })} className="pr-7 text-right font-mono" aria-label="Majoration exclusivité en %" />
                  <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[12px] text-muted">%</span>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_120px] items-center gap-4 py-3 sm:grid-cols-[180px_1fr_120px]">
                <span className="text-[13.5px] font-semibold text-ink">Variable sur CA formation</span>
                <span className="hidden text-[12.5px] text-muted sm:block">Pourcentage du CA des sessions déclaré chaque trimestre</span>
                <div className="relative">
                  <Input type="number" min={0} max={50} step={0.5} value={draft.caFormationPct} onChange={(e) => set({ caFormationPct: Number(e.target.value) })} className="pr-7 text-right font-mono" aria-label="Pourcentage sur CA en %" />
                  <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[12px] text-muted">%</span>
                </div>
              </div>
            </div>
          </Card>
          <Card className="px-5 pt-4 pb-4">
            <SectionTitle>Abonnements self-service</SectionTitle>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {draft.plans.map((p, i) => (
                <Field key={p.id} label={`Formule ${p.name} (mensuel)`}>
                  {(props) => <MoneyInput {...props} value={p.monthly} onChange={(monthly) => set({ plans: draft.plans.map((x, k) => (k === i ? { ...x, monthly } : x)) })} />}
                </Field>
              ))}
              <Field label="Remise engagement annuel">
                {(p) => (
                  <div className="relative">
                    <Input {...p} type="number" value={draft.annualDiscountPct} onChange={(e) => set({ annualDiscountPct: Number(e.target.value) })} className="pr-7 text-right font-mono" />
                    <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[12px] text-muted">%</span>
                  </div>
                )}
              </Field>
            </div>
          </Card>
          <Card>
            <CardHeader title="Historique des versions de la grille" action={<History className="size-4 text-muted" />} />
            <ol className="divide-y divide-line border-t border-line">
              {[...history].reverse().map((h) => (
                <li key={h.version} className="flex items-center gap-4 px-5 py-2.5 text-[13px]">
                  <span className="font-mono text-brand-700">v{h.version}</span>
                  <span className="flex-1">T = {money(h.T)}</span>
                  <span className="text-muted">
                    {date(h.at)} · {h.by}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line bg-brand-950 px-5 py-3.5 text-white">
              <Calculator className="size-4 text-brand-300" />
              <h2 className="text-[14.5px] font-bold">Aperçu du calcul</h2>
              {dirty && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">brouillon</span>}
            </div>
            <div className="flex flex-col gap-3 p-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Segment">
                  {(p) => (
                    <Select {...p} value={sim.segment} onChange={(e) => setSim({ ...sim, segment: e.target.value as Segment })}>
                      {(Object.keys(SEGMENT_LABELS) as Segment[]).map((s) => (
                        <option key={s} value={s}>
                          {SEGMENT_LABELS[s]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="CA sessions / an">{(p) => <MoneyInput {...p} value={sim.ca} onChange={(ca) => setSim({ ...sim, ca })} />}</Field>
              </div>
              <label className="flex items-center justify-between gap-3 text-[13.5px] font-semibold text-ink">
                Exclusivité territoriale
                <Switch checked={sim.exclusivite} onCheckedChange={(exclusivite) => setSim({ ...sim, exclusivite })} />
              </label>
              <div className="mt-1 rounded-md bg-canvas px-4 py-2">
                <DottedLeader label="Droit d'entrée" value={<Money value={b.droitEntree} />} />
                <DottedLeader label="Redevance annuelle" value={<Money value={b.annuelle} />} />
                {sim.exclusivite && <DottedLeader label="Majoration exclusivité" value={<Money value={b.majoration} />} />}
                <DottedLeader label="Variable sur CA" value={<Money value={b.variable} />} />
                <DottedLeader label="Forfait programme" value={<Money value={b.forfait} />} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-line px-3 py-2.5">
                  <p className="text-[12px] text-muted">1ʳᵉ année</p>
                  <p className="font-mono text-[16px] text-ink tabular">{money(b.premiereAnnee)}</p>
                </div>
                <div className="rounded-md border border-line px-3 py-2.5">
                  <p className="text-[12px] text-muted">Années suivantes</p>
                  <p className="font-mono text-[16px] text-ink tabular">{money(b.anneesSuivantes)}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-line p-5">
              <h3 className="text-[13.5px] font-bold text-ink">Impact sur le réseau</h3>
              <p className="mt-0.5 text-[12.5px] text-muted">{concerned} licenciés actifs concernés · redevances récurrentes annuelles estimées</p>
              <div className="mt-3 flex items-center gap-3 font-mono text-[15px] tabular">
                <span className="text-muted">{moneyShort(before)}</span>
                <ArrowRight className="size-4 text-muted" />
                <span className="text-ink">{moneyShort(after)}</span>
                <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[12px]', delta > 0 ? 'bg-success-soft text-success' : delta < 0 ? 'bg-danger-soft text-danger' : 'bg-panel text-muted')}>
                  {delta > 0 ? '+' : ''}
                  {moneyShort(delta)}
                </span>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Enregistrer la grille v${grid.version + 1} ?`}
        impact={<>La nouvelle grille s'appliquera aux <strong>prochaines échéances</strong> uniquement. Les échéances déjà émises et les encaissements ne sont pas modifiés.</>}
        confirmLabel="Enregistrer la grille"
        loading={save.isPending}
        onConfirm={() => save.mutate(undefined)}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(o) => !o && blocker.reset?.()}
        title="Quitter sans enregistrer ?"
        impact="Les modifications de la grille seront perdues."
        confirmLabel="Quitter la page"
        destructive
        onConfirm={() => blocker.proceed?.()}
      />
    </>
  )
}
