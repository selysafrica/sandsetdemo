import { CheckCircle2, CircleAlert, CircleX, Download, FileJson } from 'lucide-react'
import { useState } from 'react'
import { qk, useAppMutation, useLicencies } from '@/hooks/queries'
import { cn, downloadText } from '@/lib/utils'
import { importService, SAMPLE_KIT_JSON, type ImportAnalysis } from '@/services/import.service'
import { Button } from '@/components/ui/button'
import { Stepper } from '@/components/ui/controls'
import { Progress } from '@/components/ui/display'
import { Field, Select } from '@/components/ui/form'
import { FileDropzone } from '@/components/common/misc'

const LEVEL_ICON = {
  ok: <CheckCircle2 className="size-4 text-success" />,
  warning: <CircleAlert className="size-4 text-warning" />,
  error: <CircleX className="size-4 text-danger" />,
}

export function ImportWizard({ onDone }: { onDone?: () => void }) {
  const { data: licencies = [] } = useLicencies()
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null)
  const [target, setTarget] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const commit = useAppMutation(() => importService.commit(file!.name, analysis!, target || undefined), {
    invalidate: [qk.imports, qk.licencies],
    onSuccess: (r) => {
      setResult(r.result)
      setStep(2)
    },
  })

  const analyze = async (f: File) => {
    setFile(f)
    setError(null)
    setAnalyzing(true)
    try {
      const a = await importService.analyze(f.name, await f.text())
      setAnalysis(a)
      setStep(1)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    setStep(0)
    setFile(null)
    setAnalysis(null)
    setResult(null)
    setTarget('')
  }

  return (
    <div>
      <Stepper steps={['Fichier', 'Analyse', 'Import']} current={step} className="mb-6" />
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <FileDropzone
            onFiles={(fs) => fs[0] && analyze(fs[0])}
            accept={{ 'application/json': ['.json'] }}
            label="Déposez un export JSON de la Console ou du Kit"
            hint="Fichiers produits par Console-Licencies-ISO9001-2026.html ou Kit-Deploiement-ISO9001-2026.html"
          />
          {analyzing && (
            <div className="flex items-center gap-3 text-[13px] text-muted">
              <FileJson className="size-4 animate-pulse text-brand-600" /> Analyse de {file?.name}…
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-md bg-danger-soft px-3 py-2.5 text-[13.5px] text-danger">
              {error}
            </p>
          )}
          <Button variant="link" className="self-start" onClick={() => downloadText('exemple-kit-dossier.json', JSON.stringify(SAMPLE_KIT_JSON, null, 2), 'application/json')}>
            <Download /> Télécharger un fichier d'exemple (dossier Kit)
          </Button>
        </div>
      )}
      {step === 1 && analysis && (
        <div className="flex flex-col gap-5">
          <p className="text-[13.5px] text-ink-soft">
            <strong className="text-ink">{file?.name}</strong> reconnu comme export <strong className="text-ink">{analysis.kind === 'KIT' ? 'Dossier Kit' : 'Registre Console'}</strong>.
          </p>
          <table className="w-full overflow-hidden rounded-md border border-line text-[13.5px]">
            <caption className="sr-only">Rapport de validation</caption>
            <thead className="bg-canvas text-left text-[12px] text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Entité</th>
                <th className="px-3 py-2 text-right font-semibold">Reconnus</th>
                <th className="px-3 py-2 font-semibold">Contrôle</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((r) => (
                <tr key={r.entity} className="border-t border-line">
                  <td className="px-3 py-2 font-semibold">{r.entity}</td>
                  <td className="px-3 py-2 text-right font-mono tabular">{r.recognized}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-start gap-2">
                      {LEVEL_ICON[r.level]}
                      <span className={cn(r.level === 'ok' ? 'text-muted' : 'text-ink')}>{r.warnings.length ? r.warnings.join(' ; ') : 'Conforme'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Aperçu</p>
            <ul className="rounded-md bg-canvas px-3 py-2 font-mono text-[12px] leading-6 text-ink-soft">
              {analysis.preview.map((p) => (
                <li key={p} className="truncate">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          {analysis.kind === 'KIT' && (
            <Field label="Licencié destinataire du dossier" hint="Le dossier sera créé dans l'instance de ce licencié ; la Console n'en verra que les agrégats.">
              {(p) => (
                <Select {...p} value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="">Choisir…</option>
                  {licencies
                    .filter((l) => l.status === 'HABILITE')
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.raisonSociale}
                      </option>
                    ))}
                </Select>
              )}
            </Field>
          )}
          {commit.isPending && <Progress value={70} label="Import en cours" />}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>
              Changer de fichier
            </Button>
            <Button loading={commit.isPending} disabled={analysis.kind === 'KIT' && !target} onClick={() => commit.mutate(undefined)}>
              Importer
            </Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 className="size-10 text-success" />
          <p className="mt-3 text-[16px] font-bold text-ink">Import terminé sans perte</p>
          <p className="mt-1 max-w-md text-[13.5px] text-muted">{result}</p>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" onClick={reset}>
              Importer un autre fichier
            </Button>
            {onDone && <Button onClick={onDone}>Terminer</Button>}
          </div>
        </div>
      )}
    </div>
  )
}
