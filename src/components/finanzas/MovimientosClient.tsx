'use client'

import { useState, useMemo, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { CATEGORIA_LABELS, TIPO_CUENTA_LABELS } from '@/types/finanzas.types'
import type { MovimientoCaja, CuentaBancaria } from '@/types/finanzas.types'

interface Props {
  movimientos: MovimientoCaja[]
  cuentas: CuentaBancaria[]
}

type FiltroTipo = 'todos' | 'ingreso' | 'egreso'

export default function MovimientosClient({ movimientos, cuentas }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [filtroCuenta, setFiltroCuenta] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const filtrados = useMemo(() => {
    const t = busqueda.toLowerCase()
    return movimientos.filter((m) => {
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false
      if (filtroCuenta && m.cuenta_id !== filtroCuenta) return false
      if (filtroCategoria && m.categoria !== filtroCategoria) return false
      if (t && !m.descripcion.toLowerCase().includes(t) && !(m.referencia ?? '').toLowerCase().includes(t)) return false
      return true
    })
  }, [movimientos, busqueda, filtroTipo, filtroCuenta, filtroCategoria])

  const totalIngresos = filtrados.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const totalEgresos  = filtrados.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const flujoNeto     = totalIngresos - totalEgresos

  const categoriasPresentes = useMemo(() => {
    const cats = new Set(movimientos.map((m) => m.categoria))
    return [...cats].sort()
  }, [movimientos])

  const exportarExcel = useCallback(() => {
    const rows = [
      ['Historial de Movimientos de Caja'],
      [],
      ['Fecha', 'Cuenta', 'Tipo', 'Categoría', 'Descripción', 'Referencia', 'Monto', 'Conciliado'],
      ...filtrados.map((m) => [
        m.fecha,
        m.cuenta?.banco ?? '—',
        m.tipo,
        CATEGORIA_LABELS[m.categoria] ?? m.categoria,
        m.descripcion,
        m.referencia ?? '',
        m.tipo === 'ingreso' ? m.monto : -m.monto,
        m.conciliado ? 'Sí' : 'No',
      ]),
      [],
      ['', '', '', '', '', 'INGRESOS', totalIngresos, ''],
      ['', '', '', '', '', 'EGRESOS', totalEgresos, ''],
      ['', '', '', '', '', 'FLUJO NETO', flujoNeto, ''],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 22 }, { wch: 35 }, { wch: 20 }, { wch: 14 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
    XLSX.writeFile(wb, `movimientos_caja.xlsx`)
  }, [filtrados, totalIngresos, totalEgresos, flujoNeto])

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Buscar descripción..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          {(['todos', 'ingreso', 'egreso'] as FiltroTipo[]).map((t) => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={cn('px-3 py-1.5 transition-colors', filtroTipo === t ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
              {t === 'todos' ? 'Todos' : t === 'ingreso' ? 'Ingresos' : 'Egresos'}
            </button>
          ))}
        </div>

        {cuentas.length > 0 && (
          <select value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700">
            <option value="">Todas las cuentas</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>{c.banco} · {c.numero_cuenta}</option>
            ))}
          </select>
        )}

        {categoriasPresentes.length > 0 && (
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700">
            <option value="">Todas las categorías</option>
            {categoriasPresentes.map((c) => (
              <option key={c} value={c}>{CATEGORIA_LABELS[c] ?? c}</option>
            ))}
          </select>
        )}

        <button onClick={exportarExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg ml-auto">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel
        </button>
      </div>

      {/* KPIs filtrados */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-xs text-green-700 font-medium">Ingresos</p>
          <p className="text-lg font-bold text-green-800 tabular-nums mt-0.5">{formatCurrency(totalIngresos)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-xs text-red-700 font-medium">Egresos</p>
          <p className="text-lg font-bold text-red-800 tabular-nums mt-0.5">{formatCurrency(totalEgresos)}</p>
        </div>
        <div className={cn('border rounded-xl px-4 py-3', flujoNeto >= 0 ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200')}>
          <p className="text-xs text-slate-600 font-medium">Flujo Neto</p>
          <p className={cn('text-lg font-bold tabular-nums mt-0.5', flujoNeto >= 0 ? 'text-slate-800' : 'text-red-700')}>
            {formatCurrency(flujoNeto)}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            Movimientos <span className="text-slate-400 font-normal">({filtrados.length})</span>
          </h3>
        </div>
        {filtrados.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">No hay movimientos que coincidan con los filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Descripción</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Cuenta</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Categoría</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Concil.</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(m.fecha)}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-sm text-slate-800">{m.descripcion}</p>
                      {m.referencia && <p className="text-xs text-slate-400 mt-0.5">{m.referencia}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {m.cuenta?.banco ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {CATEGORIA_LABELS[m.categoria] ?? m.categoria}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {m.conciliado
                        ? <span className="text-emerald-600 text-xs font-medium">✓</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className={cn('px-5 py-2.5 text-right font-medium tabular-nums', m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600')}>
                      {m.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(m.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={5} className="px-5 py-2.5 text-xs font-semibold text-slate-600 text-right">
                    Flujo neto ({filtrados.length} movimientos):
                  </td>
                  <td className={cn('px-5 py-2.5 text-right font-bold tabular-nums', flujoNeto >= 0 ? 'text-green-700' : 'text-red-700')}>
                    {flujoNeto >= 0 ? '+' : ''}{formatCurrency(flujoNeto)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
