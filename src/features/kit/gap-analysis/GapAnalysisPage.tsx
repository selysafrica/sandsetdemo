import { Grid3x3, List, Lock, PanelRightClose, PanelRightOpen, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { useAssessments, useTasks } from '@/hooks/queries'
import { computeCoverage, coverageByChapter, coverageTone, GAP_THRESHOLD } from '@/lib/calculations/coverage'
import { CHAPTER_TITLES } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { Clause } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/controls'
import { Badge, Card, Skeleton } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/overlays'
import { axisProps, ChartTooltip } from '@/components/common/charts'
import { ClauseHeatmap, ScoreLegend } from '@/components/common/ClauseHeatmap'
import { ScoreDot } from '@/components/common/ClauseScorePicker'
import { CoverageRing } from '@/components/common/indicators'
import { FilterChip } from '@/components/common/misc'
import { matches, SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/states'
import { useDossierContext } from '../context'
import { ClauseDrawer } from './ClauseDrawer'
import { useSaveAssessment } from './useSaveAssessment'

type Filter = 'ALL' | 'TODO' | 'GAPS' | 'NEW' | 'NA'
const toneBg = { danger: 'var(--color-danger)', warning: 'oklch(0.72 0.15 70)', brand: 'var(--color-brand-600)', success: 'var(--color-success)' }

export function GapAnalysisPage() {
  const { dossierId, summary } = useDossierContext()
  const { data: assessments, isLoading } = useAssessments(dossierId)
  const { data: tasks = [] } = useTasks(dossierId)
  const save = useSaveAssessment(dossierId)
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'list' | 'heatmap'>('list')
  const [showSynth, setShowSynth] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [quick, setQuick] = useState<Clause[] | null>(null)
  const clauses = summary.version.content.clauses

  useEffect(() => {
    const c = params.get('clause')
    if (c) {
      setOpenId(c)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const byClause = useMemo(() => new Map((assessments ?? []).map((a) => [a.clauseId, a])), [assessments])
  const coverage = useMemo(() => computeCoverage(clauses, assessments ?? []), [clauses, assessments])
  const chapters = useMemo(() => coverageByChapter(clauses, assessments ?? []), [clauses, assessments])

  const visible = useMemo(
    () =>
      clauses.filter((c) => {
        const a = byClause.get(c.id)
        if (!matches(query, c.code, c.titre, c.exigence)) return false
        if (filter === 'TODO') return a?.applicable !== false && a?.score == null
        if (filter === 'GAPS') return a?.applicable !== false && a?.score != null && a.score <= GAP_THRESHOLD
        if (filter === 'NEW') return c.nouveaute2026
        if (filter === 'NA') return a?.applicable === false
        return true
      }),
    [clauses, byClause, filter, query],
  )

  const drawerList: Clause[] = quick ?? visible
  const startQuick = () => {
    const todo = clauses.filter((c) => byClause.get(c.id)?.score == null && byClause.get(c.id)?.applicable !== false)
    if (!todo.length) return
    setQuick(todo)
    setOpenId(todo[0].id)
  }
  const topGaps = clauses
    .map((c) => ({ c, a: byClause.get(c.id) }))
    .filter(({ a }) => a?.applicable && a.score !== null && a.score <= GAP_THRESHOLD)
    .sort((x, y) => (x.a!.score! - y.a!.score!) || y.c.poids - x.c.poids)
    .slice(0, 5)
  const count = (f: Filter) =>
    clauses.filter((c) => {
      const a = byClause.get(c.id)
      if (f === 'TODO') return a?.applicable !== false && a?.score == null
      if (f === 'GAPS') return a?.applicable !== false && a?.score != null && a.score <= GAP_THRESHOLD
      if (f === 'NEW') return c.nouveaute2026
      if (f === 'NA') return a?.applicable === false
      return true
    }).length

  if (isLoading || !assessments) return <Skeleton className="h-96 w-full rounded-lg" />

  return (
    <div>
      <div className="sticky top-[6.25rem] z-[var(--z-sticky)] -mx-1 mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-line bg-surface/95 px-4 py-3 shadow-card backdrop-blur-sm">
        <CoverageRing value={coverage.coverage} size="sm" />
        <div className="leading-tight">
          <p className="text-[13.5px] font-bold text-ink">Couverture {coverage.coverage} %</p>
          <p className="text-[12.5px] text-muted">
            <span className="font-mono tabular">{coverage.evaluated}</span>/{coverage.applicable} clauses évaluées · <span className="font-mono text-danger tabular">{coverage.gaps}</span> écarts
          </p>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')} count={count('ALL')}>
            Toutes
          </FilterChip>
          <FilterChip active={filter === 'TODO'} onClick={() => setFilter('TODO')} count={count('TODO')}>
            À évaluer
          </FilterChip>
          <FilterChip active={filter === 'GAPS'} onClick={() => setFilter('GAPS')} count={count('GAPS')}>
            Écarts
          </FilterChip>
          <FilterChip active={filter === 'NEW'} onClick={() => setFilter('NEW')} count={count('NEW')}>
            Nouveautés 2026
          </FilterChip>
          <FilterChip active={filter === 'NA'} onClick={() => setFilter('NA')} count={count('NA')}>
            N/A
          </FilterChip>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="§ 6.1, risques…" className="w-full sm:w-52" label="Rechercher une clause" />
        <Segmented
          label="Vue"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'list', label: 'Liste', icon: <List /> },
            { value: 'heatmap', label: 'Carte', icon: <Grid3x3 /> },
          ]}
        />
        <Button size="sm" onClick={startQuick} disabled={!count('TODO')}>
          <Zap /> Évaluation rapide
        </Button>
      </div>

      <div className={cn('grid gap-6', showSynth ? 'xl:grid-cols-[220px_1fr_320px]' : 'xl:grid-cols-[220px_1fr]')}>
        <nav aria-label="Chapitres de la norme" className="hidden xl:sticky xl:top-[12rem] xl:block xl:self-start">
          <ul className="flex flex-col gap-1">
            {chapters.map((ch) => (
              <li key={ch.chapitre}>
                <a href={`#ch-${ch.chapitre}`} className="block rounded-md px-3 py-2 hover:bg-panel">
                  <span className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="truncate">
                      <span className="font-mono text-brand-700">§ {ch.chapitre}</span> <span className="text-ink-soft">{CHAPTER_TITLES[ch.chapitre]}</span>
                    </span>
                    <span className="font-mono text-[11.5px] text-muted tabular">{ch.coverage}%</span>
                  </span>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-panel">
                    <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${ch.coverage}%`, background: toneBg[coverageTone(ch.coverage)] }} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          {view === 'heatmap' ? (
            <Card className="p-5">
              <ClauseHeatmap clauses={visible} assessments={assessments} onSelect={setOpenId} />
              <ScoreLegend className="mt-6 border-t border-line pt-4" />
            </Card>
          ) : visible.length === 0 ? (
            <EmptyState title="Aucune clause pour ce filtre" description={filter === 'TODO' ? 'Toutes les clauses applicables sont évaluées. Bravo !' : 'Modifiez le filtre ou la recherche.'} />
          ) : (
            <div className="flex flex-col gap-6">
              {chapters
                .filter((ch) => visible.some((c) => c.chapitre === ch.chapitre))
                .map((ch) => (
                  <section key={ch.chapitre} id={`ch-${ch.chapitre}`} className="scroll-mt-48">
                    <div className="mb-2 flex items-end justify-between gap-3 border-b border-line pb-2">
                      <h2 className="text-[15px] font-bold text-ink">
                        <span className="font-mono text-brand-700">§ {ch.chapitre}</span> — {CHAPTER_TITLES[ch.chapitre]}
                      </h2>
                      <span className="text-[12.5px] text-muted">
                        {ch.evaluated}/{ch.applicable} · <span className="font-mono">{ch.coverage} %</span>
                      </span>
                    </div>
                    <ul className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
                      {visible
                        .filter((c) => c.chapitre === ch.chapitre)
                        .map((c) => {
                          const a = byClause.get(c.id)
                          const actions = tasks.filter((t) => t.sourceClauseId === c.id).length
                          return (
                            <li key={c.id} className="border-b border-line last:border-0">
                              <button type="button" onClick={() => setOpenId(c.id)} className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-brand-50/50">
                                <span className="w-12 shrink-0 font-mono text-[13px] text-brand-700">{c.code}</span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-ink">{c.titre}</span>
                                    {c.nouveaute2026 && <Badge tone="violet">Nouveauté 2026</Badge>}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[12.5px] text-muted">{a?.constat || (a?.score == null && a?.applicable !== false ? 'À évaluer' : '')}</span>
                                </span>
                                {actions > 0 && <span className="hidden text-[12px] text-muted sm:inline">{actions} action{actions > 1 ? 's' : ''}</span>}
                                <Tooltip content="Grille issue du contenu socle (lecture seule)">
                                  <Lock className="hidden size-3.5 text-subtle md:block" aria-label="Contenu socle" />
                                </Tooltip>
                                <ScoreDot score={a?.score ?? null} applicable={a?.applicable !== false} />
                              </button>
                            </li>
                          )
                        })}
                    </ul>
                  </section>
                ))}
            </div>
          )}
        </div>

        {showSynth ? (
          <aside className="flex flex-col gap-4 xl:sticky xl:top-[12rem] xl:self-start">
            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[14px] font-bold">Couverture par chapitre</h3>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowSynth(false)} aria-label="Masquer la synthèse" className="hidden xl:inline-flex">
                  <PanelRightClose />
                </Button>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chapters} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="chapitre" tickFormatter={(c) => `§ ${c}`} width={36} {...axisProps} />
                    <RTooltip content={<ChartTooltip format={(v) => `${v} %`} />} labelFormatter={(c) => CHAPTER_TITLES[Number(c)]} cursor={{ fill: 'oklch(0.972 0.016 264)' }} />
                    <Bar dataKey="coverage" name="Couverture" radius={[0, 3, 3, 0]} barSize={14}>
                      {chapters.map((ch) => (
                        <Cell key={ch.chapitre} fill={toneBg[coverageTone(ch.coverage)]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-[14px] font-bold">Écarts prioritaires</h3>
              <p className="text-[12.5px] text-muted">Score le plus bas, puis poids le plus fort</p>
              {topGaps.length ? (
                <ol className="mt-3 flex flex-col gap-1">
                  {topGaps.map(({ c, a }) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => setOpenId(c.id)} className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-panel">
                        <ScoreDot score={a!.score} />
                        <span className="font-mono text-brand-700">{c.code}</span>
                        <span className="min-w-0 flex-1 truncate">{c.titre}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-[13px] text-muted">Aucun écart identifié pour l'instant.</p>
              )}
            </Card>
            <ScoreLegend />
          </aside>
        ) : (
          <Button variant="outline" size="sm" className="fixed top-48 right-4 hidden xl:inline-flex" onClick={() => setShowSynth(true)}>
            <PanelRightOpen /> Synthèse
          </Button>
        )}
      </div>

      <ClauseDrawer
        open={!!openId}
        onOpenChange={(o) => {
          if (!o) {
            setOpenId(null)
            setQuick(null)
          }
        }}
        clauses={drawerList.some((c) => c.id === openId) ? drawerList : clauses}
        assessments={assessments}
        tasks={tasks}
        clauseId={openId}
        onNavigate={setOpenId}
        onSave={(id, patch) => void save(id, patch)}
        summary={summary}
        versionNumber={summary.version.number}
      />
    </div>
  )
}
