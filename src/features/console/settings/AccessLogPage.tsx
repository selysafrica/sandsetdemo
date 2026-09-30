import { Download, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAccessLogs } from '@/hooks/queries'
import { dateTime } from '@/lib/format'
import type { AccessLog } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/display'
import { Input, Select } from '@/components/ui/form'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ExportCsvDialog } from '@/components/common/ExportCsvDialog'
import { FilterChip } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { matches, SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/states'

export function AccessLogPage() {
  const { data = [], isLoading } = useAccessLogs()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('')
  const [sensitive, setSensitive] = useState(false)
  const [from, setFrom] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const kinds = [...new Set(data.map((l) => l.action.split(' ')[0]))]
  const rows = useMemo(
    () => data.filter((l) => (!sensitive || l.sensitive) && (!kind || l.action.startsWith(kind)) && (!from || l.at >= from) && matches(query, l.userName, l.action, l.ip)),
    [data, sensitive, kind, from, query],
  )
  const columns: Column<AccessLog>[] = [
    { id: 'at', header: 'Date et heure', sortValue: (l) => l.at, cell: (l) => <span className="font-mono text-[12.5px] whitespace-nowrap">{dateTime(l.at)}</span> },
    { id: 'user', header: 'Utilisateur', cell: (l) => l.userName },
    { id: 'action', header: 'Action', primary: true, cell: (l) => <span className="inline-flex items-center gap-2">{l.sensitive && <ShieldAlert className="size-4 text-warning" aria-label="Action sensible" />}{l.action}</span> },
    { id: 'ip', header: 'Adresse IP', cell: (l) => <span className="font-mono text-[12.5px]">{l.ip}</span> },
    { id: 'device', header: 'Appareil', cell: (l) => <span className="text-[12.5px] text-muted">{l.device}</span> },
    { id: 's', header: 'Niveau', cell: (l) => (l.sensitive ? <Badge tone="warning">Sensible</Badge> : <Badge>Standard</Badge>) },
  ]
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', to: '/console' }, { label: "Journal d'accès" }]}
        title="Journal des accès administrateur"
        subtitle="Traçabilité des connexions et des actions sensibles de la Console. Conservation 12 mois."
        actions={
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download /> Exporter CSV
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Utilisateur, action, IP…" className="w-full sm:w-72" />
        <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type d'action" className="w-48">
          <option value="">Toutes les actions</option>
          {kinds.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Depuis le" className="w-44" />
        <FilterChip active={sensitive} onClick={() => setSensitive((v) => !v)} count={data.filter((l) => l.sensitive).length}>
          Actions sensibles
        </FilterChip>
      </div>
      <DataTable
        caption="Journal des accès"
        columns={columns}
        rows={rows}
        loading={isLoading}
        getRowId={(l) => l.id}
        initialSort={{ id: 'at', desc: true }}
        pageSize={15}
        rowClassName={(l) => (l.sensitive ? 'bg-warning-soft/30' : undefined)}
        empty={<EmptyState title="Aucune entrée" description="Aucun accès ne correspond à ces critères." />}
      />
      <ExportCsvDialog open={exportOpen} onOpenChange={setExportOpen} title="Exporter le journal d'accès" fileName="journal-acces.csv" rows={rows.map((l) => ({ Date: l.at, Utilisateur: l.userName, Action: l.action, IP: l.ip, Appareil: l.device, Sensible: l.sensitive ? 'Oui' : 'Non' }))} />
    </>
  )
}
