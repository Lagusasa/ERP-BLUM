'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import type { DteDocumento } from '@/types/sii.types'
import { TIPO_DTE_LABELS, ESTADO_DTE_LABELS } from '@/types/sii.types'
import { formatCurrency, formatDate } from '@/lib/utils'
import ImportCsvModal from '@/components/sii/ImportCsvModal'
import type { ImportModalConfig, ParseResult } from '@/components/sii/ImportCsvModal'
import { col, parseDate, parseNum, normText } from '@/components/sii/ImportCsvModal'

// ─── DTE CSV parser ────────────────────────────────────────────────────────────

type DteImportRow = {
  tipo_dte: string
  folio: number
  rut_contraparte: string
  razon_social: string
  fecha_emision: string
  monto_neto: number
  monto_iva: number
  monto_total: number
  estado: string
}

const TIPO_DTE_MAP: Record<string, string> = {
  'factura electronica': '33',
  'factura afecta electronica': '33',
  'factura electronica afecta': '33',
  'factura no afecta electronica': '34',
  'factura no afecta': '34',
  'boleta electronica': '39',
  'boleta electronica afecta': '39',
  'boleta no afecta': '41',
  'guia de despacho': '52',
  'nota de credito': '61',
  'nota de debito': '56',
}

function normTipoDte(s: string): string {
  const n = normText(s)
  if (TIPO_DTE_MAP[n]) return TIPO_DTE_MAP[n]
  const num = s.replace(/\D/g, '')
  if (['33','34','39','41','52','61','56'].includes(num)) return num
  return ''
}

function normEstadoDte(s: string): string {
  const n = normText(s)
  if (['aceptado','procesado','ok','valido'].includes(n)) return 'aceptado'
  if (['rechazado','no valido','invalido'].includes(n)) return 'rechazado'
  if (['anulado','cancelado'].includes(n)) return 'anulado'
  return 'pendiente'
}

function parseDteRow(raw: Record<string, string>): ParseResult<DteImportRow> {
  const tipoRaw = col(raw,
    'TIPO DTE','Tipo DTE','TIPO','Tipo','TipoDTE','tipo_dte','CODIGO DTE','Codigo DTE',
    'TIPO DOCUMENTO','Tipo Documento'
  )
  const tipo_dte = normTipoDte(tipoRaw)
  if (!tipo_dte) return { ok: false, error: `Tipo DTE inválido: "${tipoRaw}"` }

  const folioRaw = col(raw, 'FOLIO','Folio','folio','N° DOCUMENTO','N DOCUMENTO','NUMERO','Numero')
  const folio = parseInt(folioRaw.replace(/\D/g, ''))
  if (!folio || isNaN(folio)) return { ok: false, error: `Folio inválido: "${folioRaw}"` }

  const rut_contraparte = col(raw,
    'RUT','RUT RECEPTOR','RUT EMISOR','Rut Receptor','Rut Emisor','rut_contraparte',
    'RUT CONTRAPARTE','RUT CLIENTE','RUT PROVEEDOR'
  )
  if (!rut_contraparte) return { ok: false, error: 'RUT contraparte no encontrado' }

  const razon_social = col(raw,
    'RAZON SOCIAL','RAZON SOCIAL RECEPTOR','RAZON SOCIAL EMISOR','Razon Social',
    'Razón Social','NOMBRE','razon_social'
  )

  const fechaRaw = col(raw,
    'FECHA EMISION DOCUMENTO','FECHA EMISION','FECHA','Fecha Emisión','Fecha','fecha_emision',
    'FECHA EMISION DOC','FECHA DOCUMENTO'
  )
  const fecha_emision = parseDate(fechaRaw)
  if (!fecha_emision) return { ok: false, error: `Fecha inválida: "${fechaRaw}"` }

  const monto_neto  = parseNum(col(raw, 'MONTO NETO','Monto Neto','NETO','Neto','monto_neto','MONTO AFECTO','Monto Afecto'))
  const monto_iva   = parseNum(col(raw, 'IVA RECUPERABLE','IVA','Iva','monto_iva','IVA 19%','MONTO IVA'))
  let   monto_total = parseNum(col(raw, 'MONTO TOTAL','Monto Total','TOTAL','Total','monto_total'))
  if (monto_total === 0) monto_total = monto_neto + monto_iva

  const estadoRaw = col(raw, 'ESTADO','Estado','estado','ESTADO OPERACION','Estado Operacion','ACCION')
  const estado = normEstadoDte(estadoRaw || 'pendiente')

  return {
    ok: true,
    row: { tipo_dte, folio, rut_contraparte, razon_social, fecha_emision, monto_neto, monto_iva, monto_total, estado }
  }
}

const DTE_CONFIG = (empresa_id: string): ImportModalConfig<DteImportRow> => ({
  title: 'Importar DTEs desde archivo CSV',
  description: 'Compatible con el Registro de Compras y Ventas del SII (archivo CSV descargado desde el portal SII).',
  siiNote: 'Exporta desde SII → Registro de Compras y Ventas → selecciona período → Descargar CSV. También puedes usar la plantilla propia.',
  templateHeaders: 'TIPO DTE;FOLIO;RUT;RAZON SOCIAL;FECHA EMISION;MONTO NETO;IVA;MONTO TOTAL;ESTADO',
  templateExample: '33;1001;76.543.210-K;Empresa Ejemplo S.A.;15-01-2024;100000;19000;119000;aceptado\n34;1002;12.345.678-9;Juan Pérez González;20-01-2024;50000;0;50000;pendiente',
  endpoint: '/api/sii/dte/import',
  empresa_id,
  payloadKey: 'dtes',
  parseRow: parseDteRow,
  previewCols: [
    { key: 'tipo_dte',       label: 'Tipo',    fmt: (v) => (TIPO_DTE_LABELS as Record<string, string>)[v as string] ?? String(v) },
    { key: 'folio',          label: 'Folio',   fmt: (v) => `#${v}` },
    { key: 'rut_contraparte',label: 'RUT' },
    { key: 'razon_social',   label: 'Razón Social' },
    { key: 'fecha_emision',  label: 'Fecha' },
    { key: 'monto_neto',     label: 'Neto',    fmt: (v) => `$${Number(v).toLocaleString('es-CL')}` },
    { key: 'monto_total',    label: 'Total',   fmt: (v) => `$${Number(v).toLocaleString('es-CL')}` },
    { key: 'estado',         label: 'Estado' },
  ],
})

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  empresa_id: string
  dtes: DteDocumento[]
}

type EstadoFiltro = 'todos' | 'pendiente' | 'aceptado' | 'rechazado' | 'anulado'

export default function DteListClient({ empresa_id, dtes }: Props) {
  const router = useRouter()
  const [showImport, setShowImport] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('todos')
  const [anulando, setAnulando] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return dtes.filter((d) => {
      if (q && !d.razon_social?.toLowerCase().includes(q) && !d.rut_contraparte?.toLowerCase().includes(q) && !String(d.folio).includes(q)) return false
      if (filtroTipo && d.tipo_dte !== filtroTipo) return false
      if (filtroEstado !== 'todos' && d.estado !== filtroEstado) return false
      return true
    })
  }, [dtes, busqueda, filtroTipo, filtroEstado])

  const totalNeto  = filtrados.reduce((s, d) => s + d.monto_neto,  0)
  const totalIva   = filtrados.reduce((s, d) => s + d.monto_iva,   0)
  const totalTotal = filtrados.reduce((s, d) => s + d.monto_total, 0)

  const exportarExcel = useCallback(() => {
    const rows = [
      ['Tipo', 'Folio', 'RUT Contraparte', 'Razón Social', 'Fecha Emisión', 'Estado', 'Neto', 'IVA', 'Total'],
      ...filtrados.map((d) => [
        (TIPO_DTE_LABELS as Record<string, string>)[d.tipo_dte] ?? d.tipo_dte,
        d.folio,
        d.rut_contraparte,
        d.razon_social ?? '',
        d.fecha_emision,
        (ESTADO_DTE_LABELS as Record<string, string>)[d.estado] ?? d.estado,
        d.monto_neto,
        d.monto_iva,
        d.monto_total,
      ]),
      [],
      ['', '', '', '', '', 'TOTALES', totalNeto, totalIva, totalTotal],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'DTEs')
    XLSX.writeFile(wb, `dte_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [filtrados, totalNeto, totalIva, totalTotal])

  async function anularDte(id: string) {
    if (!confirm('¿Anular este DTE? No se puede deshacer.')) return
    setAnulando(id)
    const res = await fetch('/api/sii/dte', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado: 'anulado' }),
    })
    setAnulando(null)
    if (res.ok) router.refresh()
  }

  const tiposPresentes = Array.from(new Set(dtes.map((d) => d.tipo_dte))).sort()

  return (
    <>
      {showImport && (
        <ImportCsvModal
          config={DTE_CONFIG(empresa_id)}
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); router.refresh() }}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Documentos Tributarios Electrónicos</h1>
            <p className="text-sm text-slate-500 mt-0.5">Registro de DTEs emitidos y recibidos.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportarExcel}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Excel
            </button>
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-sm font-medium rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar CSV
            </button>
            <Link href="/sii/dte/nuevo"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo DTE
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Neto total</p>
            <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(totalNeto)}</p>
            {filtrados.length < dtes.length && <p className="text-xs text-slate-400 mt-0.5">{filtrados.length} de {dtes.length} docs</p>}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">IVA total</p>
            <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(totalIva)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total bruto</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{formatCurrency(totalTotal)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por RUT, razón social o folio…"
            className="flex-1 min-w-48 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700">
            <option value="">Todos los tipos</option>
            {tiposPresentes.map((t) => (
              <option key={t} value={t}>{(TIPO_DTE_LABELS as Record<string, string>)[t] ?? t}</option>
            ))}
          </select>
          {(['todos', 'pendiente', 'aceptado', 'rechazado', 'anulado'] as EstadoFiltro[]).map((e) => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                filtroEstado === e ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}>
              {e === 'todos' ? 'Todos' : (ESTADO_DTE_LABELS as Record<string, string>)[e] ?? e}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filtrados.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 text-sm">
                {dtes.length === 0 ? 'Sin documentos registrados.' : 'Sin resultados para los filtros aplicados.'}
              </p>
              {dtes.length === 0 && (
                <div className="mt-3 flex justify-center gap-3">
                  <button onClick={() => setShowImport(true)} className="text-sm text-emerald-700 hover:underline">
                    Importar CSV del SII →
                  </button>
                  <span className="text-slate-300">|</span>
                  <Link href="/sii/dte/nuevo" className="text-sm text-emerald-700 hover:underline">
                    Registrar manualmente →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Folio</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Contraparte</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Neto</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">IVA</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500">Total</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((d) => (
                  <tr key={d.id} className={`hover:bg-slate-50 ${d.estado === 'anulado' ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-2.5 text-xs font-medium text-slate-700">{TIPO_DTE_LABELS[d.tipo_dte] ?? d.tipo_dte}</td>
                    <td className="px-4 py-2.5 text-slate-600">#{d.folio}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-slate-800 text-xs leading-tight">{d.razon_social ?? '—'}</p>
                      <p className="text-slate-400 text-xs">{d.rut_contraparte}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(d.fecha_emision)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        d.estado === 'aceptado'  ? 'bg-green-100 text-green-700'  :
                        d.estado === 'rechazado' ? 'bg-red-100 text-red-700'      :
                        d.estado === 'anulado'   ? 'bg-slate-100 text-slate-500'  :
                                                   'bg-amber-100 text-amber-700'
                      }`}>{ESTADO_DTE_LABELS[d.estado] ?? d.estado}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 text-xs">{formatCurrency(d.monto_neto)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 text-xs">{formatCurrency(d.monto_iva)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums font-medium text-slate-800">{formatCurrency(d.monto_total)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {d.estado !== 'anulado' && (
                        <button
                          onClick={() => anularDte(d.id)}
                          disabled={anulando === d.id}
                          className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                        >
                          {anulando === d.id ? '…' : 'Anular'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
