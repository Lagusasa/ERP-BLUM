'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import type { PagoHonorarios } from '@/services/remuneraciones.service'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  pagos: PagoHonorarios[]
  empresa_id: string
  empresa_razon_social: string
  empresa_rut: string
  anio: number
  retencion_default: number
}

const estadoColor: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  pagado:    'bg-green-100 text-green-700',
  anulado:   'bg-red-100 text-red-700',
}

export default function LibroHonorariosClient({
  pagos, empresa_id, empresa_razon_social, empresa_rut, anio, retencion_default,
}: Props) {
  const router = useRouter()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [procesando, setProcesando]   = useState<string | null>(null)

  // Form state
  const [rut, setRut]           = useState('')
  const [nombre, setNombre]     = useState('')
  const [fecha, setFecha]       = useState(new Date().toISOString().split('T')[0])
  const [concepto, setConcepto] = useState('')
  const [nBoleta, setNBoleta]   = useState('')
  const [monto, setMonto]       = useState('')
  const [retencion, setRetencion] = useState(String(Math.round(retencion_default * 100)))
  const [error, setError]       = useState<string | null>(null)

  const totalBruto    = pagos.reduce((s, p) => s + p.monto_bruto, 0)
  const totalRetencion = pagos.reduce((s, p) => s + p.retencion_monto, 0)
  const totalNeto     = pagos.reduce((s, p) => s + p.monto_neto, 0)

  async function guardar() {
    setError(null)
    if (!rut || !nombre || !fecha || !concepto || !monto) {
      setError('RUT, nombre, fecha, concepto y monto son obligatorios.')
      return
    }
    const montoN = parseFloat(monto)
    if (isNaN(montoN) || montoN <= 0) { setError('Monto inválido.'); return }
    setGuardando(true)
    try {
      const res = await fetch('/api/remuneraciones/honorarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id,
          rut_prestador: rut.trim(),
          nombre_prestador: nombre.trim(),
          fecha,
          concepto: concepto.trim(),
          n_boleta: nBoleta.trim() || null,
          monto_bruto: montoN,
          retencion_pct: parseFloat(retencion) / 100,
          estado: 'pendiente',
          referencia: null,
          trabajador_id: null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Error al guardar'); }
      setMostrarForm(false)
      setRut(''); setNombre(''); setConcepto(''); setNBoleta(''); setMonto('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(id: string, estado: 'pagado' | 'anulado') {
    const msg = estado === 'anulado' ? '¿Anular este pago de honorarios?' : '¿Marcar como pagado?'
    if (!confirm(msg)) return
    setProcesando(id)
    try {
      await fetch('/api/remuneraciones/honorarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado }),
      })
      router.refresh()
    } finally {
      setProcesando(null)
    }
  }

  const exportarExcel = useCallback(() => {
    const wb = XLSX.utils.book_new()
    const rows: (string | number)[][] = [
      [empresa_razon_social, '', `RUT: ${empresa_rut}`],
      [`LIBRO DE HONORARIOS — ${anio}`],
      [],
      ['N°', 'Fecha', 'RUT Prestador', 'Nombre', 'N° Boleta', 'Concepto', 'Monto Bruto', 'Retención %', 'Retención $', 'Monto Neto', 'Estado'],
      ...pagos.map((p, i) => [
        i+1, p.fecha, p.rut_prestador, p.nombre_prestador, p.n_boleta ?? '',
        p.concepto, p.monto_bruto, `${(p.retencion_pct * 100).toFixed(2)}%`,
        p.retencion_monto, p.monto_neto, p.estado.toUpperCase(),
      ]),
      ['TOTALES', '', '', '', '', '', totalBruto, '', totalRetencion, totalNeto, ''],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{wch:4},{wch:11},{wch:13},{wch:28},{wch:10},{wch:30},{wch:14},{wch:10},{wch:12},{wch:14},{wch:10}]
    XLSX.utils.book_append_sheet(wb, ws, 'Honorarios')
    XLSX.writeFile(wb, `libro-honorarios_${anio}.xlsx`)
  }, [pagos, empresa_razon_social, empresa_rut, anio, totalBruto, totalRetencion, totalNeto])

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Libro de Honorarios</h2>
          <p className="text-sm text-slate-500">{anio} — {pagos.length} registros · Retención por pagar: {formatCurrency(totalRetencion)}</p>
        </div>
        <div className="flex items-center gap-2">
          <form method="GET" className="flex items-center gap-2">
            <select name="anio" defaultValue={anio}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5">
              {[anio-1, anio, anio+1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="submit" className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg">Ver</button>
          </form>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            Imprimir
          </button>
          <button onClick={exportarExcel} disabled={pagos.length===0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Excel
          </button>
          <button onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Registrar Pago
          </button>
        </div>
      </div>

      {/* Formulario nuevo pago */}
      {mostrarForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 print:hidden">
          <h3 className="text-sm font-semibold text-slate-700">Registrar Pago de Honorarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">RUT Prestador *</label>
              <input value={rut} onChange={e=>setRut(e.target.value)} placeholder="12.345.678-9"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre Prestador *</label>
              <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Juan Pérez González"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha *</label>
              <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">N° Boleta</label>
              <input value={nBoleta} onChange={e=>setNBoleta(e.target.value)} placeholder="B-12345"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Monto Bruto ($) *</label>
              <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Concepto *</label>
              <input value={concepto} onChange={e=>setConcepto(e.target.value)} placeholder="Servicios de consultoría..."
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Retención %</label>
              <div className="flex items-center gap-1">
                <input type="number" value={retencion} onChange={e=>setRetencion(e.target.value)} step="0.01" min="0" max="100"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                <span className="text-sm text-slate-500">%</span>
              </div>
              {monto && <p className="text-xs text-slate-400 mt-0.5">
                Retención: {formatCurrency(Math.round(parseFloat(monto||'0') * parseFloat(retencion||'0') / 100))} ·
                Neto: {formatCurrency(Math.round(parseFloat(monto||'0') * (1 - parseFloat(retencion||'0') / 100)))}
              </p>}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setMostrarForm(false)}
              className="px-4 py-2 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={guardar} disabled={guardando}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {/* Encabezado print */}
      <div className="hidden print:block mb-3">
        <div className="flex justify-between border-b-2 border-black pb-2">
          <div>
            <p className="text-[12pt] font-bold uppercase">{empresa_razon_social}</p>
            <p className="text-[9pt]">RUT: {empresa_rut}</p>
          </div>
          <div className="text-right text-[9pt]">
            <p className="font-bold">LIBRO DE HONORARIOS</p>
            <p>Año {anio}</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden print:border-0">
        <table className="w-full text-sm print:text-[8pt]">
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 w-8">#</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500">RUT</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500">Nombre Prestador</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 hidden md:table-cell">N° Boleta</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 hidden lg:table-cell">Concepto</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Bruto</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Ret.%</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Retención</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Neto</th>
              <th className="text-center px-3 py-2.5 text-xs font-medium text-slate-500 print:hidden">Estado</th>
              <th className="px-3 py-2.5 print:hidden" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagos.length === 0 ? (
              <tr><td colSpan={12} className="text-center py-10 text-slate-400">No hay pagos de honorarios en {anio}.</td></tr>
            ) : pagos.map((p, i) => (
              <tr key={p.id} className="hover:bg-slate-50 print:hover:bg-white">
                <td className="px-3 py-2 text-slate-400 text-xs">{i+1}</td>
                <td className="px-3 py-2 text-slate-600 text-xs">{formatDate(p.fecha)}</td>
                <td className="px-3 py-2 font-mono text-slate-700 text-xs">{p.rut_prestador}</td>
                <td className="px-3 py-2 font-medium text-slate-800">{p.nombre_prestador}</td>
                <td className="px-3 py-2 text-slate-500 text-xs hidden md:table-cell">{p.n_boleta ?? '—'}</td>
                <td className="px-3 py-2 text-slate-500 text-xs hidden lg:table-cell max-w-xs truncate">{p.concepto}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(p.monto_bruto)}</td>
                <td className="px-3 py-2 text-right text-xs text-slate-500">{(p.retencion_pct * 100).toFixed(2)}%</td>
                <td className="px-3 py-2 text-right tabular-nums text-red-600">{formatCurrency(p.retencion_monto)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-700">{formatCurrency(p.monto_neto)}</td>
                <td className="px-3 py-2 text-center print:hidden">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[p.estado]}`}>
                    {p.estado}
                  </span>
                </td>
                <td className="px-2 py-2 print:hidden">
                  <div className="flex gap-1">
                    {p.estado === 'pendiente' && (
                      <button onClick={() => cambiarEstado(p.id, 'pagado')} disabled={procesando === p.id}
                        className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 hover:bg-green-100 rounded disabled:opacity-50">
                        Pagar
                      </button>
                    )}
                    {p.estado !== 'anulado' && (
                      <button onClick={() => cambiarEstado(p.id, 'anulado')} disabled={procesando === p.id}
                        className="text-xs px-1.5 py-0.5 bg-red-50 text-red-700 hover:bg-red-100 rounded disabled:opacity-50">
                        Anular
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {pagos.length > 0 && (
            <tfoot className="border-t-2 border-slate-300 bg-slate-50 print:bg-white">
              <tr className="font-bold">
                <td colSpan={6} className="px-3 py-2 text-xs text-slate-600">TOTALES ({pagos.length})</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(totalBruto)}</td>
                <td />
                <td className="px-3 py-2 text-right tabular-nums text-red-700">{formatCurrency(totalRetencion)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(totalNeto)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
