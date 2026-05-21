'use client'

import { useRef, useState } from 'react'

// ─── CSV parser ────────────────────────────────────────────────────────────────

function splitLine(line: string, delim: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === delim && !inQ) {
      result.push(cur.trim()); cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const delim = (lines[0].split(';').length >= lines[0].split(',').length) ? ';' : ','
  const headers = splitLine(lines[0], delim).map(h => h.replace(/^["']|["']$/g, '').trim())
  return lines.slice(1).map(line => {
    const vals = splitLine(line, delim)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').replace(/^["']|["']$/g, '').trim() })
    return obj
  }).filter(row => Object.values(row).some(v => v !== ''))
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function normText(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/** Find a column by trying multiple possible header names (case/accent insensitive) */
export function col(row: Record<string, string>, ...aliases: string[]): string {
  const keys = Object.keys(row)
  for (const alias of aliases) {
    const norm = normText(alias)
    const found = keys.find(k => normText(k) === norm)
    if (found !== undefined) return row[found] ?? ''
  }
  return ''
}

/** Parse Chilean date formats: DD-MM-YYYY, DD/MM/YYYY → YYYY-MM-DD */
export function parseDate(s: string): string | null {
  const clean = s.replace(/["']/g, '').trim()
  const m = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
  return null
}

/** Parse a number string (may have dots as thousands sep or commas as decimal) */
export function parseNum(s: string): number {
  const clean = s.replace(/["'$\s]/g, '')
  // Chilean format: 1.234.567 or 1234567
  const noThousands = clean.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(noThousands)
  return isNaN(n) ? 0 : n
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ParseResult<T> = { ok: true; row: T } | { ok: false; error: string }

export interface PreviewCol<T> {
  key: keyof T
  label: string
  fmt?: (v: T[keyof T]) => string
}

export interface ImportModalConfig<T extends Record<string, unknown>> {
  title: string
  description: string
  templateHeaders: string
  templateExample: string
  siiNote?: string
  endpoint: string
  empresa_id: string
  parseRow: (raw: Record<string, string>, i: number) => ParseResult<T>
  previewCols: PreviewCol<T>[]
  payloadKey: string
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props<T extends Record<string, unknown>> {
  config: ImportModalConfig<T>
  onClose: () => void
  onSuccess: () => void
}

export default function ImportCsvModal<T extends Record<string, unknown>>({
  config, onClose, onSuccess,
}: Props<T>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<T[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [apiError, setApiError] = useState('')

  function handleFile(file: File) {
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setApiError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rawRows = parseCSV(text)
      const parsed: T[] = []
      const errs: string[] = []
      rawRows.forEach((raw, i) => {
        const res = config.parseRow(raw, i)
        if (res.ok) parsed.push(res.row)
        else errs.push(`Fila ${i + 2}: ${res.error}`)
      })
      setRows(parsed)
      setErrors(errs)
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function downloadTemplate() {
    const csv = `${config.templateHeaders}\n${config.templateExample}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'plantilla_importacion.csv'
    a.click(); URL.revokeObjectURL(url)
  }

  async function handleImport() {
    if (rows.length === 0) return
    setLoading(true); setApiError('')
    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id: config.empresa_id, [config.payloadKey]: rows }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.ok) { setApiError(json.error ?? 'Error al importar'); return }
    setResult({ imported: json.imported ?? rows.length, skipped: json.skipped ?? 0 })
    setTimeout(() => { onSuccess() }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">{config.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* SII note + template */}
          {config.siiNote && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
              <p className="font-medium mb-1">Formato SII compatible</p>
              <p>{config.siiNote}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">¿No tienes el archivo del SII? Descarga la plantilla y rellénala:</p>
            <button onClick={downloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Descargar plantilla
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl p-8 text-center cursor-pointer transition-colors"
          >
            <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {fileName ? (
              <p className="text-sm font-medium text-emerald-700">{fileName}</p>
            ) : (
              <>
                <p className="text-sm text-slate-600">Arrastra tu archivo CSV aquí o haz clic para seleccionar</p>
                <p className="text-xs text-slate-400 mt-1">Archivos .csv — separado por punto y coma (;) o coma (,)</p>
              </>
            )}
            <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>

          {/* Parse errors */}
          {errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">{errors.length} fila(s) con problemas (se omitirán):</p>
              <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                {errors.map((e, i) => <li key={i} className="text-xs text-amber-700">{e}</li>)}
              </ul>
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Vista previa — {rows.length} registro(s) listos para importar</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {config.previewCols.map(c => (
                        <th key={String(c.key)} className="text-left px-3 py-2 font-medium text-slate-500 whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 8).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {config.previewCols.map(c => (
                          <td key={String(c.key)} className="px-3 py-1.5 text-slate-700 whitespace-nowrap">
                            {c.fmt ? c.fmt(row[c.key]) : String(row[c.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {rows.length > 8 && (
                      <tr>
                        <td colSpan={config.previewCols.length} className="px-3 py-1.5 text-center text-slate-400 italic">
                          … y {rows.length - 8} más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {apiError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{apiError}</p>}

          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
              Importados: <strong>{result.imported}</strong>{result.skipped > 0 ? ` · Omitidos (duplicados): ${result.skipped}` : ''} — redirigiendo…
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleImport} disabled={rows.length === 0 || loading || !!result}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {loading ? 'Importando…' : `Importar ${rows.length > 0 ? rows.length + ' registros' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
