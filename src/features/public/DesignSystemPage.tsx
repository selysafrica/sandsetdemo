import { Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { STATUS_META, type AnyStatus } from '@/lib/labels'
import type { Score } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Checkbox, Segmented, Stepper, Switch } from '@/components/ui/controls'
import { Badge, Card, Kbd, Progress, Skeleton } from '@/components/ui/display'
import { Field, Input, MoneyInput, Select } from '@/components/ui/form'
import { ClauseScorePicker, ScoreDot } from '@/components/common/ClauseScorePicker'
import { CoverageRing, ScoreBar } from '@/components/common/indicators'
import { KpiCard } from '@/components/common/KpiCard'
import { StandSetLogo } from '@/components/common/Logo'
import { PhaseRail } from '@/components/common/PhaseRail'
import { DottedLeader, Money, RefCode, SectionTitle, Stamp, StatusBadge } from '@/components/common/registre'
import { EmptyState } from '@/components/common/states'
import { TransitionClock } from '@/components/common/TransitionClock'

const SWATCHES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  )
}

/** Living style guide (dev reference). */
export function DesignSystemPage() {
  const [score, setScore] = useState<Score | null | 'NA'>(3)
  const [seg, setSeg] = useState<'a' | 'b'>('a')
  const phases = [100, 100, 70, 20, 0, 0].map((pct, i) => ({ phase: i + 1, pct, done: pct / 20, total: 5 }))
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-10">
      <header>
        <StandSetLogo subtitle="Design system « Registre bleu »" />
      </header>
      <Block title="Palette de marque">
        <div className="grid grid-cols-11 overflow-hidden rounded-lg">
          {SWATCHES.map((s) => (
            <div key={s} className="h-16 p-1.5 text-[10px] font-mono" style={{ background: `var(--color-brand-${s})`, color: Number(s) >= 500 ? 'white' : 'var(--color-ink)' }}>
              {s}
            </div>
          ))}
        </div>
      </Block>
      <Block title="Typographie">
        <p className="text-[32px] font-bold tracking-[-0.02em]">Titre d'écran — Plus Jakarta Sans</p>
        <p className="text-[14px] text-ink-soft">Corps de texte 14 px, lisible sur écran de terrain et sur mobile.</p>
        <p className="font-mono text-[20px] tabular">1 250 000 FCFA · § 6.1 · DOS-0041</p>
      </Block>
      <Block title="Boutons et contrôles">
        <div className="flex flex-wrap gap-2">
          <Button><Plus /> Principal</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="outline">Contour</Button>
          <Button variant="ghost">Discret</Button>
          <Button variant="danger">Destructif</Button>
          <Button loading>Chargement</Button>
          <Button disabled>Désactivé</Button>
        </div>
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <Field label="Champ texte" hint="Aide contextuelle">{(p) => <Input {...p} placeholder="Saisie…" />}</Field>
          <Field label="Erreur" error="Ce champ est requis.">{(p) => <Input {...p} />}</Field>
          <Field label="Liste">{(p) => <Select {...p}><option>Option</option></Select>}</Field>
          <Field label="Montant">{(p) => <MoneyInput {...p} value={1_000_000} onChange={() => undefined} />}</Field>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Checkbox defaultChecked aria-label="Case" />
          <Switch defaultChecked aria-label="Interrupteur" />
          <Segmented label="Segment" value={seg} onChange={setSeg} options={[{ value: 'a', label: 'Liste' }, { value: 'b', label: 'Carte' }]} />
          <Kbd>Ctrl</Kbd>
        </div>
        <Stepper steps={['Entité', 'Administrateur', 'Récapitulatif']} current={1} className="max-w-xl" />
      </Block>
      <Block title="Statuts">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_META) as AnyStatus[]).slice(0, 18).map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
          <Badge tone="violet">Nouveauté 2026</Badge>
        </div>
        <div className="flex gap-6">
          <Stamp status="HABILITE" />
          <Stamp status="SUSPENDU" />
          <Stamp status="EN_ATTENTE" />
        </div>
      </Block>
      <Block title="Motifs registre">
        <Card className="max-w-md p-5">
          <DottedLeader label="Référence" value={<RefCode value="LIC-0001" />} />
          <DottedLeader label="Droit d'entrée" value={<Money value={1_000_000} />} />
          <DottedLeader label="Total" value={<Money value={2_600_000} />} strong />
        </Card>
      </Block>
      <Block title="Éléments signature">
        <div className="flex flex-wrap items-center gap-6">
          <CoverageRing value={28} size="md" />
          <CoverageRing value={55} size="md" />
          <CoverageRing value={78} size="lg" sublabel="couverture" />
          <CoverageRing value={94} size="md" />
        </div>
        <ClauseScorePicker value={score} onChange={setScore} />
        <div className="flex gap-2">
          {([0, 1, 2, 3, 4] as Score[]).map((s) => <ScoreDot key={s} score={s} />)}
          <ScoreDot score={null} />
        </div>
        <Card className="px-4 pt-5 pb-4">
          <PhaseRail phases={phases} current={3} />
        </Card>
        <ScoreBar value={64} className="max-w-sm" />
        <Progress value={40} className="max-w-sm" />
        <TransitionClock variant="hero" />
      </Block>
      <Block title="Indicateurs">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Dossiers actifs" value={105} />
          <KpiCard label="Couverture" value={68} format={(v) => `${Math.round(v)} %`} />
          <KpiCard label="Chargement" value={0} loading />
          <KpiCard label="Écart" value={12} delta={{ value: '+3', positive: false }} />
        </div>
      </Block>
      <Block title="États">
        <Skeleton className="h-10 w-full" />
        <EmptyState title="Aucun dossier pour le moment" description="Un état vide explique quoi faire ensuite." action={<Button>Créer un dossier</Button>} />
      </Block>
    </div>
  )
}
