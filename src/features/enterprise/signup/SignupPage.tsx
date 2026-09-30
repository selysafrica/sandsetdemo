import { ArrowRight, Check, Target, Users, FileText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { db } from '@/mocks/db'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { enterprisesService, planPrice, type SignupInput } from '@/services/enterprises.service'
import type { Periodicity, Plan } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { CheckRow, Segmented, Stepper, Switch } from '@/components/ui/controls'
import { Badge } from '@/components/ui/display'
import { Field, Input, Select } from '@/components/ui/form'
import { CoverageRing } from '@/components/common/indicators'
import { StandSetLogo } from '@/components/common/Logo'
import { DottedLeader } from '@/components/common/registre'
import { isStrongPassword, PasswordStrength } from '@/features/auth/pages/PasswordPages'
import { PaymentForm } from '../billing/PaymentForm'

const SECTEURS = ['Industrie', 'Agroalimentaire', 'BTP', 'Logistique', 'Santé', 'Services', 'Énergie', 'Distribution']
const EFFECTIFS = ['10 à 49', '50 à 249', '250 à 999', '1 000 et plus']
const PAYS = [["Côte d'Ivoire", '+225'], ['Sénégal', '+221'], ['Bénin', '+229'], ['Togo', '+228'], ['Burkina Faso', '+226'], ['Mali', '+223'], ['Cameroun', '+237'], ['Guinée', '+224'], ['Niger', '+227']]
const STEPS = ['Organisation', 'Compte', 'Formule', 'Paiement']

export function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [org, setOrg] = useState({ raisonSociale: '', secteur: 'Industrie', effectif: '50 à 249', pays: "Côte d'Ivoire", ville: '', certifie: true, certificateExpiry: '', sites: 1 })
  const [acc, setAcc] = useState({ firstName: '', lastName: '', fonction: 'Responsable qualité', email: '', phone: '', password: '', cgu: false, marketing: false })
  const [plan, setPlan] = useState<Plan>('PRO')
  const [periodicity, setPeriodicity] = useState<Periodicity>('MENSUEL')
  const [touched, setTouched] = useState(false)
  const plans = db.grid.plans
  const price = planPrice(plan, periodicity)
  const dial = PAYS.find(([p]) => p === org.pays)?.[1] ?? '+225'

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (step === 0) {
      if (org.raisonSociale.length < 2) e.raisonSociale = 'Raison sociale requise.'
      if (org.ville.length < 2) e.ville = 'Ville requise.'
      if (org.certifie && !org.certificateExpiry) e.certificateExpiry = "Indiquez l'échéance de votre certificat."
    }
    if (step === 1) {
      if (!acc.firstName) e.firstName = 'Prénom requis.'
      if (!acc.lastName) e.lastName = 'Nom requis.'
      if (!/^\S+@\S+\.\S+$/.test(acc.email)) e.email = 'Courriel invalide.'
      if (acc.phone.replace(/\D/g, '').length < 8) e.phone = 'Téléphone requis.'
      if (!isStrongPassword(acc.password)) e.password = 'Le mot de passe ne respecte pas tous les critères.'
      if (!acc.cgu) e.cgu = 'Vous devez accepter les conditions.'
    }
    return e
  }, [step, org, acc])

  const next = () => {
    setTouched(true)
    if (Object.keys(errors).length) return
    setTouched(false)
    setStep(step + 1)
  }
  const err = (k: string) => (touched ? errors[k] : undefined)

  const finish = async (payment: SignupInput['payment']) => {
    try {
      const { userId } = await enterprisesService.signup({ ...org, ...acc, phone: `${dial} ${acc.phone}`, plan, periodicity, payment })
      navigate('/bienvenue-entreprise', { replace: true })
      authService.switchPersona(userId)
    } catch (e) {
      toast.error((e as Error).message)
      setStep(1)
    }
  }

  return (
    <div className="animate-rise">
      <h1 className="text-[26px] font-bold">Démarrer ma transition ISO 9001:2026</h1>
      <p className="mt-1 text-muted">
        Déjà inscrit ?{' '}
        <Link to="/connexion" className="font-semibold text-brand-700 hover:underline">
          Se connecter
        </Link>
      </p>
      <Stepper steps={STEPS} current={step} className="my-8" />
      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        <div>
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <Field label="Raison sociale" error={err('raisonSociale')}>{(p) => <Input {...p} autoFocus value={org.raisonSociale} onChange={(e) => setOrg({ ...org, raisonSociale: e.target.value })} />}</Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Secteur">{(p) => <Select {...p} value={org.secteur} onChange={(e) => setOrg({ ...org, secteur: e.target.value })}>{SECTEURS.map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
                <Field label="Effectif">{(p) => <Select {...p} value={org.effectif} onChange={(e) => setOrg({ ...org, effectif: e.target.value })}>{EFFECTIFS.map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
                <Field label="Pays">{(p) => <Select {...p} value={org.pays} onChange={(e) => setOrg({ ...org, pays: e.target.value })}>{PAYS.map(([s]) => <option key={s}>{s}</option>)}</Select>}</Field>
                <Field label="Ville" error={err('ville')}>{(p) => <Input {...p} value={org.ville} onChange={(e) => setOrg({ ...org, ville: e.target.value })} />}</Field>
                <Field label="Nombre de sites">{(p) => <Input {...p} type="number" min={1} value={org.sites} onChange={(e) => setOrg({ ...org, sites: Number(e.target.value) })} className="font-mono" />}</Field>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3">
                <span className="text-[13.5px] font-semibold">Déjà certifiée ISO 9001:2015</span>
                <Switch checked={org.certifie} onCheckedChange={(v) => setOrg({ ...org, certifie: v })} aria-label="Déjà certifiée ISO 9001:2015" />
              </div>
              {org.certifie && (
                <Field label="Échéance du certificat actuel" hint="Nous adaptons votre calendrier de transition à cette date." error={err('certificateExpiry')}>
                  {(p) => <Input {...p} type="date" value={org.certificateExpiry} onChange={(e) => setOrg({ ...org, certificateExpiry: e.target.value })} className="w-52" />}
                </Field>
              )}
            </div>
          )}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prénom" error={err('firstName')}>{(p) => <Input {...p} autoFocus value={acc.firstName} onChange={(e) => setAcc({ ...acc, firstName: e.target.value })} autoComplete="given-name" />}</Field>
                <Field label="Nom" error={err('lastName')}>{(p) => <Input {...p} value={acc.lastName} onChange={(e) => setAcc({ ...acc, lastName: e.target.value })} autoComplete="family-name" />}</Field>
                <Field label="Fonction">{(p) => <Input {...p} value={acc.fonction} onChange={(e) => setAcc({ ...acc, fonction: e.target.value })} />}</Field>
                <Field label="Téléphone" error={err('phone')}>
                  {(p) => (
                    <div className="flex">
                      <span className="grid h-9 place-items-center rounded-l-sm border border-r-0 border-line-strong bg-panel px-2.5 font-mono text-[13px] text-ink-soft">{dial}</span>
                      <Input {...p} type="tel" value={acc.phone} onChange={(e) => setAcc({ ...acc, phone: e.target.value })} className="rounded-l-none" autoComplete="tel-national" />
                    </div>
                  )}
                </Field>
              </div>
              <Field label="Courriel professionnel" error={err('email')}>{(p) => <Input {...p} type="email" value={acc.email} onChange={(e) => setAcc({ ...acc, email: e.target.value })} autoComplete="email" />}</Field>
              <Field label="Mot de passe" error={err('password')}>{(p) => <Input {...p} type="password" value={acc.password} onChange={(e) => setAcc({ ...acc, password: e.target.value })} autoComplete="new-password" />}</Field>
              <PasswordStrength value={acc.password} />
              <div className="mt-2 flex flex-col gap-1">
                <CheckRow checked={acc.cgu} onCheckedChange={(v) => setAcc({ ...acc, cgu: v })} label={<>J'accepte les <a href="#cgu" className="text-brand-700 underline">conditions générales</a> et la <a href="#confidentialite" className="text-brand-700 underline">politique de confidentialité</a></>} />
                {err('cgu') && <p className="text-[12.5px] font-medium text-danger">{err('cgu')}</p>}
                <CheckRow checked={acc.marketing} onCheckedChange={(v) => setAcc({ ...acc, marketing: v })} label="Recevoir les actualités sur la norme ISO 9001:2026 (facultatif)" />
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <Segmented
                label="Périodicité"
                value={periodicity}
                onChange={setPeriodicity}
                options={[
                  { value: 'MENSUEL', label: 'Mensuel' },
                  { value: 'ANNUEL', label: `Annuel −${db.grid.annualDiscountPct} %` },
                ]}
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {plans.map((p) => (
                  <button key={p.id} type="button" aria-pressed={plan === p.id} onClick={() => setPlan(p.id)} className={cn('relative rounded-xl border p-5 text-left transition-[border-color,box-shadow]', plan === p.id ? 'border-brand-600 shadow-[0_0_0_3px_var(--color-brand-100)]' : 'border-line-strong hover:border-brand-300')}>
                    {p.id === 'PRO' && <Badge tone="brand" className="absolute top-4 right-4">Recommandé</Badge>}
                    <p className="text-[17px] font-bold">{p.name}</p>
                    <p className="mt-2 font-mono text-[24px]">{money(planPrice(p.id, periodicity))}</p>
                    <p className="text-[12.5px] text-muted">{periodicity === 'ANNUEL' ? 'par an' : 'par mois'} · HT</p>
                    <ul className="mt-4 flex flex-col gap-2 text-[13.5px]">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-brand-600" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-center text-[13px] text-muted">Sans engagement, résiliable à tout moment.</p>
            </div>
          )}
          {step === 3 && <PaymentForm amount={price} recurringLabel={`Puis ${money(price)} ${periodicity === 'ANNUEL' ? 'chaque année' : 'chaque mois'}, prélevés automatiquement.`} submitLabel="Payer et créer mon espace" onPaid={finish} />}

          {step < 3 && (
            <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
                Retour
              </Button>
              <Button onClick={next}>
                Continuer <ArrowRight />
              </Button>
            </div>
          )}
          {step === 3 && (
            <Button variant="ghost" className="mt-4" onClick={() => setStep(2)}>
              Retour
            </Button>
          )}
        </div>
        <aside className="self-start rounded-xl border border-line bg-canvas p-5 lg:sticky lg:top-8">
          <p className="text-[13px] font-bold">Récapitulatif</p>
          <div className="mt-2">
            <DottedLeader label="Organisation" value={org.raisonSociale || '—'} />
            <DottedLeader label="Formule" value={plans.find((p) => p.id === plan)?.name} />
            <DottedLeader label="Périodicité" value={periodicity === 'ANNUEL' ? 'Annuelle' : 'Mensuelle'} />
            <DottedLeader label="Montant" value={<span className="font-mono">{money(price)}</span>} strong />
          </div>
          <p className="mt-3 text-[12px] text-muted">Première échéance aujourd'hui, puis renouvellement automatique.</p>
        </aside>
      </div>
    </div>
  )
}

export function SignupWelcome() {
  const navigate = useNavigate()
  return (
    <div className="ledger-lines-light grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="w-full max-w-xl animate-rise rounded-2xl border border-line bg-surface p-8 text-center shadow-pop">
        <StandSetLogo className="justify-center" />
        <div className="mx-auto mt-8 w-fit">
          <CoverageRing value={0} size="lg" sublabel="couverture" />
        </div>
        <h1 className="mt-6 text-[26px] font-bold">Votre dossier est prêt</h1>
        <p className="mt-2 text-muted">Paiement confirmé. Voici comment démarrer votre transition :</p>
        <ol className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          {[
            { icon: <Target />, t: "Évaluer les clauses de la norme (analyse d'écart)" },
            { icon: <Users />, t: 'Affecter les tâches du plan en 6 phases' },
            { icon: <FileText />, t: 'Mettre à jour vos documents qualité' },
          ].map((s, i) => (
            <li key={s.t} className="rounded-lg border border-line p-3 text-[13px]">
              <span className="flex items-center gap-2 font-mono text-[12px] text-brand-700 [&_svg]:size-4">
                {s.icon} Étape {i + 1}
              </span>
              <span className="mt-1 block text-ink">{s.t}</span>
            </li>
          ))}
        </ol>
        <Button size="lg" className="mt-8" onClick={() => navigate('/espace/dossier/analyse-ecart')}>
          Commencer mon analyse d'écart <ArrowRight />
        </Button>
      </div>
    </div>
  )
}
