import * as Accordion from '@radix-ui/react-accordion'
import { BookOpen, CheckCircle2, ChevronDown, FileText, GraduationCap, ListChecks, Mail, MessageSquare, Target } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { relative } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge, Card, CardHeader } from '@/components/ui/display'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { FileDropzone } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { matches, SearchInput } from '@/components/common/SearchInput'

const ARTICLES = [
  { module: "Analyse d'écart", icon: <Target />, title: 'Comment noter une clause de 0 à 4 ?', body: "Le score mesure le niveau de maîtrise de l'exigence : 0 rien n'existe, 2 des dispositions partielles, 4 l'exigence est satisfaite et prouvée. Notez sur preuves, pas sur intention." },
  { module: "Analyse d'écart", icon: <Target />, title: 'Quand déclarer une clause « non applicable » ?', body: "Uniquement si l'exigence ne peut pas s'appliquer à votre périmètre (par exemple 8.3 conception pour une activité sans conception). Justifiez-le dans le domaine d'application." },
  { module: 'Plan de transition', icon: <ListChecks />, title: 'Modifier une tâche du socle', body: 'Le titre et la description viennent du socle et sont verrouillés. Vous pouvez changer le statut, le responsable et l’échéance, ou ajouter vos propres tâches.' },
  { module: 'Documents', icon: <FileText />, title: 'Quels documents sont exigés par la version 2026 ?', body: 'Les documents marqués « exigé » dans le registre correspondent aux informations documentées demandées par la norme. Les nouveautés portent sur le contexte (climat) et les opportunités.' },
  { module: 'Formations', icon: <GraduationCap />, title: 'Former les auditeurs internes', body: 'Le parcours 3 couvre les principes ISO 19011 et les exigences 2026. Enregistrez chaque session pour suivre les modules validés par participant.' },
  { module: 'Rapport', icon: <BookOpen />, title: 'Partager le rapport avec la direction', body: 'Depuis « Rapport », choisissez les sections, la date d’arrêté et le destinataire, puis téléchargez le PDF.' },
]

const FAQ = [
  ['Mes données sont-elles visibles par StandSet ?', 'Non. Le concessionnaire ne voit que des indicateurs agrégés (avancement global). Vos analyses et documents restent dans votre espace.'],
  ['Que se passe-t-il quand le socle est mis à jour ?', 'Vous êtes notifié(e). Vos évaluations sont conservées ; seules les nouvelles clauses ou tâches sont ajoutées.'],
  ['Puis-je changer de formule à tout moment ?', 'Oui, depuis « Abonnement ». Le changement est calculé au prorata.'],
  ['Comment exporter mes données ?', 'Depuis votre profil, rubrique « Mes données ». L’export reste disponible 90 jours après une résiliation.'],
]

const FIRST_STEPS = ['Compléter la fiche de votre organisation', "Évaluer les clauses du chapitre 4", "Terminer l'analyse d'écart", 'Affecter les tâches du plan', 'Générer un premier rapport']

export function SupportPage() {
  const [query, setQuery] = useState('')
  const [tickets, setTickets] = useState([{ id: 'SUP-1042', subject: 'Import de notre ancien manuel qualité', status: 'Résolu', at: new Date(Date.now() - 12 * 86_400_000).toISOString() }])
  const [form, setForm] = useState({ subject: '', module: "Analyse d'écart", message: '' })
  const [files, setFiles] = useState<File[]>([])
  const results = ARTICLES.filter((a) => matches(query, a.title, a.body, a.module))

  return (
    <>
      <PageHeader title="Aide & support" subtitle="Guides, questions fréquentes et contact avec l'équipe StandSet." />
      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher dans l'aide : clause, rapport, formation…" className="mb-6 max-w-xl" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Articles" description={`${results.length} article${results.length > 1 ? 's' : ''}`} />
            <Accordion.Root type="single" collapsible className="divide-y divide-line border-t border-line">
              {results.map((a) => (
                <Accordion.Item key={a.title} value={a.title}>
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-canvas [&>svg:first-child]:size-4 [&>svg:first-child]:text-accent">
                      {a.icon}
                      <span className="flex-1 text-[14px] font-semibold text-ink">{a.title}</span>
                      <Badge>{a.module}</Badge>
                      <ChevronDown className="size-4 text-muted transition-transform group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="px-5 pb-4 pl-12 text-[13.5px] leading-relaxed text-ink-soft">{a.body}</Accordion.Content>
                </Accordion.Item>
              ))}
              {!results.length && <p className="px-5 py-8 text-center text-[13.5px] text-muted">Aucun article. Écrivez-nous via le formulaire.</p>}
            </Accordion.Root>
          </Card>
          <Card>
            <CardHeader title="Questions fréquentes" />
            <Accordion.Root type="multiple" className="divide-y divide-line border-t border-line">
              {FAQ.map(([q, a]) => (
                <Accordion.Item key={q} value={q}>
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-[14px] font-semibold hover:bg-canvas">
                      {q}
                      <ChevronDown className="size-4 text-muted transition-transform group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="px-5 pb-4 text-[13.5px] text-ink-soft">{a}</Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </Card>
        </div>
        <aside className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="font-bold">Premiers pas</h2>
            <ol className="mt-3 flex flex-col gap-2">
              {FIRST_STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-[13.5px]">
                  <span className="grid size-6 place-items-center rounded-full bg-accent-soft font-mono text-[11.5px] text-accent">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <MessageSquare className="size-4 text-accent" /> Nous contacter
            </h2>
            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                const id = `SUP-${1043 + tickets.length}`
                setTickets([{ id, subject: form.subject, status: 'Ouvert', at: new Date().toISOString() }, ...tickets])
                setForm({ ...form, subject: '', message: '' })
                setFiles([])
                toast.success(`Demande ${id} envoyée — réponse sous 24 h ouvrées`)
              }}
            >
              <Field label="Sujet">{(p) => <Input {...p} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />}</Field>
              <Field label="Module concerné">
                {(p) => (
                  <Select {...p} value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
                    {["Analyse d'écart", 'Plan de transition', 'Documents', 'Formations', 'Rapport', 'Abonnement', 'Autre'].map((m) => <option key={m}>{m}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Message">{(p) => <Textarea {...p} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />}</Field>
              <FileDropzone compact onFiles={setFiles} files={files} onRemove={() => setFiles([])} label="Joindre une capture" />
              <Button type="submit" disabled={!form.subject || !form.message}>
                <Mail /> Envoyer
              </Button>
            </form>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Mes demandes</h2>
            <ul className="flex flex-col gap-2">
              {tickets.map((t) => (
                <li key={t.id} className="flex items-center gap-3 text-[13px]">
                  {t.status === 'Résolu' ? <CheckCircle2 className="size-4 text-success" /> : <span className="size-2.5 rounded-full bg-brand-500" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{t.subject}</span>
                    <span className="text-[12px] text-muted">
                      {t.id} · {relative(t.at)}
                    </span>
                  </span>
                  <Badge tone={t.status === 'Résolu' ? 'success' : 'brand'}>{t.status}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  )
}
