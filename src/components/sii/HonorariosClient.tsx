'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import type { BoletaHonorarios, TipoBoleta } from '@/types/sii.types'
import { formatCurrency, formatDate } from '@/lib/utils'
import ImportCsvModal from '@/components/sii/ImportCsvModal'
import type { ImportModalConfig, ParseResult } from '@/components/sii/ImportCsvModal'
import { col, parseDate, parseNum, normText } from '@/components/sii/ImportCsvModal'

// ─── Honorarios CSV parser ──────────────────────────────────────────────────────

type HonImportRow = {
  tipo: TipoBoleta
  numero: number
  rut_prestador: string
  nombre_prestador: string
  rut_pagador: string
  nombre_pagador: string | null
  fecha: string
  monto_bruto: number
}

function parseHonorarioRow(raw: Record<string, string>): ParseResult<HonImportRow> {
  const numeroRaw = col(raw, 'N° BOLETA','N BOLETA','NUMERO','Numero','numero','FOLIO','Folio','N°','N')
  const numero = parseInt(numeroRaw.replace(/\D/g, ''))
  if (!numero || isNaN(numero)) return { ok: false, error: `Número de boleta inválido: "${numeroRaw}"` }

  const rut_prestador = col(raw, 'RUT PRESTADOR','Rut Prestador','rut_prestador','RUT','Rut')
  if (!rut_prestador) return { ok: false, error: 'RUT Prestador no encontrado' }

  const nombre_prestador = col(raw, 'NOMBRE PRESTADOR','Nombre Prestador','nombre_prestador','NOMBRE','Nombre')
  if (!nombre_prestador) return { ok: false, error: 'Nombre Prestador requerido' }

  const rut_pagador = col(raw, 'RUT PAGADOR','Rut Pagador','rut_pagador','RUT EMPRESA','Rut Empresa')

  const nombre_pagador = col(raw, 'NOMBRE PAGADOR','Nombre Pagador','nombre_pagador','NOMBRE EMPRESA','Empresa') || null

  const fechaRaw = col(raw, 'FECHA','Fecha','fecha','FECHA EMISION','Fecha Emision','FECHA PAGO','Fecha Pago')
  const fecha = parseDate(fechaRaw)
  if (!fecha) return { ok: false, error: `Fecha inválida: "${fechaRaw}"` }

  const monto_bruto = parseNum(col(raw, 'MONTO BRUTO','Monto Bruto','monto_bruto','BRUTO','Bruto','MONTO','Monto','HONORARIO','Honorario'))
  if (monto_bruto <= 0) return { ok: false, error: 'Monto bruto debe ser mayor a 0' }

  const tipoRaw = normText(col(raw, 'TIPO','Tipo','tipo','TIPO BOLETA','Tipo Boleta') || 'recibida')
  const tipo: TipoBoleta = tipoRaw.includes('emit') ? 'emitida' : 'recibida'

  return { ok: true, row: { tipo, numero, rut_prestador, nombre_prestador, rut_pagador, nombre_pagador, fecha, monto_bruto } }
}

const HON_CONFIG = (empresa_id: string): ImportModalConfig<HonImportRow> => ({
  title: 'Importar Boletas de Honorarios desde CSV',
  description: 'Compatible con el archivo descargable del portal SII de Boletas de Honorarios.',
  siiNote: 'Exporta desde SII → Boletas de Honorarios → Consultar → Descargar Excel/CSV. También acepta la plantilla propia.',
  templateHeaders: 'TIPO;N° BOLETA;RUT PRESTADOR;NOMBRE PRESTADOR;RUT PAGADOR;NOMBRE PAGADOR;FECHA;MONTO BRUTO',
  templateExample: 'recibida;1001;12.345.678-9;Juan Pérez González;76.543.210-K;Mi Empresa S.A.;15-01-2024;100000\nemitida;500;12.345.678-9;Juan Pérez González;76.999.000-1;Otra Empresa;20-01-2024;80000',
  endpoint: '/api/sii/honorarios/import',
  empresa_id,
  payloadKey: 'boletas',
  parseRow: parseHonorarioRow,
  previewCols: [
    { key: 'tipo',             label: 'Tipo',      fmt: (v) => v === 'emitida' ? 'Emitida' : 'Recibida' },
    { key: 'numero',           label: 'N°',        fmt: (v) => `#${v}` },
    { key: 'rut_prestador',    label: 'Prestador' },
    { key: 'nombre_prestador', label: 'Nombre' },
    { key: 'fecha',            label: 'Fecha' },
    { key: 'monto_bruto',      label: 'Bruto',     fmt: (v) => `$${Number(v).toLocaleString('es-CL')}` },
  ],
})

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  empresa_id: string
  boletas: BoletaHonorarios[]
}

export default function HonorariosClient({ empresa_id, boletas }: Props) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<'todos' | TipoBoleta>('todos')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const filtradas = filtro === 'todos' ? boletas : boletas.filter((b) => b.tipo === filtro)
  const totalBruto     = filtradas.reduce((s, b) => s + b.monto_bruto, 0)
  const totalRetencion = filtradas.reduce((s, b) => s + b.retencion_10, 0)

  const exportarExcel = useCallback(() => {
    const rows = [
      ['Tipo', 'N°', 'RUT Prestador', 'Nombre Prestador', 'RUT Pagador', 'Nombre Pagador', 'Fecha', 'Bruto', 'Retención 10%', 'Líquido'],
      ...filtradas.map((b) => [
        b.tipo === 'emitida' ? 'Emitida' : 'Recibida',
        b.numero,
        b.rut_prestador,
        b.nombre_prestador,
        b.rut_pagador ?? '',
        b.nombre_pagador ?? '',
        b.fecha,
        b.monto_bruto,
        b.retencion_10,
        b.monto_liquido,
      ]),
      [],
      ['', '', '', '', '', '', 'TOTAL', totalBruto, totalRetencion, totalBruto - totalRetencion],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 10 }, { wch: 8 }, { wch: 16 }, { wch: 24 }, { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Honorarios')
    XLSX.writeFile(wb, `honorarios_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [filtradas, totalBruto, totalRetencion])

  return (
    <div className="space-y-4">
      {showImport && (
        <ImportCsvModal
          config={HON_CONFIG(empresa_id)}
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); router.refresh() }}
        />
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['todos', 'emitida', 'recibida'] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filtro === f ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}>
            {f === 'todos' ? 'Todos' : f === 'emitida' ? 'Emitidas' : 'Recibidas'}
          </button>
        ))}
        <div className="ml-auto flex gap-3 text-sm text-slate-500 items-center">
          <span>Bruto: <strong className="text-slate-700">{formatCurrency(totalBruto)}</strong></span>
          <span>Retención 10%: <strong className="text-orange-600">{formatCurrency(totalRetencion)}</strong></span>
        </div>
        <button onClick={exportarExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel
        </button>
        <button onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-sm font-medium rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Importar CSV
        </button>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
          + Boleta
        </button>
      </div>

      {showForm && (
        <NuevoHonorarioForm
          empresa_id={empresa_id}
          onCancel={() => setShowForm(false)}
          onSave={() => { setShowForm(false); router.refresh() }}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-slate-400 text-sm">Sin boletas registradas.</p>
            <button onClick={() => setShowImport(true)} className="text-sm text-emerald-700 hover:underline">
              Importar CSV del SII →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">N°</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Prestador / Pagador</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Bruto</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Ret. 10%</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      b.tipo === 'emitida' ? 'bg-emerald-100 text-emerald-800' : 'bg-green-100 text-green-700'
                    }`}>{b.tipo === 'emitida' ? 'Emitida' : 'Recibida'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">#{b.numero}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs text-slate-800 font-medium leading-tight">{b.nombre_prestador}</p>
                    <p className="text-xs text-slate-400">{b.rut_prestador}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(b.fecha)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatCurrency(b.monto_bruto)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-orange-600">{formatCurrency(b.retencion_10)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-800">{formatCurrency(b.monto_liquido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function NuevoHonorarioForm({ empresa_id, onCancel, onSave }: { empresa_id: string; onCancel: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    tipo: 'recibida' as TipoBoleta,
    numero: '',
    rut_prestador: '',
    nombre_prestador: '',
    rut_pagador: '',
    nombre_pagador: '',
    fecha: new Date().toISOString().split('T')[0],
    monto_bruto: '',
    concepto: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/sii/honorarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id,
        ...form,
        numero: Number(form.numero),
        monto_bruto: Number(form.monto_bruto),
        estado: 'vigente',
        nombre_pagador: form.nombre_pagador || null,
        concepto: form.concepto || null,
      }),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); setLoading(false); return }
    onSave()
  }

  const bruto = Number(form.monto_bruto || 0)

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-slate-800">Nueva Boleta de Honorarios</h3>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
            <select value={form.tipo} onChange={set('tipo')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="recibida">Recibida</option>
              <option value="emitida">Emitida</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
            <input required type="number" min="1" value={form.numero} onChange={set('numero')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
            <input required type="date" value={form.fecha} onChange={set('fecha')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">RUT Prestador</label>
            <input required value={form.rut_prestador} onChange={set('rut_prestador')}
              placeholder="12.345.678-9"
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre Prestador</label>
            <input required value={form.nombre_prestador} onChange={set('nombre_prestador')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">RUT Pagador</label>
            <input required value={form.rut_pagador} onChange={set('rut_pagador')}
              placeholder="76.000.000-0"
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Monto Bruto</label>
            <input required type="number" min="1" value={form.monto_bruto} onChange={set('monto_bruto')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
        </div>

        {bruto > 0 && (
          <div className="text-xs text-slate-500 flex gap-4">
            <span>Retención 10%: <strong className="text-orange-600">{formatCurrency(Math.round(bruto * 0.10))}</strong></span>
            <span>Líquido: <strong className="text-slate-700">{formatCurrency(Math.round(bruto * 0.90))}</strong></span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {loading ? 'Guardando…' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
