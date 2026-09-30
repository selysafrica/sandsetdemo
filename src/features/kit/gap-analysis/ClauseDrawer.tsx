import { addDays, formatISO } from 'date-fns'
import { ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Lightbulb, Lock, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SCORE_HINTS, SCORE_LABELS } from '@/lib/calculations/coverage'
import { dateTime } from '@/lib/format'
import { CHAPTER_TITLES } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { Clause, ClauseAssessment, Score, Task } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Badge, Kbd } from '@/components/ui/display'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { Field, Textarea } from '@/components/ui/form'
import { ClauseScorePicker } from '@/components/common/ClauseScorePicker'
import { StatusBadge } from '@/components/common/registre'
import { TaskSheet } from '../transition-plan/TaskSheet'
import type { DossierSummary } from '@/services/dossiers.service'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  clauses: Clause[]
  assessments: ClauseAssessment[]
  tasks: Task[]
  clauseId: string | null
  onNavigate: (clauseId: string) => void
  onSave: (clauseId: string, patch: Partial<ClauseAssessment>) => void
  summary: DossierSummary
  versionNumber: string
}

/** D-16 — evaluate one clause; ←/→ to move, 0–4 / N to score. */
export function ClauseDrawer({ open, onOpenChange, clauses, assessments, tasks, clauseId, onNavigate, onSave, summary, versionNumber }: Props) {
  const index = clauses.findIndex((c) => c.id === clauseId)
  const clause = clauses[index]
  const a = assessments.find((x) => x.clauseId === clauseId)
  const [constat, setConstat] = useState('')
  const [preuves, setPreuves] = useState('')
  const [showReq, setShowReq] = useState(true)
  const [actionFor, setActionFor] = useState<Partial<Task> | null>(null)

  useEffect(() => {
    setConstat(a?.constat ?? '')
    setPreuves(a?.preuves ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clauseId])

  const flushText = () => {
    if (!clause || !a) return
    if (constat !== a.constat || preuves !== a.preuves) onSave(clause.id, { constat, preuves })
  }
  const go = (dir: 1 | -1) => {
    flushText()
    const next = clauses[index + dir]
    if (next) onNavigate(next.id)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return
      if (e.key === 'ArrowRight' && !target.closest('[role=radiogroup]')) go(1)
      else if (e.key === 'ArrowLeft' && !target.closest('[role=radiogroup]')) go(-1)
      else if (/^[0-4]$/.test(e.key) && clause) onSave(clause.id, { score: Number(e.key) as Score, applicable: true })
      else if (e.key.toLowerCase() === 'n' && clause) onSave(clause.id, { applicable: false, score: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!clause || !a) return null
  const linked = tasks.filter((t) => t.sourceClauseId === clause.id)
  const value = !a.applicable ? 'NA' : a.score
  const isGap = a.applicable && a.score !== null && a.score <= 2

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) flushText()
          onOpenChange(o)
        }}
      >
        <SheetContent
          width="lg"
          title={
            <span className="flex items-center gap-2">
              <span className="font-mono text-brand-700">§ {clause.code}</span> {clause.titre}
            </span>
          }
          description={
            <span className="flex flex-wrap items-center gap-2">
              {CHAPTER_TITLES[clause.chapitre]}
              {clause.nouveaute2026 && <Badge tone="violet">Nouveauté 2026</Badge>}
              <span className="inline-flex items-center gap-1 text-[12px]">
                <Lock className="size-3" /> Socle v{versionNumber}
              </span>
            </span>
          }
          headerExtra={
            <span className="mr-1 hidden items-center gap-1 sm:flex">
              <Button variant="ghost" size="icon-sm" onClick={() => go(-1)} disabled={index === 0} aria-label="Clause précédente">
                <ChevronLeft />
              </Button>
              <span className="font-mono text-[12px] text-muted tabular">
                {index + 1}/{clauses.length}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={() => go(1)} disabled={index === clauses.length - 1} aria-label="Clause suivante">
                <ChevronRight />
              </Button>
            </span>
          }
          footer={
            <>
              <span className="mr-auto hidden items-center gap-1.5 text-[12px] text-muted md:flex">
                <Kbd>0</Kbd>–<Kbd>4</Kbd> noter · <Kbd>N</Kbd> non applicable · <Kbd>←</Kbd>
                <Kbd>→</Kbd> naviguer
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  flushText()
                  onOpenChange(false)
                }}
              >
                Fermer
              </Button>
              <Button onClick={() => (index < clauses.length - 1 ? go(1) : (flushText(), onOpenChange(false)))}>{index < clauses.length - 1 ? 'Enregistrer et suivant' : 'Enregistrer'}</Button>
            </>
          }
        >
          <div className="flex flex-col gap-6">
            <section className="rounded-lg border border-line bg-canvas">
              <button type="button" onClick={() => setShowReq((s) => !s)} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold text-ink-soft" aria-expanded={showReq}>
                Exigence de la norme
                <ChevronDown className={cn('size-4 transition-transform', showReq && 'rotate-180')} />
              </button>
              {showReq && (
                <div className="border-t border-line px-4 py-3">
                  <p className="text-[14px] leading-relaxed text-ink">{clause.exigence}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft">
                    <Lightbulb className="size-3.5 text-brand-600" /> Preuves attendues
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-[13px] text-ink-soft">
                    {clause.guide.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-[13.5px] font-bold text-ink">Score de couverture</h3>
              <ClauseScorePicker value={value} onChange={(v) => onSave(clause.id, v === 'NA' ? { applicable: false, score: null } : { applicable: true, score: v })} />
              <p className="mt-2 min-h-5 text-[13px] text-ink-soft" aria-live="polite">
                {value === 'NA' ? 'Non applicable : exclue du calcul de couverture.' : value === null ? 'Clause non évaluée.' : <><strong className="text-ink">{SCORE_LABELS[value]}</strong> — {SCORE_HINTS[value]}</>}
              </p>
            </section>

            <Field label="Constat">{(p) => <Textarea {...p} rows={3} value={constat} onChange={(e) => setConstat(e.target.value)} onBlur={flushText} placeholder="Ce qui a été observé lors de l'entretien ou de la revue documentaire…" />}</Field>
            <Field label="Preuves consultées" optional>
              {(p) => <Textarea {...p} rows={2} value={preuves} onChange={(e) => setPreuves(e.target.value)} onBlur={flushText} placeholder="Documents, enregistrements, entretiens…" />}
            </Field>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13.5px] font-bold text-ink">Actions liées</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setActionFor({
                      titre: `Mettre en conformité § ${clause.code} — ${clause.titre}`,
                      description: constat ? `Écart constaté : ${constat}` : '',
                      phase: 4,
                      sourceClauseId: clause.id,
                      priority: 'HAUTE',
                      dueDate: formatISO(addDays(new Date(), 30), { representation: 'date' }),
                    })
                  }
                >
                  <Plus /> Créer une action
                </Button>
              </div>
              {linked.length ? (
                <ul className="divide-y divide-line rounded-md border border-line">
                  {linked.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                      <ClipboardList className="size-4 text-muted" />
                      <span className="min-w-0 flex-1 truncate">{t.titre}</span>
                      <StatusBadge status={t.status} />
                    </li>
                  ))}
                </ul>
              ) : isGap ? (
                <p className="rounded-md bg-brand-50 px-3 py-2.5 text-[13px] text-brand-900">Cette clause présente un écart. Créer une action corrective l'ajoutera au plan de transition, en phase 4.</p>
              ) : (
                <p className="text-[13px] text-muted">Aucune action liée.</p>
              )}
            </section>

            {a.evaluatedAt && (
              <p className="text-[12px] text-muted">
                Dernière évaluation {a.evaluatedBy ? `par ${a.evaluatedBy} ` : ''}le {dateTime(a.evaluatedAt)}
              </p>
            )}
          </div>
        </SheetContent>
      </Dialog>
      <TaskSheet open={!!actionFor} onOpenChange={(o) => !o && setActionFor(null)} summary={summary} initial={actionFor ?? undefined} title="Créer une action corrective" />
    </>
  )
}
