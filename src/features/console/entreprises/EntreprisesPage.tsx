import { CreditCard, Smartphone, TrendingDown, Users, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnterprises } from '@/hooks/queries'
import { date, moneyShort } from '@/lib/format'
import { planPrice } from '@/services/enterprises.service'
import type { Enterprise } from '@/types/domain'
import { Badge } from '@/components/ui/display'
import { Select } from '@/components/ui/form'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ScoreBar } from '@/components/common/indicators'
import { KpiCard } from '@/components/common/KpiCard'
import { PageHeader } from '@/components/common/PageHeader'
import { RefCode, StatusBadge } from '@/components/common/registre'
import { matches, SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/states'

export function EntreprisesPage() {
  const { data = [], isLoading } = useEnterprises()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [plan, setPlan] = useState('')
  const rows = useMemo(
    () => data.filter((e) => (!status || e.subscriptionStatus === status) && (!plan || e.plan === plan) && matches(query, e.raisonSociale, e.ref, e.ville, e.secteur)),
    [data, query, status, plan],
  )
  const actifs = data.filter((e) => e.subscriptionStatus === 'ACTIF')
  const mrr = actifs.reduce((a, e) => a + (e.periodicity === 'ANNUEL' ? planPrice(e.plan, 'ANNUEL') / 12 : planPrice(e.plan, 'MENSUEL')), 0)

  const columns: Column<Enterprise>[] = [
    { id: 'ref', header: 'Réf.', cell: (e) => <RefCode value={e.ref} />, sortValue: (e) => e.ref, hideOnMobile: true },
    { id: 'nom', header: 'Entreprise', primary: true, sortValue: (e) => e.raisonSociale, cell: (e) => <div><p className="font-semibold text-ink">{e.raisonSociale}</p><p className="text-[12.5px] text-muted">{e.secteur} · {e.effectif} salariés</p></div> },
    { id: 'pays', header: 'Localisation', cell: (e) => `${e.ville}, ${e.pays}`, sortValue: (e) => e.pays },
    { id: 'plan', header: 'Formule', cell: (e) => <span className="inline-flex items-center gap-1.5"><Badge tone={e.plan === 'PRO' ? 'brand' : 'neutral'}>{e.plan === 'PRO' ? 'Pro' : 'Essentiel'}</Badge><span className="text-[12px] text-muted">{e.periodicity === 'ANNUEL' ? 'annuel' : 'mensuel'}</span></span> },
    { id: 'statut', header: 'Abonnement', cell: (e) => <StatusBadge status={e.subscriptionStatus} />, sortValue: (e) => e.subscriptionStatus },
    { id: 'avancement', header: 'Avancement (agrégé)', cell: (e) => <ScoreBar value={e.progress} className="w-32" />, sortValue: (e) => e.progress },
    { id: 'next', header: 'Prochaine facture', cell: (e) => (e.subscriptionStatus === 'RESILIE' ? '—' : date(e.nextBillingAt)), sortValue: (e) => e.nextBillingAt },
    { id: 'pay', header: 'Paiement', hideOnMobile: true, cell: (e) => <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft">{e.paymentMethod.kind === 'CARTE' ? <CreditCard className="size-3.5" /> : <Smartphone className="size-3.5" />}{e.paymentMethod.label.split(' ••')[0]}</span> },
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', to: '/console' }, { label: 'Entreprises' }]}
        title="Entreprises abonnées"
        subtitle="Organisations en self-service : un dossier unique, marque StandSet, facturation automatique."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Abonnés actifs" value={actifs.length} icon={<Users />} hint={`sur ${data.length} inscrits`} loading={isLoading} />
        <KpiCard label="Revenu mensuel récurrent" value={mrr} format={moneyShort} icon={<Wallet />} hint="FCFA / mois" loading={isLoading} />
        <KpiCard label="Impayés" value={data.filter((e) => e.subscriptionStatus === 'IMPAYE').length} icon={<CreditCard />} loading={isLoading} />
        <KpiCard label="Résiliations" value={data.filter((e) => e.subscriptionStatus === 'RESILIE').length} icon={<TrendingDown />} loading={isLoading} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Entreprise, secteur, ville…" className="w-full sm:w-72" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Statut d'abonnement" className="w-48">
          <option value="">Tous les statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="IMPAYE">Impayé</option>
          <option value="RESILIE">Résilié</option>
        </Select>
        <Select value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Formule" className="w-40">
          <option value="">Toutes formules</option>
          <option value="ESSENTIEL">Essentiel</option>
          <option value="PRO">Pro</option>
        </Select>
      </div>
      <DataTable
        caption="Entreprises abonnées"
        columns={columns}
        rows={rows}
        loading={isLoading}
        getRowId={(e) => e.id}
        onRowClick={(e) => navigate(`/console/entreprises/${e.id}`)}
        initialSort={{ id: 'ref' }}
        empty={<EmptyState title="Aucune entreprise ne correspond" description="Modifiez la recherche ou les filtres." />}
      />
    </>
  )
}
