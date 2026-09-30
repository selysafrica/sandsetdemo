import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { downloadText } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox, Segmented } from '@/components/ui/controls'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/form'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  fileName: string
  rows: Record<string, string | number>[]
  dateKey?: string
}

/** D-31 — accountant-friendly CSV export (columns, separator, BOM for Excel). */
export function ExportCsvDialog({ open, onOpenChange, title, fileName, rows, dateKey }: Props) {
  const headers = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows])
  const [cols, setCols] = useState<Set<string>>(new Set())
  const [sep, setSep] = useState<';' | ','>(';')
  const [bom, setBom] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  useEffect(() => {
    if (open) setCols(new Set(headers))
  }, [open, headers])

  const filtered = rows.filter((r) => !dateKey || ((!from || String(r[dateKey]) >= from) && (!to || String(r[dateKey]) <= to)))
  const chosen = headers.filter((h) => cols.has(h))
  const esc = (v: string | number) => {
    const s = String(v)
    return s.includes(sep) || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [chosen.join(sep), ...filtered.map((r) => chosen.map((h) => esc(r[h])).join(sep))]
  const content = (bom ? '﻿' : '') + lines.join('\n')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={title}
        description={`${filtered.length} lignes seront exportées.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              disabled={!chosen.length}
              onClick={() => {
                downloadText(fileName, content)
                toast.success(`${fileName} téléchargé`)
                onOpenChange(false)
              }}
            >
              Exporter
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {dateKey && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Du">{(p) => <Input {...p} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
              <Field label="Au">{(p) => <Input {...p} type="date" value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
            </div>
          )}
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-ink-soft">Colonnes</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {headers.map((h) => (
                <label key={h} className="flex items-center gap-2 text-[13.5px]">
                  <Checkbox
                    checked={cols.has(h)}
                    onCheckedChange={(v) => {
                      const n = new Set(cols)
                      if (v === true) n.add(h)
                      else n.delete(h)
                      setCols(n)
                    }}
                  />
                  {h}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-6">
            <Field label="Séparateur">
              {() => (
                <Segmented
                  label="Séparateur"
                  size="sm"
                  value={sep}
                  onChange={setSep}
                  options={[
                    { value: ';', label: 'Point-virgule ;' },
                    { value: ',', label: 'Virgule ,' },
                  ]}
                />
              )}
            </Field>
            <label className="mt-5 flex items-center gap-2 text-[13.5px]">
              <Checkbox checked={bom} onCheckedChange={(v) => setBom(v === true)} /> UTF-8 avec BOM (Excel)
            </label>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-ink-soft">Aperçu</p>
            <pre className="overflow-x-auto rounded-md bg-canvas p-3 font-mono text-[11.5px] leading-5 text-ink-soft">{lines.slice(0, 4).join('\n')}</pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
