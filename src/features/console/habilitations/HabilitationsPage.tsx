import { addMonths, differenceInCalendarDays, parseISO, startOfMonth } from 'date-fns'
import { AlertTriangle, CalendarRange, ClipboardPlus, List, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useHabilitations, useLicencies } from '@/hooks/queries'
import { alertDate, habilitationAlert } from '@/lib/calculations/alerts'
import { date, monthLabel } from '@/lib/format'
import { STATUS_META } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { Habilitation, LicenceStatus } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/controls'
import { Card } from '@/components/ui/display'
import { Tooltip } from '@/components/ui/overlays'
import { DataTable } from '@/components/common/DataTable'
import { TenantMark } from '@/components/common/Logo'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/registre'
import { PageSkeleton } from '@/components/common/states'
import { StatusDialog } from '../licencies/dialogs'
import { AuditSheet, HabilitationDialog } from './dialogs'

const AUDIT_COLOR = { CONFORME: 'var(--color-success)', ECART_MINEUR: 'oklch(0.72 0.15 70)', ECART_MAJEUR: 'var(--color-danger)' }

export function HabilitationsPage() {
  const { data, isLoading } = useHabilitations()
  const { data: licencies = [] } = useLicencies()
  const [view, setView] = useState<'frise' | 'liste'>('frise')
  const [habOpen, setHabOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [suspendFor, setSuspendFor] = useState<string | null>(null)

  const start = useMemo(() => startOfMonth(addMonths(new Date(), -18)), [])
  const end = useMemo(() => addMonths(start, 36), [start])
  const span = differenceInCalendarDays(end, start)
  const pos = (d: Date | string) => Math.max(0, Math.min(100, (differenceInCalendarDays(typeof d === 'string' ? parseISO(d) : d, start) / span) * 100))

  if (isLoading || !data) return <PageSkeleton />
  const alerts = data.habilitations.filter((h) => habilitationAlert(h) !== 'OK')
  const major = data.audits.filter((a) => a.resultat === 'ECART_MAJEUR')
  const byLic = licencies.filter((l) => data.habilitations.some((h) => h.licencieId === l.id))
  const suspendTarget = licencies.find((l) => l.id === suspendFor)

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', to: '/console' }, { label: 'Habilitations & audits' }]}
        title="Habilitations & audits"
        subtitle="Validité des habilitations du réseau, alertes à 12 mois de l'échéance et résultats d'audit."
        actions={
          <>
            <Button variant="outline" onClick={() => setAuditOpen(true)}>
              <ClipboardPlus /> Consigner un audit
            </Button>
            <Button onClick={() => setHabOpen(true)}>
              <Plus /> Ajouter une habilitation
            </Button>
          </>
        }
      />

      {(alerts.length > 0 || major.length > 0) && (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {alerts.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-[13.5px]">
              <CalendarRange className="size-5 shrink-0 text-warning" />
              <span>
                <strong>{alerts.length} habilitations</strong> arrivent à échéance dans moins de 12 mois.
              </span>
            </div>
          )}
          {major.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3 text-[13.5px]">
              <AlertTriangle className="size-5 shrink-0 text-danger" />
              <span className="min-w-0 flex-1">
                <strong>Écart majeur</strong> — {licencies.find((l) => l.id === a.licencieId)?.raisonSociale}, audit du {date(a.date)}
              </span>
              {licencies.find((l) => l.id === a.licencieId)?.status !== 'SUSPENDU' && (
                <Button size="sm" variant="danger" onClick={() => setSuspendFor(a.licencieId)}>
                  Proposer une suspension
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-[12px] text-ink-soft">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-brand-500" /> Validité</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-warning-soft ring-1 ring-warning/40" /> 12 derniers mois (alerte)</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rotate-45 rounded-[2px] bg-success" /> Audit conforme</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rotate-45 rounded-[2px] bg-danger" /> Écart majeur</span>
        </div>
        <Segmented
          label="Vue"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'frise', label: 'Frise', icon: <CalendarRange /> },
            { value: 'liste', label: 'Liste', icon: <List /> },
          ]}
        />
      </div>

      {view === 'frise' ? (
        <Card className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="relative ml-60 h-9 border-b border-line">
              {Array.from({ length: 13 }, (_, i) => addMonths(start, i * 3)).map((m) => (
                <span key={m.toISOString()} className="absolute top-2.5 -translate-x-1/2 text-[11.5px] text-muted" style={{ left: `${pos(m)}%` }}>
                  {monthLabel(m)}
                </span>
              ))}
            </div>
            <ul>
              {byLic.map((l) => {
                const habs = data.habilitations.filter((h) => h.licencieId === l.id)
                const audits = data.audits.filter((a) => a.licencieId === l.id)
                return (
                  <li key={l.id} className="flex border-b border-line last:border-0">
                    <Link to={`/console/licencies/${l.id}?onglet=habilitations`} className="flex w-60 shrink-0 items-center gap-2.5 px-4 py-3 hover:bg-canvas">
                      <TenantMark branding={l.branding} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-ink">{l.raisonSociale}</span>
                        <span className="block text-[11.5px] text-muted">{STATUS_META[l.status as LicenceStatus].label}</span>
                      </span>
                    </Link>
                    <div className="relative flex-1 py-2">
                      <span className="absolute top-0 bottom-0 z-[1] w-px bg-brand-700" style={{ left: `${pos(new Date())}%` }} aria-hidden />
                      {habs.map((h: Habilitation, i) => {
                        const level = habilitationAlert(h)
                        const top = 8 + i * 14
                        return (
                          <Tooltip key={h.id} content={`${h.intitule} — du ${date(h.delivreeLe)} au ${date(h.expireLe)} (${STATUS_META[level].label})`}>
                            <div className="absolute h-2.5" style={{ top, left: `${pos(h.delivreeLe)}%`, width: `${pos(h.expireLe) - pos(h.delivreeLe)}%` }}>
                              <div className={cn('absolute inset-0 rounded-full', level === 'URGENT' || level === 'EXPIREE' ? 'bg-danger/80' : 'bg-brand-500')} />
                              <div
                                className="absolute inset-y-0 right-0 rounded-r-full bg-warning-soft ring-1 ring-warning/40"
                                style={{ left: `${((pos(alertDate(h.expireLe)) - pos(h.delivreeLe)) / Math.max(1, pos(h.expireLe) - pos(h.delivreeLe))) * 100}%`, backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 3px, oklch(0.72 0.15 70 / 0.35) 3px 5px)' }}
                              />
                            </div>
                          </Tooltip>
                        )
                      })}
                      {audits.map((a) => (
                        <Tooltip key={a.id} content={`Audit du ${date(a.date)} — ${STATUS_META[a.resultat].label}`}>
                          <span className="absolute z-[2] size-3 -translate-x-1/2 rotate-45 rounded-[2px] ring-2 ring-surface" style={{ left: `${pos(a.date)}%`, bottom: 6, background: AUDIT_COLOR[a.resultat] }} />
                        </Tooltip>
                      ))}
                      <div style={{ height: 22 + habs.length * 14 }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </Card>
      ) : (
        <DataTable
          caption="Habilitations"
          rows={data.habilitations}
          getRowId={(h) => h.id}
          initialSort={{ id: 'exp' }}
          columns={[
            { id: 'lic', header: 'Licencié', primary: true, sortValue: (h) => licencies.find((l) => l.id === h.licencieId)?.raisonSociale ?? '', cell: (h) => <Link to={`/console/licencies/${h.licencieId}?onglet=habilitations`} className="font-semibold hover:underline">{licencies.find((l) => l.id === h.licencieId)?.raisonSociale}</Link> },
            { id: 'int', header: 'Habilitation', cell: (h) => h.intitule },
            { id: 'del', header: 'Délivrée', cell: (h) => date(h.delivreeLe) },
            { id: 'exp', header: 'Expire', sortValue: (h) => h.expireLe, cell: (h) => date(h.expireLe) },
            { id: 'alert', header: 'Alerte', sortValue: (h) => habilitationAlert(h), cell: (h) => <StatusBadge status={habilitationAlert(h)} /> },
            {
              id: 'audit',
              header: 'Dernier audit',
              cell: (h) => {
                const a = data.audits.find((x) => x.licencieId === h.licencieId)
                return a ? <span className="inline-flex items-center gap-2 text-[13px]">{date(a.date)} <StatusBadge status={a.resultat} /></span> : '—'
              },
            },
          ]}
        />
      )}

      <HabilitationDialog open={habOpen} onOpenChange={setHabOpen} />
      <AuditSheet open={auditOpen} onOpenChange={setAuditOpen} onProposeSuspension={setSuspendFor} />
      {suspendTarget && <StatusDialog open onOpenChange={(o) => !o && setSuspendFor(null)} licencie={suspendTarget} initialStatus="SUSPENDU" initialMotif="Écart majeur d'audit" />}
    </>
  )
}
