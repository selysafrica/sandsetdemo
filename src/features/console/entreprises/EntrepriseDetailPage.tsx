import { Ban, Download, EyeOff, Gift, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { qk, useAppMutation, useEnterprise } from '@/hooks/queries'
import { date } from '@/lib/format'
import { enterprisesService, planPrice } from '@/services/enterprises.service'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/display'
import { InfoNote } from '@/components/common/banners'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CoverageRing } from '@/components/common/indicators'
import { PageHeader } from '@/components/common/PageHeader'
import { DottedLeader, Money, RefCode, SectionTitle, StatusBadge } from '@/components/common/registre'
import { ErrorState, PageSkeleton } from '@/components/common/states'

export function EntrepriseDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, error, refetch } = useEnterprise(id)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const suspend = useAppMutation(() => enterprisesService.setStatus(id, data?.enterprise.subscriptionStatus === 'RESILIE' ? 'ACTIF' : 'RESILIE'), {
    invalidate: [qk.enterprises, qk.enterprise(id)],
    success: 'Accès mis à jour',
    onSuccess: () => setSuspendOpen(false),
  })
  if (isLoading) return <PageSkeleton />
  if (error || !data) return <ErrorState error={error} onRetry={() => refetch()} />
  const e = data.enterprise
  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Console', to: '/console' },
          { label: 'Entreprises', to: '/console/entreprises' },
          { label: e.raisonSociale },
        ]}
        title={e.raisonSociale}
        meta={
          <>
            <RefCode value={e.ref} />
            <StatusBadge status={e.subscriptionStatus} />
            <span className="text-[13px] text-muted">Inscrite le {date(e.subscribedAt)}</span>
          </>
        }
        actions={
          <>
            {e.subscriptionStatus === 'IMPAYE' && (
              <Button variant="outline" onClick={() => toast.success('Relance de paiement envoyée')}>
                <RefreshCw /> Relancer l'impayé
              </Button>
            )}
            <Button variant="outline" onClick={() => toast.success('Un mois offert a été crédité sur la prochaine facture')}>
              <Gift /> Offrir un mois
            </Button>
            <Button variant={e.subscriptionStatus === 'RESILIE' ? 'primary' : 'danger-outline'} onClick={() => setSuspendOpen(true)}>
              <Ban /> {e.subscriptionStatus === 'RESILIE' ? 'Réactiver l’accès' : 'Suspendre l’accès'}
            </Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_0.8fr]">
        <Card className="p-5">
          <SectionTitle>Organisation</SectionTitle>
          <div className="mt-2">
            <DottedLeader label="Secteur" value={e.secteur} />
            <DottedLeader label="Effectif" value={`${e.effectif} salariés`} />
            <DottedLeader label="Localisation" value={`${e.ville}, ${e.pays}`} />
            <DottedLeader label="Certificat 2015 expire" value={date(e.certificateExpiry)} />
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle>Abonnement</SectionTitle>
          <div className="mt-2">
            <DottedLeader label="Formule" value={`${e.plan === 'PRO' ? 'Pro' : 'Essentiel'} · ${e.periodicity === 'ANNUEL' ? 'annuel' : 'mensuel'}`} />
            <DottedLeader label="Montant" value={<Money value={planPrice(e.plan, e.periodicity)} />} />
            <DottedLeader label="Prochaine facturation" value={date(e.nextBillingAt)} />
            <DottedLeader label="Moyen de paiement" value={e.paymentMethod.label} />
          </div>
        </Card>
        <Card className="flex flex-col items-center p-5 text-center">
          <CoverageRing value={e.progress} size="lg" toned={false} label="Avancement global" sublabel="avancement" />
          <p className="mt-3 text-[13px] text-muted">Indicateur agrégé uniquement</p>
        </Card>
      </div>
      <InfoNote icon={<EyeOff />} className="mt-6">
        Le détail du dossier (analyse d'écart, documents, formations) appartient à l'entreprise et n'est pas consultable depuis la Console.
      </InfoNote>
      <Card className="mt-6">
        <CardHeader title="Historique de facturation" />
        <ul className="divide-y divide-line border-t border-line">
          {data.invoices.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px]">
              <span className="font-mono text-[12.5px]">{inv.number}</span>
              <span className="text-muted">{date(inv.date)}</span>
              <StatusBadge status={inv.status === 'EN_ATTENTE' ? 'EN_ATTENTE_PAIEMENT' : inv.status} />
              <Money value={inv.amount} className="ml-auto" />
              <Button variant="ghost" size="icon-sm" aria-label={`Télécharger ${inv.number}`} onClick={() => toast.info('Facture PDF générée (démo)')}>
                <Download />
              </Button>
            </li>
          ))}
          {!data.invoices.length && <li className="px-5 py-6 text-center text-[13px] text-muted">Aucune facture dans le jeu de démonstration pour cette entreprise.</li>}
        </ul>
      </Card>
      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={e.subscriptionStatus === 'RESILIE' ? 'Réactiver l’accès ?' : 'Suspendre l’accès de cette entreprise ?'}
        impact={e.subscriptionStatus === 'RESILIE' ? 'L’entreprise retrouvera son dossier et ses données.' : 'L’utilisateur ne pourra plus se connecter. Le dossier est conservé et exportable.'}
        confirmLabel={e.subscriptionStatus === 'RESILIE' ? 'Réactiver' : 'Suspendre l’accès'}
        destructive={e.subscriptionStatus !== 'RESILIE'}
        loading={suspend.isPending}
        onConfirm={() => suspend.mutate(undefined)}
      />
    </>
  )
}
