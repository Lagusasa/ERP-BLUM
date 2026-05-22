'use client'

import { useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { CuentaBancaria, MovimientoCaja } from '@/types/finanzas.types'
import { CATEGORIA_LABELS } from '@/types/finanzas.types'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

// ─── Bank CSV parser ────────────────────────────────────────────────────────────

function parseBankCSV(text: string): { fecha: string; descripcion: string; monto: number; tipo: 'ingreso' | 'egreso' }[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const delim = lines[0].split(';').length >= lines[0].split(',').length ? ';' : ','

  const splitLine = (line: string) => {
    const result: string[] = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === delim && !inQ) { result.push(cur.trim()); cur = '' }
      else cur += ch
    }
    result.push(cur.trim())
    return result.map(v => v.replace(/^["']|["']$/g, '').trim())
  }

  const headers = splitLine(lines[0]).map(h => h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
  const findCol = (...names: string[]) => {
    for (const n of names) {
      const idx = headers.findIndex(h => h.includes(n))
      if (idx >= 0) return idx
    }
    return -1
  }

  const fechaIdx = findCol('fecha', 'date', 'dia')
  const descIdx  = findCol('descripcion', 'glosa', 'detalle', 'concepto', 'description')
  const montoIdx = findCol('monto', 'importe', 'amount', 'valor')
  const cargoIdx = findCol('cargo', 'debito', 'egreso', 'debit', 'salida')
  const abonoIdx = findCol('abono', 'credito', 'ingreso', 'credit', 'entrada')

  const parseNum = (s: string) => {
    const clean = s.replace(/["'$\s]/g, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(clean)
    return isNaN(n) ? 0 : Math.abs(n)
  }

  const parseDate = (s: string): string | null => {
    const clean = s.replace(/["']/g, '').trim()
    const m = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
    return null
  }

  const rows: ReturnType<typeof parseBankCSV> = []

  for (const line of lines.slice(1)) {
    const cols = splitLine(line)
    const fechaRaw = fechaIdx >= 0 ? cols[fechaIdx] : ''
    const fecha = parseDate(fechaRaw)
    if (!fecha) continue

    const desc = descIdx >= 0 ? cols[descIdx] : 'Sin descripción'

    let monto = 0
    let tipo: 'ingreso' | 'egreso' = 'egreso'

    if (abonoIdx >= 0 && cargoIdx >= 0) {
      const abono = parseNum(cols[abonoIdx] ?? '')
      const cargo = parseNum(cols[cargoIdx] ?? '')
      if (abono > 0) { monto = abono; tipo = 'ingreso' }
      else if (cargo > 0) { monto = cargo; tipo = 'egreso' }
    } else if (montoIdx >= 0) {
      const raw = cols[montoIdx] ?? ''
      monto = parseNum(raw)
      tipo = raw.startsWith('-') ? 'egreso' : 'ingreso'
    }

    if (monto > 0) rows.push({ fecha, descripcion: desc, monto, tipo })
  }

  return rows
}

// ─── Match logic ────────────────────────────────────────────────────────────────

type BankRow = ReturnType<typeof parseBankCSV>[number]

function findMatch(row: BankRow, movimientos: MovimientoCaja[]): MovimientoCaja | null {
  return movimientos.find(
    m =>
      m.fecha === row.fecha &&
      m.tipo  === row.tipo  &&
      Math.abs(m.monto - row.monto) < 1 &&
      !m.conciliado
  ) ?? null
}

// ─── Component ──────────────────────────────────────────────────────────────────

interface Props {
  empresa_id: string
  cuentas: CuentaBancaria[]
  movimientos: MovimientoCaja[]
}

export default function ConciliacionClient({ empresa_id, cuentas, movimientos }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id ?? '')
  const [bankRows, setBankRows] = useState<BankRow[]>([])
  const [fileName, setFileName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const movCuenta = useMemo(
    () => movimientos.filter(m => !cuentaId || m.cuenta_id === cuentaId),
    [movimientos, cuentaId]
  )

  const matches = useMemo<Array<{ bank: BankRow; mov: MovimientoCaja | null }>>(() => {
    if (bankRows.length === 0) return []
    const used = new Set<string>()
    return bankRows.map(row => {
      const mov = movCuenta.find(
        m =>
          m.fecha === row.fecha &&
          m.tipo  === row.tipo  &&
          Math.abs(m.monto - row.monto) < 1 &&
          !m.conciliado &&
          !used.has(m.id)
      ) ?? null
      if (mov) used.add(mov.id)
      return { bank: row, mov }
    })
  }, [bankRows, movCuenta])

  function handleFile(file: File) {
    setFileName(file.name)
    setBankRows([])
    setMessage('')
    setSelected(new Set())
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setBankRows(parseBankCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
  }

  function toggleSelect(movId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(movId) ? next.delete(movId) : next.add(movId)
      return next
    })
  }

  function selectAutoMatches() {
    const ids = matches.filter(m => m.mov).map(m => m.mov!.id)
    setSelected(new Set(ids))
  }

  async function conciliar(ids: string[]) {
    if (ids.length === 0) return
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/finanzas/conciliacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id, ids, conciliado: true }),
    })
    const json = await res.json()
    setSaving(false)
    if (!json.ok) { setMessage(`Error: ${json.error}`); return }
    setMessage(`${json.updated} movimiento(s) conciliado(s).`)
    setSelected(new Set())
    router.refresh()
  }

  const noConciliados = movCuenta.filter(m => !m.conciliado).length
  const conciliados   = movCuenta.filter(m =>  m.conciliado).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Conciliación Bancaria</h1>
          <p className="text-sm text-slate-500 mt-0.5">Contraste movimientos del sistema con el cartola bancaria.</p>
        </div>
      </div>

      {/* Selector cuenta + KPIs */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Cuenta bancaria</label>
          <select value={cuentaId} onChange={e => { setCuentaId(e.target.value); setBankRows([]); setFileName('') }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
            {cuentas.map(c => (
              <option key={c.id} value={c.id}>{c.banco} — {c.numero_cuenta}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-medium">
            {noConciliados} pendiente{noConciliados !== 1 ? 's' : ''}
          </span>
          <span className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
            {conciliados} conciliado{conciliados !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* CSV Import */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Importar cartola bancaria</p>
          <p className="text-xs text-slate-400">Formatos: BancoEstado, Santander, BCI, Banco de Chile (CSV)</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div
            className="border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onDragOver={(e) => e.preventDefault()}
          >
            <svg className="w-7 h-7 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {fileName
              ? <p className="text-sm font-medium text-emerald-700">{fileName} — {bankRows.length} movimientos</p>
              : <p className="text-sm text-slate-500">Arrastra tu cartola CSV aquí o haz clic para seleccionar</p>
            }
            <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>

          {bankRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">
                  {matches.filter(m => m.mov).length} coincidencias automáticas de {bankRows.length} movimientos bancarios
                </p>
                <div className="flex gap-2">
                  <button onClick={selectAutoMatches}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50">
                    Seleccionar coincidencias
                  </button>
                  <button onClick={() => conciliar([...selected])} disabled={selected.size === 0 || saving}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50">
                    {saving ? 'Guardando…' : `Conciliar ${selected.size > 0 ? selected.size : ''}`}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-500">Banco: Fecha</th>
                      <th className="px-3 py-2 text-left text-slate-500">Banco: Descripción</th>
                      <th className="px-3 py-2 text-right text-slate-500">Banco: Monto</th>
                      <th className="px-3 py-2 text-center text-slate-500">Estado</th>
                      <th className="px-3 py-2 text-left text-slate-500">Sistema: Coincidencia</th>
                      <th className="px-3 py-2 text-center text-slate-500">Conciliar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matches.map(({ bank, mov }, i) => (
                      <tr key={i} className={cn('hover:bg-slate-50', mov && selected.has(mov.id) && 'bg-emerald-50')}>
                        <td className="px-3 py-2 text-slate-600">{formatDate(bank.fecha)}</td>
                        <td className="px-3 py-2 text-slate-700 max-w-[200px] truncate">{bank.descripcion}</td>
                        <td className={cn('px-3 py-2 text-right font-medium tabular-nums', bank.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600')}>
                          {bank.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(bank.monto)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {mov
                            ? <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Coincide</span>
                            : <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Sin match</span>
                          }
                        </td>
                        <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate">
                          {mov ? mov.descripcion : '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {mov && !mov.conciliado && (
                            <input type="checkbox" checked={selected.has(mov.id)}
                              onChange={() => toggleSelect(mov.id)}
                              className="rounded border-slate-300 accent-emerald-600" />
                          )}
                          {mov?.conciliado && (
                            <svg className="w-4 h-4 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Movimientos del sistema */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Movimientos del sistema</p>
          <div className="flex gap-2">
            {selected.size > 0 && bankRows.length === 0 && (
              <button onClick={() => conciliar([...selected])} disabled={saving}
                className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50">
                {saving ? 'Guardando…' : `Conciliar ${selected.size} seleccionado(s)`}
              </button>
            )}
          </div>
        </div>
        {message && (
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 text-sm text-emerald-800">{message}</div>
        )}
        {movCuenta.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Sin movimientos para esta cuenta.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs text-slate-500">
                  {bankRows.length === 0 && (
                    <input type="checkbox"
                      checked={selected.size === movCuenta.filter(m => !m.conciliado).length && noConciliados > 0}
                      onChange={(e) => setSelected(e.target.checked ? new Set(movCuenta.filter(m => !m.conciliado).map(m => m.id)) : new Set())}
                      className="rounded border-slate-300 accent-emerald-600" />
                  )}
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Fecha</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Descripción</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Categoría</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Monto</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movCuenta.map(m => (
                <tr key={m.id} className={cn('hover:bg-slate-50', m.conciliado && 'opacity-60')}>
                  <td className="px-4 py-2.5">
                    {!m.conciliado && bankRows.length === 0 && (
                      <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)}
                        className="rounded border-slate-300 accent-emerald-600" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(m.fecha)}</td>
                  <td className="px-4 py-2.5 text-slate-800">{m.descripcion}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{CATEGORIA_LABELS[m.categoria] ?? m.categoria}</td>
                  <td className={cn('px-4 py-2.5 text-right font-medium tabular-nums text-sm', m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600')}>
                    {m.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(m.monto)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                      m.conciliado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    )}>
                      {m.conciliado ? 'Conciliado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
