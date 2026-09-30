import { FileDown, Minus, Plus, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAssessments, useDocuments, useSessions, useTasks } from '@/hooks/queries'
import { useTenant } from '@/hooks/useCurrentUser'
import { computeCoverage, coverageByChapter, GAP_THRESHOLD, SCORE_LABELS } from '@/lib/calculations/coverage'
import { phaseProgress } from '@/lib/calculations/progress'
import { date, dateLong } from '@/lib/format'
import { CHAPTER_TITLES, DOC_TYPE_LABELS, STATUS_META } from '@/lib/labels'
import { readableOn } from '@/lib/utils'
import type { Branding, Score } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { CheckRow, Segmented } from '@/components/ui/controls'
import { Skeleton } from '@/components/ui/display'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/form'
import { ClauseHeatmap, ScoreLegend } from '@/components/common/ClauseHeatmap'
import { CoverageRing, SCORE_COLORS } from '@/components/common/indicators'
import { StandSetMark, TenantMark } from '@/components/common/Logo'
import { PHASE_TITLES, PhaseRail } from '@/components/common/PhaseRail'
import { useDossierContext } from '../context'

type SectionKey = 'synthese' | 'ecart' | 'plan' | 'documents' | 'formations' | 'annexes'
const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'synthese', label: 'Synthèse exécutive' },
  { key: 'ecart', label: "Analyse d'écart" },
  { key: 'plan', label: 'Plan de transition' },
  { key: 'documents', label: 'Registre documentaire' },
  { key: 'formations', label: 'Formations' },
  { key: 'annexes', label: 'Annexe : détail des clauses' },
]

const STANDSET_BRAND: Pick<Branding, 'nomCommercial' | 'accentColor' | 'logoText' | 'email' | 'phone' | 'address' | 'website'> = {
  nomCommercial: 'StandSet',
  accentColor: '#1a3fc4',
  logoText: 'SS',
  email: 'contact@standset.com',
  phone: '+225 27 20 00 00 00',
  address: 'Abidjan, Côte d’Ivoire',
  website: 'www.standset.com',
}

function Page({ children, brand, n, total, clientName }: { children: ReactNode; brand: typeof STANDSET_BRAND; n: number; total: number; clientName: string }) {
  return (
    <section className="print-page relative mx-auto flex h-[297mm] w-[210mm] flex-col bg-white px-[16mm] pt-[14mm] pb-[12mm] text-[10.5pt] text-ink shadow-pop">
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      <footer className="mt-4 flex items-center justify-between border-t border-line pt-2 text-[8pt] text-muted">
        <span>
          {brand.nomCommercial} · {brand.email} · {brand.phone}
        </span>
        <span>Confidentiel — {clientName}</span>
        <span className="font-mono">
          {n}/{total}
        </span>
      </footer>
    </section>
  )
}

function H2({ children, color }: { children: ReactNode; color: string }) {
  return (
    <h2 className="mb-4 border-b-2 pb-1.5 text-[15pt] font-bold" style={{ borderColor: color, color }}>
      {children}
    </h2>
  )
}

/** D-22 */
function OptionsDialog({ open, onOpenChange, value, onChange }: { open: boolean; onOpenChange: (o: boolean) => void; value: { sections: Set<SectionKey>; detail: 'court' | 'complet'; recipient: string; asOf: string }; onChange: (v: typeof value) => void }) {
  const [v, setV] = useState(value)
  useEffect(() => {
    if (open) setV(value)
  }, [open, value])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Options du rapport"
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button
              onClick={() => {
                onChange(v)
                onOpenChange(false)
              }}
            >
              Appliquer
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-1 text-[13px] font-semibold text-ink-soft">Sections</legend>
            {SECTIONS.map((s) => (
              <CheckRow
                key={s.key}
                checked={v.sections.has(s.key)}
                onCheckedChange={(c) => {
                  const n = new Set(v.sections)
                  if (c) n.add(s.key)
                  else n.delete(s.key)
                  setV({ ...v, sections: n })
                }}
                label={s.label}
              />
            ))}
          </fieldset>
          <Field label="Niveau de détail">
            {() => (
              <Segmented
                label="Niveau de détail"
                value={v.detail}
                onChange={(detail) => setV({ ...v, detail })}
                options={[
                  { value: 'court', label: 'Synthétique' },
                  { value: 'complet', label: 'Complet' },
                ]}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date d'arrêté">{(p) => <Input {...p} type="date" value={v.asOf} onChange={(e) => setV({ ...v, asOf: e.target.value })} />}</Field>
            <Field label="Destinataire">{(p) => <Input {...p} value={v.recipient} onChange={(e) => setV({ ...v, recipient: e.target.value })} />}</Field>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ReportPage() {
  const { dossierId, summary, isEnterprise } = useDossierContext()
  const { licencie } = useTenant()
  const { data: assessments } = useAssessments(dossierId)
  const { data: tasks } = useTasks(dossierId)
  const { data: docs } = useDocuments(dossierId)
  const { data: sessions } = useSessions(dossierId)
  const [zoom, setZoom] = useState(0.75)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [opts, setOpts] = useState({
    sections: new Set<SectionKey>(['synthese', 'ecart', 'plan', 'documents', 'formations']),
    detail: 'complet' as 'court' | 'complet',
    recipient: `Direction de ${summary.dossier.clientName}`,
    asOf: new Date().toISOString().slice(0, 10),
  })

  const brand = isEnterprise || !licencie ? STANDSET_BRAND : licencie.branding
  const d = summary.dossier
  const clauses = summary.version.content.clauses
  const cov = useMemo(() => computeCoverage(clauses, assessments ?? []), [clauses, assessments])
  const chapters = useMemo(() => coverageByChapter(clauses, assessments ?? []), [clauses, assessments])
  const phases = useMemo(() => phaseProgress(tasks ?? []), [tasks])

  if (!assessments || !tasks || !docs || !sessions) return <Skeleton className="h-[70vh] w-full rounded-lg" />

  const gaps = clauses
    .map((c) => ({ c, a: assessments.find((x) => x.clauseId === c.id) }))
    .filter(({ a }) => a?.applicable && a.score !== null && a.score <= GAP_THRESHOLD)
    .sort((x, y) => x.a!.score! - y.a!.score! || y.c.poids - x.c.poids)
  const docCounts = (['VALIDE', 'EN_COURS', 'A_CREER'] as const).map((s) => ({ s, n: docs.filter((x) => x.status === s).length }))
  const accent = brand.accentColor
  const has = (k: SectionKey) => opts.sections.has(k)
  const messages = [
    `La couverture des exigences ISO 9001:2026 atteint ${cov.coverage} %, avec ${cov.gaps} écarts identifiés sur ${cov.evaluated} clauses évaluées.`,
    `Le plan de transition est en phase ${summary.currentPhase} (${PHASE_TITLES[summary.currentPhase - 1].toLowerCase()}), ${summary.progress.plan} % des tâches sont terminées.`,
    `${docCounts[0].n} documents sur ${docs.length} sont validés ; l'audit de transition est visé pour le ${date(d.targetAuditDate)}.`,
  ]

  const pages: ReactNode[] = []
  pages.push(
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        {isEnterprise || !licencie ? <StandSetMark className="size-12" /> : <TenantMark branding={licencie.branding} size="lg" />}
        <span className="text-[14pt] font-bold">{brand.nomCommercial}</span>
      </div>
      <div className="mt-[60mm]">
        <p className="text-[11pt] font-semibold" style={{ color: accent }}>
          Rapport de synthèse
        </p>
        <h1 className="mt-2 text-[28pt] leading-tight font-bold">Transition ISO 9001:2026</h1>
        <p className="mt-3 text-[18pt] text-ink-soft">{d.clientName}</p>
        <div className="mt-8 h-1.5 w-24 rounded-full" style={{ background: accent }} />
      </div>
      <dl className="mt-auto grid grid-cols-2 gap-x-8 gap-y-2 text-[10pt]">
        <dt className="text-muted">Destinataire</dt>
        <dd>{opts.recipient}</dd>
        <dt className="text-muted">Arrêté au</dt>
        <dd>{dateLong(opts.asOf)}</dd>
        <dt className="text-muted">Référence</dt>
        <dd className="font-mono">{d.ref}</dd>
        <dt className="text-muted">Version du socle</dt>
        <dd className="font-mono">{summary.version.number}</dd>
      </dl>
    </div>,
  )
  if (has('synthese'))
    pages.push(
      <>
        <H2 color={accent}>1. Synthèse exécutive</H2>
        <div className="flex items-center gap-8">
          <CoverageRing value={cov.coverage} size="xl" sublabel="couverture" />
          <dl className="grid flex-1 grid-cols-2 gap-4">
            {[
              ['Avancement global', `${summary.progress.overall} %`],
              ['Phase en cours', `${summary.currentPhase} / 6`],
              ['Écarts ouverts', String(cov.gaps)],
              ['Documents validés', `${docCounts[0].n} / ${docs.length}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-line p-3">
                <dt className="text-[9pt] text-muted">{k}</dt>
                <dd className="font-mono text-[16pt]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <h3 className="mt-8 mb-2 text-[11pt] font-bold">Messages clés</h3>
        <ol className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full font-mono text-[9pt]" style={{ background: accent, color: readableOn(accent) }}>
                {i + 1}
              </span>
              <span className="leading-relaxed">{m}</span>
            </li>
          ))}
        </ol>
        <h3 className="mt-8 mb-3 text-[11pt] font-bold">Avancement par phase</h3>
        <PhaseRail phases={phases} current={summary.currentPhase} />
      </>,
    )
  if (has('ecart'))
    pages.push(
      <>
        <H2 color={accent}>2. Analyse d'écart</H2>
        <table className="w-full text-[9.5pt]">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-1.5 font-semibold">Chapitre</th>
              <th className="py-1.5 text-right font-semibold">Évaluées</th>
              <th className="py-1.5 text-right font-semibold">Écarts</th>
              <th className="w-40 py-1.5 font-semibold">Couverture</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((ch) => (
              <tr key={ch.chapitre} className="border-b border-line">
                <td className="py-1.5">
                  <span className="font-mono">§ {ch.chapitre}</span> {CHAPTER_TITLES[ch.chapitre]}
                </td>
                <td className="py-1.5 text-right font-mono">
                  {ch.evaluated}/{ch.applicable}
                </td>
                <td className="py-1.5 text-right font-mono">{ch.gaps}</td>
                <td className="py-1.5">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel">
                      <span className="block h-full rounded-full" style={{ width: `${ch.coverage}%`, background: accent }} />
                    </span>
                    <span className="w-9 text-right font-mono">{ch.coverage}%</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="mt-6 mb-3 text-[11pt] font-bold">Carte des clauses</h3>
        <ClauseHeatmap clauses={clauses} assessments={assessments} size="sm" />
        <ScoreLegend className="mt-3 text-[8pt]" />
        <h3 className="mt-6 mb-2 text-[11pt] font-bold">Écarts majeurs</h3>
        <ul className="flex flex-col gap-1.5">
          {gaps.slice(0, opts.detail === 'court' ? 5 : 9).map(({ c, a }) => (
            <li key={c.id} className="flex items-start gap-2">
              <span className="mt-0.5 rounded px-1.5 font-mono text-[8.5pt] text-white" style={{ background: SCORE_COLORS[a!.score as Score] }}>
                {a!.score}
              </span>
              <span>
                <span className="font-mono">§ {c.code}</span> {c.titre}
                {a!.constat && <span className="text-muted"> — {a!.constat}</span>}
              </span>
            </li>
          ))}
        </ul>
      </>,
    )
  if (has('plan'))
    pages.push(
      <>
        <H2 color={accent}>3. Plan de transition</H2>
        {PHASE_TITLES.map((t, i) => {
          const list = tasks.filter((x) => x.phase === i + 1)
          const p = phases[i]
          return (
            <div key={t} className="mb-3 break-inside-avoid">
              <div className="flex items-center justify-between border-b border-line py-1">
                <span className="font-bold">
                  {i + 1}. {t}
                </span>
                <span className="font-mono text-[9pt] text-muted">
                  {p.done}/{p.total} · {p.pct} %
                </span>
              </div>
              {opts.detail === 'complet' && (
                <ul className="mt-1 columns-2 gap-6 text-[8.5pt]">
                  {list.slice(0, 8).map((x) => (
                    <li key={x.id} className="flex items-center gap-1.5 py-0.5">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: x.status === 'TERMINEE' ? accent : x.status === 'BLOQUEE' ? 'var(--color-danger)' : 'var(--color-line-strong)' }} />
                      <span className="truncate">{x.titre}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </>,
    )
  if (has('documents') || has('formations'))
    pages.push(
      <>
        {has('documents') && (
          <>
            <H2 color={accent}>4. Registre documentaire</H2>
            <div className="mb-3 flex gap-6">
              {docCounts.map(({ s, n }) => (
                <span key={s}>
                  {STATUS_META[s].label} <span className="font-mono font-bold">{n}</span>
                </span>
              ))}
            </div>
            <table className="w-full text-[8.5pt]">
              <tbody>
                {docs.slice(0, opts.detail === 'court' ? 10 : 16).map((x) => (
                  <tr key={x.id} className="border-b border-line">
                    <td className="py-1 font-mono">{x.code}</td>
                    <td className="py-1">{x.titre}</td>
                    <td className="py-1 text-muted">{DOC_TYPE_LABELS[x.type]}</td>
                    <td className="py-1 text-right">{STATUS_META[x.status].label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {has('formations') && (
          <div className="mt-6">
            <H2 color={accent}>5. Formations</H2>
            <div className="grid grid-cols-3 gap-3">
              {summary.version.content.trainings.map((p) => {
                const ss = sessions.filter((s) => s.pathId === p.id)
                const trained = new Set(ss.flatMap((s) => s.participants.filter((x) => x.present).map((x) => x.name))).size
                const covered = new Set(ss.flatMap((s) => s.moduleIds)).size
                return (
                  <div key={p.id} className="rounded-md border border-line p-3">
                    <p className="text-[9.5pt] leading-tight font-bold">{p.nom}</p>
                    <p className="mt-2 font-mono text-[14pt]">{trained}</p>
                    <p className="text-[8pt] text-muted">personnes formées</p>
                    <p className="mt-1 text-[8pt] text-muted">
                      {covered}/{p.modules.length} modules · {ss.length} sessions
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </>,
    )
  if (has('annexes'))
    pages.push(
      <>
        <H2 color={accent}>Annexe — Détail des clauses</H2>
        <table className="w-full text-[8pt]">
          <tbody>
            {clauses.map((c) => {
              const a = assessments.find((x) => x.clauseId === c.id)
              return (
                <tr key={c.id} className="border-b border-line">
                  <td className="py-0.5 font-mono">{c.code}</td>
                  <td className="py-0.5">{c.titre}</td>
                  <td className="py-0.5 text-right">{!a?.applicable ? 'N/A' : a.score === null ? '—' : `${a.score} · ${SCORE_LABELS[a.score]}`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </>,
    )

  const download = async () => {
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 700))
    setGenerating(false)
    window.print()
  }

  return (
    <div>
      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        <p className="mr-auto text-[13.5px] text-muted">
          {pages.length} pages · {isEnterprise ? 'marque StandSet' : `à la marque ${brand.nomCommercial}`} · arrêté au {date(opts.asOf)}
        </p>
        <div className="flex items-center gap-1 rounded-md border border-line bg-surface p-0.5">
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} aria-label="Réduire">
            <Minus />
          </Button>
          <span className="w-12 text-center font-mono text-[12.5px]">{Math.round(zoom * 100)} %</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.min(1, z + 0.25))} aria-label="Agrandir">
            <Plus />
          </Button>
        </div>
        <Button variant="outline" onClick={() => setOptionsOpen(true)}>
          <Settings2 /> Sections & options
        </Button>
        <Button loading={generating} onClick={download}>
          <FileDown /> Télécharger le PDF
        </Button>
      </div>
      <div className="print-root overflow-x-auto rounded-lg bg-panel py-8">
        <div className="flex flex-col items-center gap-6" style={{ zoom }}>
          {pages.map((content, i) => (
            <Page key={i} brand={brand} n={i + 1} total={pages.length} clientName={d.clientName}>
              {content}
            </Page>
          ))}
        </div>
      </div>
      <OptionsDialog open={optionsOpen} onOpenChange={setOptionsOpen} value={opts} onChange={setOpts} />
    </div>
  )
}
