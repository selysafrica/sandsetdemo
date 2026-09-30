import { Copy, Download, Laptop, LogOut, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ROLE_META } from '@/lib/labels'
import { downloadText } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { useUi } from '@/stores/ui.store'
import { Button } from '@/components/ui/button'
import { CheckRow, Segmented, Stepper } from '@/components/ui/controls'
import { Avatar, Badge, Card } from '@/components/ui/display'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/form'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionTitle } from '@/components/common/registre'
import { isStrongPassword, PasswordStrength } from '@/features/auth/pages/PasswordPages'

const CODES = Array.from({ length: 10 }, (_, i) => `${(4817 + i * 7321).toString(36).toUpperCase().padStart(4, '0').slice(-4)}-${(9123 + i * 3571).toString(36).toUpperCase().padStart(4, '0').slice(-4)}`)

function QrMock() {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21
    const y = Math.floor(i / 21)
    const finder = (a: number, b: number) => x >= a && x < a + 7 && y >= b && y < b + 7 && (x === a || x === a + 6 || y === b || y === b + 6 || (x >= a + 2 && x <= a + 4 && y >= b + 2 && y <= b + 4))
    if (finder(0, 0) || finder(14, 0) || finder(0, 14)) return true
    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) return false
    return ((x * 7 + y * 13 + x * y) % 5) < 2
  })
  return (
    <svg viewBox="0 0 21 21" className="size-40 rounded-md border border-line bg-white p-2" role="img" aria-label="QR code d'activation (démo)">
      {cells.map((on, i) => (on ? <rect key={i} x={i % 21} y={Math.floor(i / 21)} width="1" height="1" fill="#0f172a" /> : null))}
    </svg>
  )
}

/** D-25 */
function TwoFactorDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [kept, setKept] = useState(false)
  useEffect(() => {
    if (open) {
      setStep(0)
      setCode('')
      setKept(false)
    }
  }, [open])
  const verify = async () => {
    try {
      await authService.setTwoFactor(true, code)
      setStep(2)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Activer la double authentification"
        footer={
          step === 0 ? (
            <Button onClick={() => setStep(1)}>Commencer</Button>
          ) : step === 1 ? (
            <Button disabled={code.length !== 6} onClick={verify}>Vérifier le code</Button>
          ) : (
            <Button
              disabled={!kept}
              onClick={() => {
                onDone()
                onOpenChange(false)
                toast.success('Double authentification activée')
              }}
            >
              Terminer
            </Button>
          )
        }
      >
        <Stepper steps={['Application', 'Code', 'Secours']} current={step} className="mb-6" />
        {step === 0 && (
          <div className="flex flex-col gap-3 text-[14px] text-ink-soft">
            <p>À chaque connexion, un code à 6 chiffres vous sera demandé en plus du mot de passe.</p>
            <p>Installez une application d'authentification : Google Authenticator, Microsoft Authenticator, 2FAS ou Authy.</p>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <QrMock />
            <p className="text-[13px] text-muted">Scannez ce code, ou saisissez la clé :</p>
            <p className="flex items-center gap-2 font-mono text-[13px]">
              JBSW Y3DP EHPK 3PXP
              <Button variant="ghost" size="icon-sm" aria-label="Copier la clé" onClick={() => { void navigator.clipboard?.writeText('JBSWY3DPEHPK3PXP'); toast.success('Clé copiée') }}>
                <Copy />
              </Button>
            </p>
            <Field label="Code affiché dans l'application" error={error} hint="Démo : 123456" className="w-56 text-left">
              {(p) => <Input {...p} inputMode="numeric" value={code} onChange={(e) => { setError(''); setCode(e.target.value.replace(/\D/g, '').slice(0, 6)) }} className="text-center font-mono text-[18px] tracking-[0.3em]" />}
            </Field>
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="text-[13.5px] text-ink-soft">Conservez ces codes de secours : chacun permet une connexion si vous perdez votre téléphone.</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-canvas p-4 font-mono text-[13px]">
              {CODES.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard?.writeText(CODES.join('\n')); toast.success('Codes copiés') }}>
                <Copy /> Copier
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadText('codes-secours-standset.txt', CODES.join('\n'), 'text/plain')}>
                <Download /> Télécharger
              </Button>
            </div>
            <div className="mt-4">
              <CheckRow checked={kept} onCheckedChange={setKept} label="J'ai conservé mes codes de secours en lieu sûr" />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ProfilePage() {
  const user = useCurrentUser()
  const bump = useUi((s) => s.bumpRevision)
  const { i18n } = useTranslation()
  const [profile, setProfile] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', title: user?.title ?? '', phone: user?.phone ?? '' })
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [tfaOpen, setTfaOpen] = useState(false)
  if (!user) return null
  const name = `${user.firstName} ${user.lastName}`

  return (
    <>
      <PageHeader title="Profil & sécurité" />
      <div className="grid max-w-5xl gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="flex flex-col items-center self-start p-6 text-center">
          <Avatar name={name} size="lg" color={ROLE_META[user.role].color} />
          <p className="mt-3 text-[16px] font-bold">{name}</p>
          <p className="text-[13px] text-muted">{user.email}</p>
          <Badge tone="brand" className="mt-2">{ROLE_META[user.role].label}</Badge>
        </Card>
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <SectionTitle>Informations personnelles</SectionTitle>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Prénom">{(p) => <Input {...p} value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />}</Field>
              <Field label="Nom">{(p) => <Input {...p} value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />}</Field>
              <Field label="Fonction">{(p) => <Input {...p} value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} />}</Field>
              <Field label="Téléphone">{(p) => <Input {...p} type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />}</Field>
            </div>
            <Button className="mt-4" onClick={() => authService.updateProfile(profile).then(() => { bump(); toast.success('Profil mis à jour') })}>
              Enregistrer
            </Button>
          </Card>
          <Card className="p-6">
            <SectionTitle>Langue</SectionTitle>
            <Segmented
              className="mt-4"
              label="Langue de l'interface"
              value={i18n.language.startsWith('en') ? 'en' : 'fr'}
              onChange={(l) => void i18n.changeLanguage(l)}
              options={[
                { value: 'fr', label: 'Français' },
                { value: 'en', label: 'English (bêta)' },
              ]}
            />
          </Card>
          <Card className="p-6">
            <SectionTitle>Sécurité</SectionTitle>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line px-4 py-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className={user.twoFactorEnabled ? 'size-5 text-success' : 'size-5 text-muted'} />
                <div>
                  <p className="font-semibold">Double authentification</p>
                  <p className="text-[12.5px] text-muted">{user.twoFactorEnabled ? 'Activée — code demandé à chaque connexion.' : 'Recommandée pour protéger les données de vos clients.'}</p>
                </div>
              </div>
              {user.twoFactorEnabled ? (
                <Button variant="outline" onClick={() => authService.setTwoFactor(false).then(() => { bump(); toast.success('Double authentification désactivée') })}>
                  Désactiver
                </Button>
              ) : (
                <Button onClick={() => setTfaOpen(true)}>Activer</Button>
              )}
            </div>
            <form
              className="mt-6 grid gap-4 sm:grid-cols-3"
              onSubmit={async (e) => {
                e.preventDefault()
                try {
                  await authService.changePassword(pwd.current, pwd.next)
                  setPwd({ current: '', next: '', confirm: '' })
                  toast.success('Mot de passe modifié')
                } catch (err) {
                  toast.error((err as Error).message)
                }
              }}
            >
              <Field label="Mot de passe actuel">{(p) => <Input {...p} type="password" autoComplete="current-password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />}</Field>
              <Field label="Nouveau mot de passe">{(p) => <Input {...p} type="password" autoComplete="new-password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />}</Field>
              <Field label="Confirmation" error={pwd.confirm && pwd.confirm !== pwd.next ? 'Ne correspond pas.' : undefined}>{(p) => <Input {...p} type="password" autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />}</Field>
              <div className="sm:col-span-3">
                <PasswordStrength value={pwd.next} />
                <Button type="submit" variant="outline" className="mt-4" disabled={!pwd.current || !isStrongPassword(pwd.next) || pwd.next !== pwd.confirm}>
                  Changer le mot de passe
                </Button>
              </div>
            </form>
            <h3 className="mt-8 mb-2 text-[13.5px] font-bold">Sessions actives</h3>
            <ul className="divide-y divide-line rounded-md border border-line text-[13.5px]">
              <li className="flex items-center gap-3 px-4 py-2.5">
                <Laptop className="size-4 text-muted" /> Navigateur · Abidjan <Badge tone="success" className="ml-auto">Cet appareil</Badge>
              </li>
              <li className="flex items-center gap-3 px-4 py-2.5">
                <Smartphone className="size-4 text-muted" /> Android · Chrome · il y a 2 jours
              </li>
            </ul>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => toast.success('Les autres appareils ont été déconnectés')}>
              <LogOut /> Déconnecter les autres appareils
            </Button>
          </Card>
          <Card className="p-6">
            <SectionTitle>Mes données</SectionTitle>
            <p className="mt-3 text-[13.5px] text-ink-soft">Conformément à la loi ivoirienne sur la protection des données (ARTCI) et au RGPD, vous pouvez obtenir une copie de vos données personnelles.</p>
            <Button variant="outline" className="mt-4" onClick={() => downloadText('mes-donnees-standset.json', JSON.stringify({ ...user, exportedAt: new Date().toISOString() }, null, 2), 'application/json')}>
              <Download /> Exporter mes données
            </Button>
          </Card>
        </div>
      </div>
      <TwoFactorDialog open={tfaOpen} onOpenChange={setTfaOpen} onDone={bump} />
    </>
  )
}
