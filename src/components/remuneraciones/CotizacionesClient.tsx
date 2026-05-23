'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  empresa_id: string
  mesInicial: number
  anioInicial: number
}

interface LiquidacionCot {
  id: string
  trabajador_id: string
  estado: string
  total_imponible: number
  afp_monto: number
  afp_comision: number
  afp_sis: number
  cotizacion_afp_base: number
  isapre_monto: number
  seguro_cesantia: number
  aporte_scs: number
  aporte_mutualidad: number
  aporte_seguro_ces_emp: number
  trabajador: {
    nombre: string
    apellido_paterno: string
    rut: string
    afp: { nombre: string } | null
    isapre: { nombre: string } | null
    mutualidad: { nombre: string } | null
  } | null
}

interface Totales {
  total_afp: number
  total_afp_comision: number
  total_afp_sis: number
  total_isapre: number
  total_seg_ces_trab: number
  total_aporte_emp: number
  total_mutualidad: number
  total_seg_ces_emp: number
  total_scs: number
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function CotizacionesClient({ empresa_id, mesInicial, anioInicial }: Props) {
  const [mes, setMes] = useState(mesInicial)
  const [anio, setAnio] = useState(anioInicial)
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionCot[]>([])
  const [totales, setTotales] = useState<Totales | null>(null)
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    const res = await fetch(`/api/remuneraciones/cotizaciones?empresa_id=${empresa_id}&mes=${mes}&anio=${anio}`)
    if (res.ok) {
      const data = await res.json()
      setLiquidaciones(data.liquidaciones ?? [])
      setTotales(data.totales ?? null)
    }
    setCargando(false)
  }, [empresa_id, mes, anio])

  useEffect(() => { cargar() }, [cargar])

  const totalPagar = totales
    ? totales.total_afp + totales.total_isapre + totales.total_seg_ces_trab + totales.total_aporte_emp
    : 0

  return (
    <div className="space-y-4">
      {/* Selector período */}
      <div className="flex items-center gap-3">
        <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={anio} onChange={(e) => setAnio(parseInt(e.target.value))}
          min={2020} max={2100}
          className="w-28 text-sm border border-slate-200 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <button onClick={cargar}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          Actualizar
        </button>
        <button onClick={() => window.print()}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / Exportar
        </button>
      </div>

      {/* KPIs totales */}
      {totales && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">AFP (trabajadores)</p>
            <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(totales.total_afp)}</p>
            <div className="mt-1 space-y-0.5 text-xs text-slate-400">
              <p>Cotización: {formatCurrency(totales.total_afp - totales.total_afp_comision - totales.total_afp_sis)}</p>
              {totales.total_afp_comision > 0 && <p>Comisión: {formatCurrency(totales.total_afp_comision)}</p>}
              {totales.total_afp_sis > 0 && <p>SIS: {formatCurrency(totales.total_afp_sis)}</p>}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Salud (trabajadores)</p>
            <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(totales.total_isapre)}</p>
            <p className="text-xs text-slate-400 mt-1">Isapre / Fonasa 7%</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Seg. Cesantía (trab.)</p>
            <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(totales.total_seg_ces_trab)}</p>
            <p className="text-xs text-slate-400 mt-1">0.6% imponible</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Cargo empleador</p>
            <p className="text-xl font-bold text-blue-700 mt-1 tabular-nums">{formatCurrency(totales.total_aporte_emp)}</p>
            <div className="mt-1 space-y-0.5 text-xs text-blue-500">
              <p>Mut. {formatCurrency(totales.total_mutualidad)}</p>
              <p>SC emp. {formatCurrency(totales.total_seg_ces_emp)}</p>
              <p>SCS {formatCurrency(totales.total_scs)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Total a pagar */}
      {totales && totalPagar > 0 && (
        <div className="bg-emerald-700 text-white rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">Total a declarar y pagar en Previred</p>
            <p className="text-xs opacity-60 mt-0.5">AFP + Salud + Seg. cesantía trabajadores + Cargo empleador</p>
          </div>
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(totalPagar)}</p>
        </div>
      )}

      {/* Desglose por trabajador */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">
            Detalle por trabajador — {MESES[mes - 1]} {anio}
          </h3>
          <span className="text-xs text-slate-400">{liquidaciones.length} liquidaciones</span>
        </div>
        {cargando ? (
          <p className="text-center py-8 text-slate-400 text-sm">Cargando...</p>
        ) : liquidaciones.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-slate-400 text-sm">No hay liquidaciones para este período.</p>
            <p className="text-slate-300 text-xs">Genera las liquidaciones del mes antes de consultar el resumen de cotizaciones.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Trabajador</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">RUT</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">AFP</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Imponible</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">AFP tot.</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Comisión</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">SIS</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Salud</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Seg. Ces.</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Cargo emp.</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liquidaciones.map((l) => {
                  const cargoEmp = l.aporte_scs + l.aporte_mutualidad + l.aporte_seguro_ces_emp
                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5 text-slate-800 font-medium">
                        {l.trabajador ? `${l.trabajador.nombre} ${l.trabajador.apellido_paterno}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 tabular-nums">{l.trabajador?.rut ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{l.trabajador?.afp?.nombre ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatCurrency(l.total_imponible)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatCurrency(l.afp_monto)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                        {l.afp_comision > 0 ? formatCurrency(l.afp_comision) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                        {l.afp_sis > 0 ? formatCurrency(l.afp_sis) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatCurrency(l.isapre_monto)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatCurrency(l.seguro_cesantia)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-blue-600">{formatCurrency(cargoEmp)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          l.estado === 'pagada' ? 'bg-green-100 text-green-700' :
                          l.estado === 'aprobada' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {l.estado === 'borrador' ? 'Borrador' : l.estado === 'aprobada' ? 'Aprobada' : 'Pagada'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {totales && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-5 py-3 text-xs font-bold text-slate-700 col-span-3" colSpan={3}>TOTALES</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-800">{formatCurrency(liquidaciones.reduce((s,l) => s+l.total_imponible,0))}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-800">{formatCurrency(totales.total_afp)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-600">{formatCurrency(totales.total_afp_comision)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-600">{formatCurrency(totales.total_afp_sis)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-800">{formatCurrency(totales.total_isapre)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-800">{formatCurrency(totales.total_seg_ces_trab)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-blue-700">{formatCurrency(totales.total_aporte_emp)}</td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
