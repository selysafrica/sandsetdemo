import { Check, CheckCircle2, Copy, FolderOpen, Globe, LayoutDashboard, Loader2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { contrastRatio, readableOn, shade, tint } from '@/lib/utils'
import { tenantService } from '@/services/tenant.service'
import type { Branding } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Segmented, Stepper } from '@/components/ui/controls'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/form'
import { TenantMark } from '@/components/common/Logo'
import { FileDropzone } from '@/components/common/misc'
import { cn } from '@/lib/utils'

export const SWATCHES = ['#1f4fe0', '#0e7490', '#047857', '#15803d', '#b45309', '#9a3412', '#be123c', '#7c3aed', '#334155']

export function IdentityFields({ b, set }: { b: Branding; set: (patch: Partial<Branding>) => void }) {
  const [files, setFiles] = useState<File[]>([])
  return (
    <div className="flex flex-col gap-4">
      <Field label="Logo" hint="PNG ou SVG, fond transparent de préférence. Sans logo, vos initiales sont utilisées.">
        {() => (
          <div className="flex items-center gap-4">
            <TenantMark branding={b} size="lg" />
            <div className="flex-1">
              <FileDropzone
                compact
                accept={{ 'image/*': [] }}
                maxSizeMb={2}
                files={files}
                onRemove={() => {
                  setFiles([])
                  set({ logoUrl: undefined })
                }}
                onFiles={(fs) => {
                  setFiles(fs)
                  if (fs[0]) set({ logoUrl: URL.createObjectURL(fs[0]) })
                }}
              />
            </div>
          </div>
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <Field label="Nom commercial affiché">{(p) => <Input {...p} value={b.nomCommercial} onChange={(e) => set({ nomCommercial: e.target.value })} />}</Field>
        <Field label="Initiales" hint="2 lettres">{(p) => <Input {...p} maxLength={2} value={b.logoText} onChange={(e) => set({ logoText: e.target.value.toUpperCase() })} className="font-mono" />}</Field>
      </div>
    </div>
  )
}

export function ColorField({ b, set }: { b: Branding; set: (patch: Partial<Branding>) => void }) {
  const ratio = contrastRatio(b.accentColor, readableOn(b.accentColor))
  const ok = ratio >= 4.5
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleurs suggérées">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={b.accentColor.toLowerCase() === c}
            aria-label={c}
            onClick={() => set({ accentColor: c })}
            className="grid size-10 place-items-center rounded-full ring-offset-2 transition-transform hover:scale-105 aria-checked:ring-2 aria-checked:ring-ink"
            style={{ background: c }}
          >
            {b.accentColor.toLowerCase() === c && <Check className="size-4" style={{ color: readableOn(c) }} />}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-3">
        <Field label="Couleur personnalisée" className="w-44">
          {(p) => <Input {...p} value={b.accentColor} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && set({ accentColor: e.target.value })} className="font-mono" />}
        </Field>
        <input type="color" value={b.accentColor.length === 7 ? b.accentColor : '#1f4fe0'} onChange={(e) => set({ accentColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded-sm border border-line-strong bg-surface p-1" aria-label="Sélecteur de couleur" />
      </div>
      {b.accentColor.length === 7 && (
        <p className={cn('rounded-md px-3 py-2 text-[13px]', ok ? 'bg-success-soft text-success' : 'bg-warning-soft text-ink')} role="status">
          Lisibilité des boutons : <strong>{ok ? 'excellente' : 'insuffisante'}</strong> (contraste {ratio.toFixed(1)}:1).{' '}
          {ok ? `Le texte des boutons sera ${readableOn(b.accentColor) === '#ffffff' ? 'blanc' : 'foncé'}.` : 'Choisissez une teinte plus foncée pour garantir la lisibilité.'}
        </p>
      )}
    </div>
  )
}

export function ContactFields({ b, set }: { b: Branding; set: (patch: Partial<Branding>) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Courriel de contact">{(p) => <Input {...p} type="email" value={b.email} onChange={(e) => set({ email: e.target.value })} />}</Field>
      <Field label="Téléphone">{(p) => <Input {...p} type="tel" value={b.phone} onChange={(e) => set({ phone: e.target.value })} />}</Field>
      <Field label="Adresse" className="sm:col-span-2">{(p) => <Input {...p} value={b.address} onChange={(e) => set({ address: e.target.value })} />}</Field>
      <Field label="Site web" optional>{(p) => <Input {...p} value={b.website ?? ''} onChange={(e) => set({ website: e.target.value })} />}</Field>
    </div>
  )
}

/** Live preview of the instance: app shell, outgoing e-mail, PDF cover. */
export function BrandPreview({ b, initialTab = 'app' }: { b: Branding; initialTab?: 'app' | 'mail' | 'pdf' }) {
  const [tab, setTab] = useState<'app' | 'mail' | 'pdf'>(initialTab)
  const fg = readableOn(b.accentColor)
  return (
    <div>
      <Segmented
        label="Aperçu"
        size="sm"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'app', label: 'Application' },
          { value: 'mail', label: 'Courriel' },
          { value: 'pdf', label: 'Rapport PDF' },
        ]}
      />
      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-canvas shadow-card" aria-label="Aperçu en direct">
        {tab === 'app' && (
          <div className="flex h-72">
            <div className="flex w-40 flex-col border-r border-line bg-surface">
              <div className="flex items-center gap-2 border-b border-line px-3 py-3">
                <TenantMark branding={b} size="sm" />
                <span className="truncate text-[12px] font-bold">{b.nomCommercial || 'Votre cabinet'}</span>
              </div>
              <ul className="flex flex-col gap-0.5 p-2 text-[11.5px]">
                {[
                  [<LayoutDashboard key="a" className="size-3.5" />, 'Tableau de bord', true],
                  [<FolderOpen key="b" className="size-3.5" />, 'Dossiers', false],
                  [<Users key="c" className="size-3.5" />, 'Utilisateurs', false],
                ].map(([icon, label, active]) => (
                  <li key={String(label)} className="flex items-center gap-2 rounded px-2 py-1.5 font-semibold" style={active ? { background: tint(b.accentColor, 0.9), color: b.accentColor } : { color: 'var(--color-ink-soft)' }}>
                    {icon}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 p-4">
              <p className="text-[13px] font-bold">Tableau de bord</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {['Dossiers actifs', 'Couverture'].map((l, i) => (
                  <div key={l} className="rounded-md border border-line bg-surface p-2">
                    <p className="text-[10px] text-muted">{l}</p>
                    <p className="font-mono text-[15px]">{i ? '64 %' : '9'}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel">
                <div className="h-full w-2/3 rounded-full" style={{ background: b.accentColor }} />
              </div>
              <button type="button" tabIndex={-1} className="mt-4 rounded-md px-3 py-1.5 text-[11.5px] font-semibold" style={{ background: b.accentColor, color: fg }}>
                Nouveau dossier
              </button>
            </div>
          </div>
        )}
        {tab === 'mail' && (
          <div className="h-72 bg-surface p-5 text-[12.5px] leading-relaxed">
            <div className="mb-3 flex items-center gap-2 border-b-2 pb-2" style={{ borderColor: b.accentColor }}>
              <TenantMark branding={b} size="sm" />
              <strong>{b.nomCommercial}</strong>
            </div>
            <p>Bonjour Christian,</p>
            <p className="mt-2">Votre rapport de synthèse de transition ISO 9001:2026 est disponible. La couverture atteint 72 %.</p>
            <button type="button" tabIndex={-1} className="mt-3 rounded-md px-3 py-1.5 text-[11.5px] font-semibold" style={{ background: b.accentColor, color: fg }}>
              Consulter le rapport
            </button>
            <p className="mt-4 text-[11px] text-muted">
              {b.nomCommercial} · {b.email} · {b.phone}
              <br />
              {b.address}
            </p>
          </div>
        )}
        {tab === 'pdf' && (
          <div className="grid h-72 place-items-center bg-panel p-4">
            <div className="flex aspect-[210/297] h-full flex-col bg-white p-4 shadow-card">
              <div className="flex items-center gap-1.5">
                <TenantMark branding={b} size="sm" />
                <span className="text-[8px] font-bold">{b.nomCommercial}</span>
              </div>
              <div className="mt-auto mb-auto">
                <p className="text-[6px] font-semibold" style={{ color: b.accentColor }}>
                  Rapport de synthèse
                </p>
                <p className="text-[11px] leading-tight font-bold">Transition ISO 9001:2026</p>
                <p className="text-[8px] text-muted">Ivoire Agro SA</p>
                <div className="mt-1.5 h-0.5 w-8 rounded-full" style={{ background: b.accentColor }} />
              </div>
              <p className="border-t border-line pt-1 text-[5px] text-muted">
                {b.nomCommercial} · {b.email}
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-[12px] text-muted">
        Teinte de survol : <span className="font-mono">{shade(b.accentColor, 0.14)}</span>
      </p>
    </div>
  )
}

/** D-24 — subdomain or custom domain with DNS instructions and verification. */
export function DomainDialog({ open, onOpenChange, b, set }: { open: boolean; onOpenChange: (o: boolean) => void; b: Branding; set: (patch: Partial<Branding>) => void }) {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'sub' | 'custom'>(b.customDomain ? 'custom' : 'sub')
  const [sub, setSub] = useState(b.subdomain ?? '')
  const [custom, setCustom] = useState(b.customDomain ?? '')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [verify, setVerify] = useState<'idle' | 'pending' | 'propagation' | 'ok'>('idle')
  useEffect(() => {
    if (open) {
      setStep(0)
      setVerify('idle')
    }
  }, [open])
  useEffect(() => {
    if (mode !== 'sub' || !sub) return setAvailable(null)
    setChecking(true)
    const id = window.setTimeout(async () => {
      setAvailable(await tenantService.checkSubdomain(sub))
      setChecking(false)
    }, 350)
    return () => window.clearTimeout(id)
  }, [sub, mode])
  const host = mode === 'sub' ? `${sub}.standset.com` : custom
  const records = mode === 'sub' ? [['CNAME', host, 'tenants.standset.com']] : [['CNAME', custom, 'tenants.standset.com'], ['TXT', `_standset.${custom.split('.').slice(-2).join('.')}`, `standset-verify=${(b.nomCommercial || 'x').toLowerCase().replace(/\W/g, '').slice(0, 8)}-7f3a`]]
  const runVerify = async () => {
    setVerify('pending')
    await new Promise((r) => setTimeout(r, 700))
    setVerify('propagation')
    await tenantService.verifyDomain()
    setVerify('ok')
    set(mode === 'sub' ? { subdomain: sub, customDomain: undefined, domainStatus: 'ACTIF' } : { customDomain: custom, domainStatus: 'ACTIF' })
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title="Configurer le domaine de l'instance"
        footer={
          <>
            {step > 0 && verify !== 'ok' && (
              <Button variant="ghost" className="mr-auto" onClick={() => setStep(step - 1)}>Retour</Button>
            )}
            {step < 2 ? (
              <Button disabled={mode === 'sub' ? !available : !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(custom)} onClick={() => setStep(step + 1)}>Continuer</Button>
            ) : verify === 'ok' ? (
              <Button onClick={() => onOpenChange(false)}>Terminer</Button>
            ) : (
              <Button loading={verify === 'pending' || verify === 'propagation'} onClick={runVerify}>Vérifier</Button>
            )}
          </>
        }
      >
        <Stepper steps={['Domaine', 'DNS', 'Vérification']} current={step} className="mb-6" />
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Segmented
              label="Type de domaine"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'sub', label: 'Sous-domaine StandSet' },
                { value: 'custom', label: 'Domaine propre' },
              ]}
            />
            {mode === 'sub' ? (
              <Field label="Sous-domaine" error={available === false ? 'Indisponible ou invalide (3 à 30 caractères, lettres, chiffres et tirets).' : undefined}>
                {(p) => (
                  <div className="flex items-center gap-2">
                    <Input {...p} value={sub} onChange={(e) => setSub(e.target.value.toLowerCase())} className="font-mono" />
                    <span className="font-mono text-[13px] text-muted">.standset.com</span>
                    {checking ? <Loader2 className="size-4 animate-spin text-muted" /> : available ? <CheckCircle2 className="size-4 text-success" aria-label="Disponible" /> : null}
                  </div>
                )}
              </Field>
            ) : (
              <Field label="Domaine" hint="Ex. qualite.moncabinet.ci — vous devez pouvoir modifier sa zone DNS.">
                {(p) => <Input {...p} value={custom} onChange={(e) => setCustom(e.target.value.toLowerCase())} className="font-mono" placeholder="qualite.moncabinet.ci" />}
              </Field>
            )}
          </div>
        )}
        {step === 1 && (
          <div>
            <p className="mb-3 text-[13.5px] text-ink-soft">Ajoutez {records.length > 1 ? 'ces enregistrements' : 'cet enregistrement'} dans la zone DNS {mode === 'sub' ? '(effectué automatiquement pour un sous-domaine StandSet)' : 'de votre hébergeur'} :</p>
            <table className="w-full overflow-hidden rounded-md border border-line text-[13px]">
              <thead className="bg-canvas text-left text-[12px] text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Nom</th>
                  <th className="px-3 py-2 font-semibold">Valeur</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {records.map(([type, name, value]) => (
                  <tr key={type + name} className="border-t border-line">
                    <td className="px-3 py-2 font-mono">{type}</td>
                    <td className="px-3 py-2 font-mono">{name}</td>
                    <td className="px-3 py-2 font-mono break-all">{value}</td>
                    <td className="px-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Copier la valeur"
                        onClick={() => {
                          void navigator.clipboard?.writeText(value)
                          toast.success('Valeur copiée')
                        }}
                      >
                        <Copy />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[12.5px] text-muted">La propagation DNS peut prendre jusqu'à 24 h. Le certificat HTTPS est émis automatiquement.</p>
          </div>
        )}
        {step === 2 && (
          <ol className="flex flex-col gap-3">
            {[
              ['pending', 'Enregistrements DNS détectés'],
              ['propagation', 'Propagation vérifiée'],
              ['ok', 'Certificat HTTPS émis'],
            ].map(([k, label], i) => {
              const order = ['idle', 'pending', 'propagation', 'ok']
              const done = order.indexOf(verify) > i || verify === 'ok'
              const active = order.indexOf(verify) === i + 1 && verify !== 'ok'
              return (
                <li key={k} className="flex items-center gap-3 rounded-md border border-line px-4 py-3 text-[13.5px]">
                  {done ? <CheckCircle2 className="size-5 text-success" /> : active ? <Loader2 className="size-5 animate-spin text-brand-600" /> : <span className="size-5 rounded-full border-2 border-line-strong" />}
                  {label}
                </li>
              )
            })}
            {verify === 'ok' && (
              <p className="flex items-center gap-2 rounded-md bg-success-soft px-4 py-3 text-[13.5px] text-success">
                <Globe className="size-4" /> Votre instance est accessible sur <strong className="font-mono">https://{host}</strong>
              </p>
            )}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  )
}
