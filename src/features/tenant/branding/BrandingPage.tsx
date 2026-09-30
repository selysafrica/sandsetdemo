import { Globe, Save, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { useTenant } from '@/hooks/useCurrentUser'
import { useAppMutation } from '@/hooks/queries'
import { tenantService } from '@/services/tenant.service'
import { useUi } from '@/stores/ui.store'
import type { Branding } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Badge, Card } from '@/components/ui/display'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionTitle } from '@/components/common/registre'
import { PageSkeleton } from '@/components/common/states'
import { BrandPreview, ColorField, ContactFields, DomainDialog, IdentityFields } from './brand-kit'

export function BrandingPage() {
  const { licencie } = useTenant()
  const bump = useUi((s) => s.bumpRevision)
  const [b, setB] = useState<Branding | null>(licencie?.branding ?? null)
  const [domainOpen, setDomainOpen] = useState(false)
  const save = useAppMutation(() => tenantService.saveBranding(b!), { success: 'Marque enregistrée — appliquée à toute l’instance', onSuccess: bump })
  if (!licencie || !b) return <PageSkeleton />
  const set = (patch: Partial<Branding>) => setB({ ...b, ...patch })
  const dirty = JSON.stringify(b) !== JSON.stringify(licencie.branding)
  const domain = b.customDomain ?? (b.subdomain ? `${b.subdomain}.standset.com` : null)

  return (
    <>
      <PageHeader
        title="Marque & instance"
        subtitle="Vos clients voient votre marque dans l'application, les courriels et les rapports PDF. StandSet reste discret."
        actions={
          <>
            <Button variant="ghost" disabled={!dirty} onClick={() => setB(licencie.branding)}>
              <Undo2 /> Annuler
            </Button>
            <Button disabled={!dirty} loading={save.isPending} onClick={() => save.mutate(undefined)}>
              <Save /> Enregistrer
            </Button>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_460px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <SectionTitle>Identité</SectionTitle>
            <div className="mt-4">
              <IdentityFields b={b} set={set} />
            </div>
          </Card>
          <Card className="p-6">
            <SectionTitle>Couleur d'accent</SectionTitle>
            <div className="mt-4">
              <ColorField b={b} set={set} />
            </div>
          </Card>
          <Card className="p-6">
            <SectionTitle>Coordonnées</SectionTitle>
            <p className="mt-2 mb-4 text-[12.5px] text-muted">Affichées en pied de courriel et de rapport.</p>
            <ContactFields b={b} set={set} />
          </Card>
          <Card className="p-6">
            <SectionTitle>Domaine</SectionTitle>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Globe className="size-5 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[14px] text-ink">{domain ?? 'Aucun domaine configuré'}</p>
                <p className="mt-0.5">
                  <Badge tone={b.domainStatus === 'ACTIF' ? 'success' : b.domainStatus === 'EN_ATTENTE_DNS' ? 'warning' : 'neutral'}>
                    {b.domainStatus === 'ACTIF' ? 'Actif · HTTPS' : b.domainStatus === 'EN_ATTENTE_DNS' ? 'En attente DNS' : 'Non configuré'}
                  </Badge>
                </p>
              </div>
              <Button variant="outline" onClick={() => setDomainOpen(true)}>
                Configurer
              </Button>
            </div>
          </Card>
        </div>
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <Card className="p-5">
            <h2 className="mb-3 text-[14px] font-bold">Aperçu en direct</h2>
            <BrandPreview b={b} />
          </Card>
        </aside>
      </div>
      <DomainDialog open={domainOpen} onOpenChange={setDomainOpen} b={b} set={set} />
    </>
  )
}
