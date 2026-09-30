import { DatabaseBackup, FileText, Globe, Languages, Mail, RotateCcw, Shield, TriangleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { resetDemo } from '@/mocks/db'
import { qk, useAppMutation, useSettings } from '@/hooks/queries'
import { dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { systemService } from '@/services/system.service'
import { Button } from '@/components/ui/button'
import { Segmented, Switch } from '@/components/ui/controls'
import { Badge, Card, Progress } from '@/components/ui/display'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { StandSetLogo } from '@/components/common/Logo'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/states'

const SECTIONS = [
  { id: 'identite', label: 'Identité', icon: <Globe /> },
  { id: 'courriels', label: 'Courriels', icon: <Mail /> },
  { id: 'securite', label: 'Sécurité', icon: <Shield /> },
  { id: 'sauvegardes', label: 'Sauvegardes', icon: <DatabaseBackup /> },
  { id: 'conformite', label: 'Conformité', icon: <FileText /> },
  { id: 'langue', label: 'Langue', icon: <Languages /> },
  { id: 'danger', label: 'Zone de danger', icon: <TriangleAlert /> },
]

const TEMPLATES = {
  relance1: { label: 'Relance — niveau 1', body: 'Bonjour {{contact}},\n\nNous vous rappelons qu’une échéance de {{montant}} reste à régler depuis le {{echeance}}.\n\nCordialement,\nLe réseau StandSet' },
  relance3: { label: 'Relance — niveau 3', body: 'Bonjour {{contact}},\n\nFaute de règlement de {{montant}} sous 15 jours, l’accès à l’instance {{licencie}} pourra être suspendu.\n\nLe réseau StandSet' },
  habilitation: { label: 'Alerte habilitation', body: 'Bonjour {{contact}},\n\nVotre habilitation « {{habilitation}} » expire le {{date}}. Planifions dès maintenant l’audit de renouvellement.' },
  version: { label: 'Nouvelle version du Kit', body: 'Bonjour,\n\nLa version {{version}} du socle est disponible. Vos dossiers en cours conservent leurs évaluations.\n\n{{changelog}}' },
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-20 p-6">
      <h2 className="text-[16px] font-bold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  )
}

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const { i18n } = useTranslation()
  const [tpl, setTpl] = useState<keyof typeof TEMPLATES>('relance1')
  const [bodies, setBodies] = useState(() => Object.fromEntries(Object.entries(TEMPLATES).map(([k, v]) => [k, v.body])) as Record<keyof typeof TEMPLATES, string>)
  const [restore, setRestore] = useState<'idle' | 'running' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [resetOpen, setResetOpen] = useState(false)
  const save = useAppMutation(systemService.saveSettings, { invalidate: [qk.settings], success: 'Paramètres enregistrés' })

  if (isLoading || !settings) return <PageSkeleton />

  const runRestore = async () => {
    setRestore('running')
    setProgress(0)
    for (const p of [18, 41, 67, 88, 100]) {
      await new Promise((r) => setTimeout(r, 450))
      setProgress(p)
    }
    await systemService.testRestore()
    setRestore('done')
  }
  const preview = bodies[tpl]
    .replace(/{{contact}}/g, 'Aïcha')
    .replace(/{{montant}}/g, '450 000 FCFA')
    .replace(/{{echeance}}/g, '15 septembre 2026')
    .replace(/{{licencie}}/g, 'Qualis Conseil')
    .replace(/{{habilitation}}/g, 'Habilitation réseau StandSet')
    .replace(/{{date}}/g, '12 décembre 2026')
    .replace(/{{version}}/g, '2026.4')
    .replace(/{{changelog}}/g, 'Ajout de la clause 6.3.')

  return (
    <>
      <PageHeader crumbs={[{ label: 'Console', to: '/console' }, { label: 'Paramètres' }]} title="Paramètres de la plateforme" subtitle="Réglages globaux appliqués à tous les tenants." />
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Sections" className="lg:sticky lg:top-20 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={cn('flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-semibold whitespace-nowrap text-ink-soft hover:bg-panel hover:text-ink [&_svg]:size-4', s.id === 'danger' && 'text-danger')}>
                  {s.icon}
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex max-w-3xl flex-col gap-6">
          <Section id="identite" title="Identité de la plateforme" description="Utilisée pour l'espace entreprises et les courriels du concessionnaire.">
            <div className="flex items-center gap-4 rounded-lg bg-canvas p-4">
              <StandSetLogo subtitle="Transition ISO 9001:2026" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nom">{(p) => <Input {...p} defaultValue="StandSet" />}</Field>
              <Field label="Domaine racine">{(p) => <Input {...p} defaultValue="standset.com" className="font-mono" />}</Field>
              <Field label="Courriel expéditeur">{(p) => <Input {...p} defaultValue="reseau@standset.com" />}</Field>
              <Field label="Couleur par défaut">{(p) => <Input {...p} defaultValue="#1a3fc4" className="font-mono" />}</Field>
            </div>
          </Section>

          <Section id="courriels" title="Modèles de courriels" description="Variables disponibles entre doubles accolades.">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Field label="Modèle">
                  {(p) => (
                    <Select {...p} value={tpl} onChange={(e) => setTpl(e.target.value as keyof typeof TEMPLATES)}>
                      {Object.entries(TEMPLATES).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Contenu">{(p) => <Textarea {...p} rows={9} value={bodies[tpl]} onChange={(e) => setBodies({ ...bodies, [tpl]: e.target.value })} className="font-mono text-[12.5px]" />}</Field>
              </div>
              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Aperçu</p>
                <div className="rounded-lg border border-line bg-surface p-4 text-[13px] leading-relaxed whitespace-pre-wrap text-ink">{preview}</div>
              </div>
            </div>
            <Button className="mt-4" variant="outline" onClick={() => save.mutate({})}>
              Enregistrer le modèle
            </Button>
          </Section>

          <Section id="securite" title="Sécurité" description="Politique d'authentification appliquée à toute la plateforme.">
            <div className="flex flex-col divide-y divide-line">
              <label className="flex items-center justify-between gap-4 py-3">
                <span>
                  <span className="block text-[14px] font-semibold">Double authentification obligatoire pour les administrateurs</span>
                  <span className="block text-[12.5px] text-muted">Concessionnaire et administrateurs de tenant.</span>
                </span>
                <Switch checked={settings.enforce2faAdmins} onCheckedChange={(v) => save.mutate({ enforce2faAdmins: v })} />
              </label>
              <div className="grid gap-4 py-3 sm:grid-cols-2">
                <Field label="Durée de session (minutes)">{(p) => <Input {...p} type="number" defaultValue={settings.sessionMinutes} onBlur={(e) => save.mutate({ sessionMinutes: Number(e.target.value) })} className="font-mono" />}</Field>
                <Field label="Verrouillage après échecs">{(p) => <Input {...p} type="number" defaultValue={settings.lockAfterFailures} onBlur={(e) => save.mutate({ lockAfterFailures: Number(e.target.value) })} className="font-mono" />}</Field>
              </div>
              <p className="pt-3 text-[12.5px] text-muted">Mots de passe : 10 caractères minimum, majuscule, chiffre et caractère spécial. Stockés hachés. HTTPS sur toutes les instances.</p>
            </div>
          </Section>

          <Section id="sauvegardes" title="Sauvegardes" description="Sauvegardes quotidiennes automatisées, restauration testée.">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[14px]">
                  Dernière sauvegarde : <strong>{dateTime(settings.lastBackupAt)}</strong> <Badge tone="success">Réussie</Badge>
                </p>
                <p className="text-[12.5px] text-muted">Fréquence quotidienne à 02 h 00 · rétention 30 jours · réplication hors site</p>
              </div>
              <Button variant="outline" onClick={runRestore} loading={restore === 'running'}>
                <RotateCcw /> Tester une restauration
              </Button>
            </div>
            {restore !== 'idle' && (
              <div className="mt-4 rounded-lg bg-canvas p-4" aria-live="polite">
                <Progress value={progress} tone={restore === 'done' ? 'success' : 'brand'} label="Progression de la restauration" />
                <p className="mt-2 text-[13px] text-ink-soft">
                  {restore === 'done' ? 'Restauration de test réussie sur un environnement isolé en 42 s. Intégrité des 21 collections vérifiée.' : progress < 50 ? 'Copie de la sauvegarde vers l’environnement de test…' : 'Vérification de l’intégrité…'}
                </p>
              </div>
            )}
          </Section>

          <Section id="conformite" title="Conformité" description="Protection des données : loi ivoirienne (ARTCI) et RGPD.">
            <ul className="flex flex-col gap-2 text-[13.5px]">
              {['Registre des traitements', 'Mentions légales', 'Politique de confidentialité', 'Durées de conservation (dossiers : 10 ans après clôture)'].map((d) => (
                <li key={d} className="flex items-center justify-between rounded-md border border-line px-4 py-2.5">
                  {d}
                  <Button variant="link" size="sm">
                    Consulter
                  </Button>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="langue" title="Langue de l'interface">
            <Segmented
              label="Langue"
              value={i18n.language.startsWith('en') ? 'en' : 'fr'}
              onChange={(l) => void i18n.changeLanguage(l)}
              options={[
                { value: 'fr', label: 'Français' },
                { value: 'en', label: 'English (bêta)' },
              ]}
            />
            <p className="mt-2 text-[12.5px] text-muted">La navigation, l'authentification et les libellés communs sont traduits ; le reste des écrans est en cours de traduction.</p>
          </Section>

          <Section id="danger" title="Zone de danger">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-danger/30 bg-danger-soft/40 p-4">
              <div>
                <p className="font-semibold text-ink">Réinitialiser la démonstration</p>
                <p className="text-[12.5px] text-muted">Restaure le jeu de données initial et vous déconnecte.</p>
              </div>
              <Button variant="danger" onClick={() => setResetOpen(true)}>
                Réinitialiser
              </Button>
            </div>
          </Section>
        </div>
      </div>
      <ConfirmDialog open={resetOpen} onOpenChange={setResetOpen} title="Réinitialiser la démonstration ?" impact="Toutes les données saisies seront effacées." confirmLabel="Réinitialiser" confirmText="RÉINITIALISER" destructive onConfirm={resetDemo} />
    </>
  )
}
