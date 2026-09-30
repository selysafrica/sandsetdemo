import { Info, MailPlus, MoreHorizontal, Plus, ShieldCheck, UserMinus, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { qk, useAppMutation, useDossiers, useTenantUsers } from '@/hooks/queries'
import { useCurrentUser, useTenant } from '@/hooks/useCurrentUser'
import { relative } from '@/lib/format'
import { PROFILE_LABELS } from '@/lib/labels'
import { tenantService } from '@/services/tenant.service'
import type { User, UserProfile } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { Avatar, Badge } from '@/components/ui/display'
import { Dialog, DialogContent, SheetContent } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/overlays'
import { InfoNote } from '@/components/common/banners'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { TenantMark } from '@/components/common/Logo'
import { AvatarStack } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/registre'

type TenantUser = User & { dossiers: { id: string; clientName: string }[] }
interface InviteRow {
  firstName: string
  lastName: string
  email: string
  profile: UserProfile
  dossierIds: string[]
}

/** D-15 */
function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { licencie } = useTenant()
  const { data: dossiers = [] } = useDossiers()
  const blank = (): InviteRow => ({ firstName: '', lastName: '', email: '', profile: 'CONSULTANT', dossierIds: [] })
  const [rows, setRows] = useState<InviteRow[]>([blank()])
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (open) setRows([blank()])
  }, [open])
  const valid = rows.every((r) => r.firstName && r.lastName && /\S+@\S+\.\S+/.test(r.email))
  const invite = useAppMutation(() => tenantService.invite(rows), { invalidate: [qk.tenantUsers, qk.team, qk.dossiers], success: (n) => `${n} invitation${n > 1 ? 's' : ''} envoyée${n > 1 ? 's' : ''}`, onSuccess: () => onOpenChange(false) })
  const set = (i: number, patch: Partial<InviteRow>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="xl"
        title="Inviter des utilisateurs"
        description="Chaque personne reçoit un courriel d'activation aux couleurs de votre cabinet."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button disabled={!valid} loading={invite.isPending} onClick={() => invite.mutate(undefined)}>
              <MailPlus /> Envoyer {rows.length > 1 ? `${rows.length} invitations` : "l'invitation"}
            </Button>
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-4">
            {rows.map((r, i) => (
              <fieldset key={i} className="rounded-lg border border-line p-4">
                <legend className="px-1 text-[12px] font-semibold text-muted">Personne {i + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Prénom">{(p) => <Input {...p} value={r.firstName} onChange={(e) => set(i, { firstName: e.target.value })} />}</Field>
                  <Field label="Nom">{(p) => <Input {...p} value={r.lastName} onChange={(e) => set(i, { lastName: e.target.value })} />}</Field>
                  <Field label="Courriel">{(p) => <Input {...p} type="email" value={r.email} onChange={(e) => set(i, { email: e.target.value })} />}</Field>
                  <Field label="Profil">
                    {(p) => (
                      <Select {...p} value={r.profile} onChange={(e) => set(i, { profile: e.target.value as UserProfile })}>
                        <option value="CONSULTANT">Consultant — ses dossiers uniquement</option>
                        <option value="FORMATEUR">Formateur — ses dossiers uniquement</option>
                        <option value="ADMIN">Administrateur — toute l'instance</option>
                      </Select>
                    )}
                  </Field>
                </div>
                {r.profile !== 'ADMIN' && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Dossiers à affecter</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dossiers.map((d) => {
                        const on = r.dossierIds.includes(d.dossier.id)
                        return (
                          <button key={d.dossier.id} type="button" aria-pressed={on} onClick={() => set(i, { dossierIds: on ? r.dossierIds.filter((x) => x !== d.dossier.id) : [...r.dossierIds, d.dossier.id] })} className={on ? 'rounded-full border border-accent bg-accent-soft px-2.5 py-0.5 text-[12px] font-semibold text-accent' : 'rounded-full border border-line-strong px-2.5 py-0.5 text-[12px] text-ink-soft hover:border-brand-300'}>
                            {d.dossier.clientName}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {rows.length > 1 && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setRows(rows.filter((_, k) => k !== i))}>
                    <X /> Retirer
                  </Button>
                )}
              </fieldset>
            ))}
            <Button variant="outline" size="sm" className="self-start" onClick={() => setRows([...rows, blank()])}>
              <Plus /> Ajouter une personne
            </Button>
            <Field label="Message personnalisé" optional>{(p) => <Textarea {...p} rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />}</Field>
          </div>
          {licencie && (
            <div className="self-start overflow-hidden rounded-lg border border-line">
              <div className="flex items-center gap-2 border-b-2 bg-surface px-4 py-3" style={{ borderColor: licencie.branding.accentColor }}>
                <TenantMark branding={licencie.branding} size="sm" />
                <strong className="text-[13px]">{licencie.branding.nomCommercial}</strong>
              </div>
              <div className="bg-surface p-4 text-[13px] leading-relaxed">
                <p>Bonjour {rows[0].firstName || '…'},</p>
                <p className="mt-2">Vous êtes invité(e) à rejoindre l'espace {licencie.branding.nomCommercial} pour accompagner nos clients vers ISO 9001:2026.</p>
                {message && <p className="mt-2 italic text-ink-soft">« {message} »</p>}
                <span className="mt-3 inline-block rounded-md px-3 py-1.5 text-[12px] font-semibold" style={{ background: licencie.branding.accentColor, color: '#fff' }}>
                  Activer mon compte
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function UserSheet({ user, onOpenChange }: { user: TenantUser | null; onOpenChange: (o: boolean) => void }) {
  const { data: dossiers = [] } = useDossiers()
  const [ids, setIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (user) setIds(new Set(user.dossiers.map((d) => d.id)))
  }, [user])
  const save = useAppMutation(() => tenantService.setUserDossiers(user!.id, [...ids]), { invalidate: [qk.tenantUsers, qk.dossiers, qk.team], success: 'Affectations mises à jour', onSuccess: () => onOpenChange(false) })
  if (!user) return null
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <SheetContent
        title={`${user.firstName} ${user.lastName}`}
        description={`${user.profile ? PROFILE_LABELS[user.profile] : ''} · ${user.email}`}
        footer={
          user.profile !== 'ADMIN' && (
            <Button loading={save.isPending} onClick={() => save.mutate(undefined)}>
              Enregistrer les affectations
            </Button>
          )
        }
      >
        {user.profile === 'ADMIN' ? (
          <InfoNote icon={<ShieldCheck />}>Un administrateur voit tous les dossiers de l'instance.</InfoNote>
        ) : (
          <>
            <h3 className="mb-2 text-[13.5px] font-bold">Dossiers affectés</h3>
            <ul className="divide-y divide-line rounded-md border border-line">
              {dossiers.map((d) => (
                <li key={d.dossier.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-[13.5px] hover:bg-canvas">
                    <Checkbox
                      checked={ids.has(d.dossier.id)}
                      onCheckedChange={(v) => {
                        const n = new Set(ids)
                        if (v === true) n.add(d.dossier.id)
                        else n.delete(d.dossier.id)
                        setIds(n)
                      }}
                    />
                    <span className="flex-1">{d.dossier.clientName}</span>
                    <span className="text-[12px] text-muted">{d.dossier.secteur}</span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}
        <h3 className="mt-6 mb-2 text-[13.5px] font-bold">Sécurité</h3>
        <p className="text-[13px] text-ink-soft">
          Double authentification : {user.twoFactorEnabled ? <Badge tone="success">activée</Badge> : <Badge>non activée</Badge>}
        </p>
        <p className="mt-1 text-[13px] text-ink-soft">Dernière connexion : {user.lastLoginAt ? relative(user.lastLoginAt) : 'jamais'}</p>
      </SheetContent>
    </Dialog>
  )
}

export function UsersPage() {
  const { data, isLoading } = useTenantUsers()
  const me = useCurrentUser()
  const [params, setParams] = useSearchParams()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [open, setOpen] = useState<TenantUser | null>(null)
  const [deactivate, setDeactivate] = useState<TenantUser | null>(null)
  const statusMut = useAppMutation(({ id, s }: { id: string; s: 'ACTIF' | 'DESACTIVE' }) => tenantService.setUserStatus(id, s), { invalidate: [qk.tenantUsers, qk.team, qk.dossiers], success: 'Compte mis à jour', onSuccess: () => setDeactivate(null) })
  useEffect(() => {
    if (params.get('inviter')) {
      setInviteOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle="Votre équipe de consultants et de formateurs."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus /> Inviter un utilisateur
          </Button>
        }
      />
      <InfoNote icon={<Info />} className="mb-5">
        Un consultant ou un formateur <strong className="text-ink">ne voit que les dossiers qui lui sont affectés</strong>. Les administrateurs voient toute l'instance.
      </InfoNote>
      <DataTable<TenantUser>
        caption="Utilisateurs de l'instance"
        rows={data}
        loading={isLoading}
        getRowId={(u) => u.id}
        onRowClick={setOpen}
        columns={[
          { id: 'u', header: 'Utilisateur', primary: true, sortValue: (u) => u.lastName, cell: (u) => <div className="flex items-center gap-3"><Avatar name={`${u.firstName} ${u.lastName}`} size="sm" /><div className="min-w-0"><p className="font-semibold text-ink">{u.firstName} {u.lastName}{u.id === me?.id && <span className="ml-1.5 text-[12px] font-normal text-muted">(vous)</span>}</p><p className="truncate text-[12.5px] text-muted">{u.email}</p></div></div> },
          { id: 'p', header: 'Profil', sortValue: (u) => u.profile ?? '', cell: (u) => (u.profile ? PROFILE_LABELS[u.profile] : '') },
          { id: 's', header: 'Statut', cell: (u) => <StatusBadge status={u.status} /> },
          { id: 'd', header: 'Dossiers', cell: (u) => (u.profile === 'ADMIN' ? <span className="text-[12.5px] text-muted">Tous</span> : <span className="inline-flex items-center gap-2"><span className="font-mono">{u.dossiers.length}</span><AvatarStack names={u.dossiers.map((d) => d.clientName)} size="xs" /></span>) },
          { id: '2fa', header: '2FA', cell: (u) => (u.twoFactorEnabled ? <Badge tone="success">Activée</Badge> : <span className="text-[12.5px] text-muted">—</span>) },
          { id: 'last', header: 'Dernière connexion', sortValue: (u) => u.lastLoginAt ?? '', cell: (u) => <span className="text-[12.5px] text-muted">{u.lastLoginAt ? relative(u.lastLoginAt) : 'jamais'}</span> },
          {
            id: 'a',
            header: <span className="sr-only">Actions</span>,
            hideOnMobile: true,
            cell: (u) =>
              u.id === me?.id ? null : (
                <DropdownMenu>
                  <DropdownTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Actions" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownTrigger>
                  <DropdownContent onClick={(e) => e.stopPropagation()}>
                    <DropdownItem onSelect={() => setOpen(u)}>Modifier les affectations</DropdownItem>
                    {u.status === 'INVITE' && (
                      <DropdownItem onSelect={() => tenantService.resendInvite(u.id).then(() => toast.success(`Invitation renvoyée à ${u.email}`))}>
                        <MailPlus /> Renvoyer l'invitation
                      </DropdownItem>
                    )}
                    <DropdownSeparator />
                    {u.status === 'DESACTIVE' ? (
                      <DropdownItem onSelect={() => statusMut.mutate({ id: u.id, s: 'ACTIF' })}>Réactiver</DropdownItem>
                    ) : (
                      <DropdownItem danger onSelect={() => setDeactivate(u)}>
                        <UserMinus /> Désactiver
                      </DropdownItem>
                    )}
                  </DropdownContent>
                </DropdownMenu>
              ),
          },
        ]}
      />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <UserSheet user={open} onOpenChange={(o) => !o && setOpen(null)} />
      <ConfirmDialog
        open={!!deactivate}
        onOpenChange={(o) => !o && setDeactivate(null)}
        title={`Désactiver ${deactivate?.firstName} ${deactivate?.lastName} ?`}
        impact={`La personne ne pourra plus se connecter et sera retirée de ${deactivate?.dossiers.length ?? 0} dossier(s). Son historique est conservé.`}
        confirmLabel="Désactiver le compte"
        destructive
        loading={statusMut.isPending}
        onConfirm={() => deactivate && statusMut.mutate({ id: deactivate.id, s: 'DESACTIVE' })}
      />
    </>
  )
}
