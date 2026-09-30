import * as Accordion from '@radix-ui/react-accordion'
import { ArrowRight, Building2, Check, ChevronDown, FileCheck2, Handshake, Lock, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '@/mocks/db'
import { money } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { CoverageRing } from '@/components/common/indicators'
import { StandSetLogo } from '@/components/common/Logo'
import { PHASE_TITLES, PhaseRail } from '@/components/common/PhaseRail'
import { TransitionClock } from '@/components/common/TransitionClock'
import { SCORE_COLORS } from '@/components/common/indicators'

const CHANGES = [
  { code: '4.1 · 4.2', title: 'Le climat entre dans le contexte', text: "L'organisme doit déterminer si le changement climatique est un enjeu pertinent et si ses parties intéressées ont des exigences à ce sujet." },
  { code: '5.1 · 7.3', title: 'Culture qualité et comportement éthique', text: 'La direction promeut explicitement une culture qualité ; les personnes sont sensibilisées à l’éthique.' },
  { code: '6.1', title: 'Risques et opportunités, séparément', text: 'Les opportunités ne sont plus un sous-produit des risques : elles se planifient pour elles-mêmes.' },
  { code: '6.3', title: 'Des modifications planifiées', text: 'Tout changement du système de management se prépare, avec ses conséquences et ses ressources.' },
]

const PHASE_TEXT = [
  'Périmètre, pilote, calendrier : la direction s’engage et l’existant est rassemblé.',
  'Chaque clause 2026 est notée de 0 à 4 ; le score de couverture se calcule en direct.',
  'Les écarts deviennent des actions, avec responsable et échéance.',
  'Procédures, registres et enregistrements sont mis à jour dans le registre documentaire.',
  'Direction, pilotes de processus et auditeurs internes suivent leur parcours.',
  'Audit interne, revue de direction, puis audit de transition par le certificateur.',
]

const FAQ = [
  ["Qu'est-ce qui change avec ISO 9001:2026 ?", 'La structure reste proche de 2015. Les principales évolutions portent sur le contexte (climat), la culture qualité et l’éthique, la distinction risques / opportunités et la planification des modifications.'],
  ['Jusqu’à quand ai-je pour migrer ?', 'La période de transition court jusqu’en septembre 2029. Après cette date, les certificats ISO 9001:2015 ne seront plus valides.'],
  ['Puis-je travailler avec mon consultant habituel ?', 'Oui : si votre cabinet est licencié StandSet, il vous accompagne dans son propre espace à sa marque. Sinon, l’espace entreprise vous permet d’avancer en autonomie.'],
  ['Où sont hébergées mes données ?', 'Sur une infrastructure cloud à faible latence pour l’Afrique de l’Ouest, conformément à la loi ivoirienne (ARTCI) et au RGPD.'],
]

export function LandingPage() {
  const licencies = db.licencies.filter((l) => l.status === 'HABILITE').length
  const dossiers = db.licencies.reduce((a, l) => a + l.indicators.dossiersActifs, 0) + db.enterprises.length
  const pays = new Set(db.licencies.map((l) => l.pays)).size
  const demoPhases = [100, 100, 100, 55, 20, 0].map((pct, i) => ({ phase: i + 1, pct, done: Math.round(pct / 20), total: 5 }))

  return (
    <div className="bg-surface">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-line bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Link to="/" aria-label="StandSet, accueil">
            <StandSetLogo />
          </Link>
          <nav aria-label="Navigation du site" className="hidden items-center gap-6 text-[14px] font-medium text-ink-soft md:flex">
            <a href="#norme" className="hover:text-ink">La norme 2026</a>
            <a href="#methode" className="hover:text-ink">La méthode</a>
            <a href="#tarifs" className="hover:text-ink">Tarifs</a>
            <a href="#licencies" className="hover:text-ink">Devenir licencié</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/connexion">Se connecter</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/inscription">Démarrer ma transition</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="contenu">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div>
            <h1 className="text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-ink">
              Votre transition ISO&nbsp;9001:2026, <span className="text-brand-700">tenue comme un registre.</span>
            </h1>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-ink-soft">
              Analyse d'écart clause par clause, plan en six phases, documents, formations et rapport pour la direction : une méthode structurée, en autonomie ou avec votre cabinet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/inscription">
                  Démarrer ma transition <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#methode">Voir la méthode</a>
              </Button>
            </div>
            <p className="mt-4 text-[13px] text-muted">Sans engagement · paiement par carte ou mobile money</p>
          </div>

          <div className="relative" aria-hidden>
            <div className="ledger-lines-light rounded-2xl border border-line bg-canvas p-6 shadow-pop">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-ink">Ivoire Agro SA</span>
                <span className="rounded bg-brand-50 px-1.5 font-mono text-[11px] text-brand-800">DOS-0041</span>
              </div>
              <div className="mt-5 flex items-center gap-5">
                <CoverageRing value={72} size="lg" sublabel="couverture" />
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-muted">§ 6 — Planification</p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-[12.5px]">
                    {[
                      ['6.1', 'Risques et opportunités', 1],
                      ['6.2', 'Objectifs qualité', 3],
                      ['6.3', 'Planification des modifications', 2],
                    ].map(([code, t, s]) => (
                      <li key={String(code)} className="flex items-center gap-2 rounded-md bg-surface px-2 py-1.5 shadow-xs">
                        <span className="font-mono text-brand-700">{code}</span>
                        <span className="flex-1 truncate">{t}</span>
                        <span className="rounded px-1.5 font-mono text-[11px] text-white" style={{ background: SCORE_COLORS[s as 1] }}>
                          {s}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6 rounded-lg bg-surface px-3 pt-4 pb-3 shadow-xs">
                <PhaseRail phases={demoPhases} current={4} dense />
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-line bg-surface px-4 py-3 shadow-pop sm:block">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <FileCheck2 className="size-4 text-success" /> Politique qualité validée
              </p>
              <p className="text-[12px] text-muted">14 / 24 documents validés</p>
            </div>
          </div>
        </section>

        <section className="bg-brand-950 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 md:grid-cols-[1fr_1.2fr]">
            <TransitionClock variant="hero" tone="dark" />
            <p className="text-[18px] leading-relaxed text-brand-100">
              Après septembre 2029, les certificats ISO 9001:2015 ne seront plus reconnus. Une transition bien menée prend de 9 à 15 mois : le calendrier se prépare maintenant.
            </p>
          </div>
        </section>

        <section id="norme" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <h2 className="text-[32px] leading-tight font-bold tracking-[-0.02em]">Ce que change l'édition 2026</h2>
              <p className="mt-4 text-[16px] text-ink-soft">La structure de la norme reste familière. Quatre évolutions demandent un vrai travail de mise à jour, et le Kit les signale dans chaque dossier.</p>
            </div>
            <ol className="divide-y divide-line border-y border-line">
              {CHANGES.map((c) => (
                <li key={c.code} className="grid gap-2 py-5 sm:grid-cols-[110px_1fr]">
                  <span className="font-mono text-[14px] text-brand-700">§ {c.code}</span>
                  <div>
                    <h3 className="text-[17px] font-bold text-ink">{c.title}</h3>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">{c.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="methode" className="scroll-mt-20 bg-canvas py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="max-w-2xl text-[32px] leading-tight font-bold tracking-[-0.02em]">Six phases, du cadrage au certificat</h2>
            <p className="mt-4 max-w-[60ch] text-[16px] text-ink-soft">Chaque phase contient des tâches types issues de la méthode StandSet. Vous les complétez, les datez, les affectez, et vous voyez l'avancement se remplir.</p>
            <ol className="relative mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {PHASE_TITLES.map((t, i) => (
                <li key={t} className="flex gap-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-brand-600 bg-surface font-mono text-[15px] text-brand-700">{i + 1}</span>
                  <div>
                    <h3 className="text-[17px] font-bold">{t}</h3>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">{PHASE_TEXT[i]}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="licencies" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <h2 className="text-[32px] font-bold tracking-[-0.02em]">Trois façons d'avancer</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="flex flex-col justify-between rounded-2xl bg-brand-700 p-8 text-white">
              <div>
                <UserRound className="size-7 text-brand-200" />
                <h3 className="mt-4 text-[24px] font-bold">En autonomie</h3>
                <p className="mt-2 max-w-md text-[15px] text-brand-100">Votre responsable qualité pilote la transition seul, guidé pas à pas : prochaine action recommandée, aide contextuelle, rapport prêt pour la direction.</p>
              </div>
              <Button variant="secondary" size="lg" className="mt-8 self-start" asChild>
                <Link to="/inscription">
                  Créer mon espace <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-line p-6">
                <Handshake className="size-6 text-brand-600" />
                <h3 className="mt-3 text-[18px] font-bold">Accompagné par un cabinet</h3>
                <p className="mt-1 text-[14.5px] text-ink-soft">Votre consultant licencié travaille avec vous dans son espace, à sa marque, avec la même méthode.</p>
              </div>
              <div className="rounded-2xl border border-line p-6">
                <Building2 className="size-6 text-brand-600" />
                <h3 className="mt-3 text-[18px] font-bold">Devenir licencié</h3>
                <p className="mt-1 text-[14.5px] text-ink-soft">Cabinets, organismes de formation, institutions : une instance à votre marque pour accompagner vos clients. {licencies} licenciés habilités à ce jour.</p>
                <a href="mailto:reseau@standset.com" className="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-brand-700 hover:underline">
                  Écrire au réseau <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="tarifs" className="scroll-mt-20 border-y border-line bg-canvas py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-[32px] font-bold tracking-[-0.02em]">Tarifs de l'espace entreprise</h2>
            <p className="mt-2 text-ink-soft">Mensuel sans engagement, ou annuel avec {db.grid.annualDiscountPct} % de remise.</p>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:max-w-4xl">
              {db.grid.plans.map((p) => (
                <div key={p.id} className={p.id === 'PRO' ? 'rounded-2xl border-2 border-brand-600 bg-surface p-7 shadow-pop' : 'rounded-2xl border border-line bg-surface p-7'}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[20px] font-bold">{p.name}</h3>
                    {p.id === 'PRO' && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[12px] font-semibold text-brand-800">Le plus choisi</span>}
                  </div>
                  <p className="mt-3 font-mono text-[30px] text-ink">
                    {money(p.monthly)}
                    <span className="text-[14px] text-muted"> / mois</span>
                  </p>
                  <ul className="mt-5 flex flex-col gap-2.5 text-[14.5px]">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-brand-600" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-7 w-full" variant={p.id === 'PRO' ? 'primary' : 'outline'} asChild>
                    <Link to="/inscription">Choisir {p.name}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <dl className="grid gap-8 border-y border-line py-10 sm:grid-cols-3">
            {[
              [licencies, 'cabinets et organismes habilités'],
              [dossiers, 'dossiers de transition en cours'],
              [pays, 'pays en Afrique de l’Ouest et centrale'],
            ].map(([v, l]) => (
              <div key={String(l)}>
                <dt className="sr-only">{l}</dt>
                <dd>
                  <span className="block font-mono text-[40px] text-brand-700">{v}</span>
                  <span className="text-[14.5px] text-ink-soft">{l}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20">
          <h2 className="text-[28px] font-bold tracking-[-0.02em]">Questions fréquentes</h2>
          <Accordion.Root type="single" collapsible className="mt-6 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <Accordion.Item key={q} value={q}>
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left text-[16px] font-semibold">
                    {q}
                    <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="pb-4 text-[15px] leading-relaxed text-ink-soft">{a}</Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </section>
      </main>

      <footer className="bg-brand-950 text-brand-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-10 text-[13.5px]">
          <StandSetLogo inverted subtitle="Ensemble vers l'excellence opérationnelle" />
          <nav className="ml-auto flex flex-wrap gap-5" aria-label="Pied de page">
            <a href="#mentions" className="hover:text-white">Mentions légales</a>
            <a href="#confidentialite" className="inline-flex items-center gap-1 hover:text-white">
              <Lock className="size-3.5" /> Confidentialité (ARTCI · RGPD)
            </a>
            <a href="mailto:contact@standset.com" className="hover:text-white">contact@standset.com</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
