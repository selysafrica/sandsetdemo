import { useImports } from '@/hooks/queries'
import { dateTime } from '@/lib/format'
import { Badge, Card, CardHeader } from '@/components/ui/display'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/states'
import { ImportWizard } from './ImportWizard'

export function ImportPage() {
  const { data, isLoading } = useImports()
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', to: '/console' }, { label: 'Import JSON' }]}
        title="Reprise des données des prototypes"
        subtitle="Importez les exports JSON des prototypes Console et Kit. Chaque fichier est contrôlé avant import ; rien n'est écrasé."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <ImportWizard />
        </Card>
        <Card>
          <CardHeader title="Historique des imports" />
          <div className="px-5 pb-5">
            <DataTable
              caption="Historique des imports"
              dense
              rows={data}
              loading={isLoading}
              getRowId={(r) => r.id}
              columns={[
                { id: 'file', header: 'Fichier', primary: true, cell: (r) => <span className="font-mono text-[12.5px]">{r.fileName}</span> },
                { id: 'kind', header: 'Type', cell: (r) => <Badge tone={r.kind === 'KIT' ? 'brand' : 'neutral'}>{r.kind === 'KIT' ? 'Kit' : 'Console'}</Badge> },
                { id: 'result', header: 'Résultat', cell: (r) => <span className="text-[12.5px] text-ink-soft">{r.result}</span> },
                { id: 'at', header: 'Date', cell: (r) => <span className="text-[12.5px] whitespace-nowrap">{dateTime(r.at)}</span> },
              ]}
              empty={<EmptyState title="Aucun import" description="Les imports réalisés apparaîtront ici." />}
            />
          </div>
        </Card>
      </div>
    </>
  )
}
