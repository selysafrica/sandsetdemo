import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ImportWizard } from './ImportWizard'

/** D-28 — quick import from the registry. */
export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" title="Importer un fichier JSON" description="Reprise des données produites par les prototypes HTML.">
        {open && <ImportWizard onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
