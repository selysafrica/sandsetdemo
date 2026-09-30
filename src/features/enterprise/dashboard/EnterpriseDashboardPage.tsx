import { ArrowRight, BookOpen, Check, CreditCard, FileText, GraduationCap, LifeBuoy, ListChecks, Sparkles, Target } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMyDossier, useMyEnterprise } from '@/hooks/queries'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { CHAPTER_TITLES } from '@/lib/labels'
import { coverageByChapter } from '@/lib/calculations/coverage'
import { date, daysUntil, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { kitService } from '@/services/kit.service'
import { planPrice } from '@/services/enterprises.service'
import { useAssessments } from '@/hooks/queries'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/display'
import { NewVersionBanner } from '@/components/common/banners'
import { CoverageRing } from '@/components/common/indicators'
import { PHASE_TITLES } from '@/components/common/PhaseRail'
import { TransitionClock } from '@/components/common/TransitionClock'
import { PageSkeleton } from '@/components/common/states'

export function EnterpriseDashboardPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { data: s, isLoading } = useMyDossier()
  const { data: ent } = useMyEnterprise()
  const { data: assessments = [] } = useAssessments(s?.dossier.id ?? '')
  if (isLoading || !s) return <PageSkeleton />

  const todo = s.coverage.applicable - s.coverage.evaluated
  const chapters = coverageByChapter(s.version.content.clauses, assessments)
  const weakest = chapters.find((c) => c.evaluated < c.applicable) ?? chapters.sort((a, b) => a.coverage - b.coverage)[0]
  const remainingInChapter = weakest ? weakest.applicable - weakest.evaluated : 0
  const steps = [
    { n: 1, title: 'Créer son compte et son dossier', detail: 'Organisation et formule enregistrées', done: true, to: '/espace/dossier/vue-ensemble' },
    { n: 2, title: "Compléter son analyse d'écart", detail: `${s.coverage.evaluated}/${s.coverage.applicable} clauses · couverture ${s.coverage.coverage} %`, done: todo === 0, to: '/espace/dossier/analyse-ecart' },
    { n: 3, title: "Mettre en œuvre son plan d'action", detail: `${s.progress.plan} % des tâches · ${s.docs.VALIDE}/${s.docs.total} documents validés · formations ${s.progress.trainings} %`, done: s.progress.plan === 100, to: '/espace/dossier/plan' },
    { n: 4, title: 'Préparer l’audit de certification', detail: `Audit visé le ${date(s.dossier.targetAuditDate)}`, done: false, to: '/espace/dossier/rapport' },
  ]
  const current = steps.find((x) => !x.done)?.n ?? 4
  const next =
    todo > 0 && weakest
      ? { text: `Évaluez les ${remainingInChapter} clauses restantes du chapitre ${weakest.chapitre} — ${CHAPTER_TITLES[weakest.chapitre]}`, time: `environ ${Math.max(5, remainingInChapter * 3)} min`, to: '/espace/dossier/analyse-ecart' }
      : s.nextDue
        ? { text: `Avancez la tâche « ${s.nextDue.titre} »`, time: `échéance le ${date(s.nextDue.dueDate)}`, to: '/espace/dossier/plan' }
        : { text: 'Générez votre rapport de synthèse pour la direction', time: '2 min', to: '/espace/dossier/rapport' }

  return (
    <>
      <div className="mb-6">
        <p className="text-[13px] font-semibold text-brand-700">{ent?.enterprise.raisonSociale}</p>
        <h1 className="text-[26px] font-bold">Bonjour {user?.firstName}</h1>
      </div>
      {s.hasNewerVersion && (
        <NewVersionBanner className="mb-6" actionLabel="Voir" onAction={() => navigate('/espace/dossier/vue-ensemble')}>
          Le contenu socle a été mis à jour (version {kitService.latest().number}). Vos évaluations sont conservées.
        </NewVersionBanner>
      )}

      <Card className="overflow-hidden">
        <div className="grid gap-6 bg-gradient-to-br from-brand-950 to-brand-800 p-6 text-white md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="rounded-full bg-white/95 p-1.5">
            <CoverageRing value={s.coverage.coverage} size="lg" sublabel="couverture" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-brand-200">Mon avancement</p>
            <p className="font-mono text-[40px] leading-none">{s.progress.overall} %</p>
            <div className="mt-3 h-2 max-w-md overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-brand-300 transition-[width] duration-700" style={{ width: `${s.progress.overall}%` }} />
            </div>
            <p className="mt-3 text-[14px] text-brand-50">
              Vous êtes en phase {s.currentPhase} : <strong>{PHASE_TITLES[s.currentPhase - 1]}</strong>.
            </p>
          </div>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/espace/dossier/vue-ensemble">
              Voir mon dossier <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-line bg-accent-soft px-6 py-4">
          <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-fg">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-accent">Prochaine meilleure action</p>
            <p className="font-semibold text-ink">{next.text}</p>
            <p className="text-[12.5px] text-muted">{next.time}</p>
          </div>
          <Button asChild>
            <Link to={next.to}>Commencer</Link>
          </Button>
        </div>
      </Card>

      <h2 className="mt-8 mb-3 text-[16px] font-bold">Votre parcours</h2>
      <ol className="grid gap-3 md:grid-cols-4">
        {steps.map((st) => (
          <li key={st.n}>
            <Link to={st.to} className={cn('flex h-full flex-col rounded-lg border bg-surface p-4 shadow-card transition-colors hover:border-accent/50', st.n === current ? 'border-accent ring-2 ring-accent-soft' : 'border-line')}>
              <span className={cn('grid size-8 place-items-center rounded-full font-mono text-[13px]', st.done ? 'bg-accent text-accent-fg' : st.n === current ? 'border-2 border-accent text-accent' : 'border border-line-strong text-muted')}>{st.done ? <Check className="size-4" strokeWidth={3} /> : st.n}</span>
              <p className="mt-3 font-semibold text-ink">{st.title}</p>
              <p className="mt-1 text-[12.5px] text-muted">{st.detail}</p>
              {st.n === current && <span className="mt-auto pt-3 text-[12.5px] font-semibold text-accent">Étape en cours →</span>}
            </Link>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-bold">Échéance de transition</h3>
          <TransitionClock className="mt-4" />
          {s.dossier.certificateExpiry && (
            <p className="mt-4 rounded-md bg-canvas px-3 py-2 text-[13px] text-ink-soft">
              Votre certificat 2015 expire le <strong>{date(s.dossier.certificateExpiry)}</strong> (dans {daysUntil(s.dossier.certificateExpiry)} jours).
            </p>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold">
            <CreditCard className="size-4 text-accent" /> Abonnement
          </h3>
          {ent && (
            <>
              <p className="mt-3 text-[15px] font-semibold">Formule {ent.enterprise.plan === 'PRO' ? 'Pro' : 'Essentiel'}</p>
              <p className="font-mono text-[13px] text-ink-soft">
                {money(planPrice(ent.enterprise.plan, ent.enterprise.periodicity))} / {ent.enterprise.periodicity === 'ANNUEL' ? 'an' : 'mois'}
              </p>
              <p className="mt-1 text-[12.5px] text-muted">Prochaine facturation le {date(ent.enterprise.nextBillingAt)}</p>
            </>
          )}
          <Button variant="link" size="sm" className="mt-2" asChild>
            <Link to="/espace/abonnement">Gérer l'abonnement</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold">
            <LifeBuoy className="size-4 text-accent" /> Besoin d'aide ?
          </h3>
          <ul className="mt-3 flex flex-col gap-2 text-[13.5px]">
            {[
              { icon: <Target />, label: "Réussir son analyse d'écart" },
              { icon: <ListChecks />, label: 'Construire son plan en 6 phases' },
              { icon: <FileText />, label: 'Quels documents pour 2026 ?' },
              { icon: <GraduationCap />, label: 'Former ses auditeurs internes' },
            ].map((g) => (
              <li key={g.label}>
                <Link to="/espace/support" className="flex items-center gap-2 text-ink-soft hover:text-accent [&_svg]:size-4 [&_svg]:text-muted">
                  {g.icon}
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link to="/espace/support">
              <BookOpen /> Centre d'aide
            </Link>
          </Button>
        </Card>
      </div>
    </>
  )
}
