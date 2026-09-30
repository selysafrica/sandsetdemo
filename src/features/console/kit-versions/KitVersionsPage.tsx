import { Archive, FilePlus2, GitCompare, Info, Pencil, Radio } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { qk, useAdoption, useAppMutation, useKitVersions } from '@/hooks/queries'
import { diffSocle } from '@/lib/calculations/diff'
import { dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { kitService } from '@/services/kit.service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/overlays'
import { InfoNote } from '@/components/common/banners'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/registre'
import { PageSkeleton } from '@/components/common/states'
import { CompareSheet } from './dialogs'

export function KitVersionsPage() {
  const { data: versions, isLoading } = useKitVersions()
  const { data: adoption } = useAdoption()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [compare, setCompare] = useState<{ a?: string; b?: string } | null>(null)
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const draftMut = useAppMutation(kitService.createDraft, { invalidate: [qk.kitVersions], onSuccess: (v) => navigate(`/console/kit/${v.id}`) })
  const archive = useAppMutation((id: string) => kitService.archive(id), { invalidate: [qk.kitVersions], success: 'Version archivée', onSuccess: () => setArchiveId(null) })

  useEffect(() => {
    if (params.get('brouillon')) {
      setParams({}, { replace: true })
      draftMut.mutate(undefined)
    }
  }, [params, setParams, draftMut])

  if (isLoading || !versions) return <PageSkeleton />
  const published = versions.filter((v) => v.status === 'PUBLIEE')
  const latest = published[0]
  const draft = versions.find((v) => v.status === 'BROUILLON')
  const total = adoption ? Object.values(adoption.byVersion).reduce((a, b) => a + b, 0) : 0

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', to: '/console' }, { label: 'Kit & versions' }]}
        title="Kit & versions du socle"
        subtitle="Le contenu socle — grille d'écart, phases, documents, formations — est versionné et diffusé à tous les tenants."
        actions={
          draft ? (
            <Button asChild>
              <Link to={`/console/kit/${draft.id}`}>
                <Pencil /> Reprendre le brouillon {draft.number}
              </Link>
            </Button>
          ) : (
            <Button loading={draftMut.isPending} onClick={() => draftMut.mutate(undefined)}>
              <FilePlus2 /> Nouvelle version (brouillon)
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="bg-brand-950 p-6 text-white">
          <p className="text-[12.5px] font-semibold text-brand-300">Version en production</p>
          <p className="mt-1 font-mono text-[44px] leading-none">{latest?.number}</p>
          <p className="mt-3 text-[13px] text-brand-100">
            Publiée le {latest && dateTime(latest.publishedAt!)} par {latest?.publishedBy}
          </p>
          <p className="mt-4 text-[13.5px] leading-relaxed text-brand-50/90">{latest?.changelog}</p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link to={`/console/kit/${latest?.id}`}>Consulter le contenu</Link>
            </Button>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-[15px] font-bold">Adoption dans le réseau</h2>
          <p className="text-[13px] text-muted">
            Répartition des {total.toLocaleString('fr-FR')} dossiers actifs par version (agrégat). {adoption?.tenants} tenants et {adoption?.enterprises} entreprises notifiés.
          </p>
          <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-panel">
            {published.map((v, i) => {
              const n = adoption?.byVersion[v.id] ?? 0
              return (
                <Tooltip key={v.id} content={`${v.number} : ${n} dossiers`}>
                  <div className={cn('h-full transition-[width] duration-700', i === 0 ? 'bg-brand-600' : 'bg-brand-300')} style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
                </Tooltip>
              )
            })}
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {published.map((v, i) => {
              const n = adoption?.byVersion[v.id] ?? 0
              return (
                <li key={v.id} className="flex items-center gap-3 text-[13.5px]">
                  <span className={cn('size-2.5 rounded-full', i === 0 ? 'bg-brand-600' : 'bg-brand-300')} />
                  <span className="font-mono">{v.number}</span>
                  <span className="text-muted">{i === 0 ? 'dernière version' : 'version antérieure'}</span>
                  <span className="ml-auto font-mono tabular">{n.toLocaleString('fr-FR')}</span>
                  <span className="w-12 text-right font-mono text-muted tabular">{total ? Math.round((n / total) * 100) : 0} %</span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <InfoNote icon={<Info />} className="mt-6">
        Publier diffuse le socle à tous les tenants. Les dossiers en cours <strong className="text-ink">conservent leurs évaluations</strong> et sont informés de la nouvelle version ; chaque licencié choisit quand l'adopter.
      </InfoNote>

      <h2 className="mt-8 mb-3 text-[15px] font-bold">Registre des versions</h2>
      <ol className="flex flex-col gap-3">
        {versions.map((v) => {
          const prev = versions.find((x) => x.createdAt < v.createdAt && x.status !== 'BROUILLON')
          const d = prev ? diffSocle(prev.content, v.content) : null
          return (
            <li key={v.id}>
              <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                <span className="w-24 font-mono text-[22px] text-ink">{v.number}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={v.status} />
                    <span className="text-[12.5px] text-muted">{v.publishedAt ? `Publiée le ${dateTime(v.publishedAt)} · ${v.publishedBy}` : `Brouillon créé le ${dateTime(v.createdAt)}`}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 max-w-[80ch] text-[13.5px] text-ink-soft">{v.changelog || 'Notes de version à rédiger.'}</p>
                  {d && (
                    <p className="mt-1.5 flex flex-wrap gap-x-4 font-mono text-[12px] text-muted">
                      <span>clauses {d.clauses.length ? `+${d.clauses.filter((c) => c.kind === 'added').length} ~${d.clauses.filter((c) => c.kind === 'modified').length}` : '='}</span>
                      <span>tâches {d.tasks.length ? `+${d.tasks.filter((c) => c.kind === 'added').length} ~${d.tasks.filter((c) => c.kind === 'modified').length}` : '='}</span>
                      <span>documents {d.documents.length ? `+${d.documents.filter((c) => c.kind === 'added').length}` : '='}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/console/kit/${v.id}`}>{v.status === 'BROUILLON' ? <><Pencil /> Éditer</> : 'Ouvrir'}</Link>
                  </Button>
                  {prev && (
                    <Button variant="ghost" size="sm" onClick={() => setCompare({ a: prev.id, b: v.id })}>
                      <GitCompare /> Comparer
                    </Button>
                  )}
                  {v.status === 'BROUILLON' && (
                    <Button size="sm" onClick={() => navigate(`/console/kit/${v.id}?publier=1`)}>
                      <Radio /> Publier
                    </Button>
                  )}
                  {v.status === 'PUBLIEE' && v.id !== latest?.id && (
                    <Button variant="ghost" size="sm" onClick={() => setArchiveId(v.id)}>
                      <Archive /> Archiver
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ol>

      <CompareSheet open={!!compare} onOpenChange={(o) => !o && setCompare(null)} initialA={compare?.a} initialB={compare?.b} />
      <ConfirmDialog
        open={!!archiveId}
        onOpenChange={(o) => !o && setArchiveId(null)}
        title="Archiver cette version ?"
        impact="Les dossiers qui l'utilisent encore continueront de fonctionner ; ils seront invités à adopter la dernière version."
        confirmLabel="Archiver la version"
        loading={archive.isPending}
        onConfirm={() => archiveId && archive.mutate(archiveId)}
      />
    </>
  )
}
