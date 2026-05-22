'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import type { Liquidacion } from '@/types/remuneraciones.types'
import { formatCurrency } from '@/lib/utils'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface Props {
  liquidaciones: Liquidacion[]
  empresa_razon_social: string
  empresa_rut: string
  mes: number
  anio: number
}

export default function LibroRemuneracionesClient({
  liquidaciones, empresa_razon_social, empresa_rut, mes, anio,
}: Props) {
  const router = useRouter()

  const totalBruto      = liquidaciones.reduce((s, l) => s + l.total_imponible + l.total_no_imponible, 0)
  const totalImponible  = liquidaciones.reduce((s, l) => s + l.total_imponible, 0)
  const totalAfp        = liquidaciones.reduce((s, l) => s + l.afp_monto, 0)
  const totalSalud      = liquidaciones.reduce((s, l) => s + l.isapre_monto, 0)
  const totalCesantia   = liquidaciones.reduce((s, l) => s + l.seguro_cesantia, 0)
  const totalImpuesto   = liquidaciones.reduce((s, l) => s + l.impuesto_2da_cat, 0)
  const totalDescuentos = liquidaciones.reduce((s, l) => s + l.total_descuentos, 0)
  const totalLiquido    = liquidaciones.reduce((s, l) => s + l.sueldo_liquido, 0)
  const totalAportes    = liquidaciones.reduce((s, l) => s + l.aporte_scs + l.aporte_mutualidad + l.aporte_seguro_ces_emp, 0)

  const exportarExcel = useCallback(() => {
    const wb = XLSX.utils.book_new()
    const rows: (string | number)[][] = []
    rows.push([empresa_razon_social, '', `RUT: ${empresa_rut}`])
    rows.push([`LIBRO DE REMUNERACIONES — ${MESES[mes - 1]} ${anio}`])
    rows.push([])
    rows.push([
      'N°','RUT','Apellidos y Nombre','Días','Sueldo Base','H. Extra','Gratif.',
      'Otros Imp.','Total Imponible','Movil.','Colac.','Viáticos','Total No Imp.',
      'Total Bruto','AFP','Salud','Seg.Ces.','Imp. 2ª Cat.','Otros Desc.',
      'Total Desc.','Sueldo Líquido','Ap. Patronal',
    ])
    liquidaciones.forEach((l, i) => {
      const nom = `${l.trabajador?.apellido_paterno ?? ''} ${l.trabajador?.nombre ?? ''}`.trim()
      rows.push([
        i + 1, l.trabajador?.rut ?? '', nom, l.dias_trabajados,
        l.sueldo_base, l.monto_horas_extra, l.gratificacion, l.otros_haberes_impon, l.total_imponible,
        l.asig_movilizacion, l.asig_colacion, l.viaticos, l.total_no_imponible,
        l.total_imponible + l.total_no_imponible,
        l.afp_monto, l.isapre_monto, l.seguro_cesantia, l.impuesto_2da_cat, l.otros_descuentos,
        l.total_descuentos, l.sueldo_liquido,
        l.aporte_scs + l.aporte_mutualidad + l.aporte_seguro_ces_emp,
      ])
    })
    rows.push([
      'TOTALES', '', '', '',
      liquidaciones.reduce((s,l)=>s+l.sueldo_base,0),
      liquidaciones.reduce((s,l)=>s+l.monto_horas_extra,0),
      liquidaciones.reduce((s,l)=>s+l.gratificacion,0),
      liquidaciones.reduce((s,l)=>s+l.otros_haberes_impon,0),
      totalImponible,
      liquidaciones.reduce((s,l)=>s+l.asig_movilizacion,0),
      liquidaciones.reduce((s,l)=>s+l.asig_colacion,0),
      liquidaciones.reduce((s,l)=>s+l.viaticos,0),
      liquidaciones.reduce((s,l)=>s+l.total_no_imponible,0),
      totalBruto, totalAfp, totalSalud, totalCesantia, totalImpuesto,
      liquidaciones.reduce((s,l)=>s+l.otros_descuentos,0),
      totalDescuentos, totalLiquido, totalAportes,
    ])
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [
      {wch:4},{wch:13},{wch:28},{wch:5},{wch:12},{wch:10},{wch:10},{wch:10},
      {wch:14},{wch:10},{wch:8},{wch:8},{wch:13},{wch:13},
      {wch:12},{wch:10},{wch:10},{wch:12},{wch:10},{wch:12},{wch:14},{wch:13},
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'Libro Rem.')
    XLSX.writeFile(wb, `libro-remuneraciones_${mes}-${anio}.xlsx`)
  }, [liquidaciones, empresa_razon_social, empresa_rut, mes, anio, totalBruto, totalImponible, totalAfp, totalSalud, totalCesantia, totalImpuesto, totalDescuentos, totalLiquido, totalAportes])

  return (
    <div className="space-y-4">
      {/* Encabezado pantalla */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Libro de Remuneraciones</h2>
          <p className="text-sm text-slate-500">{MESES[mes-1]} {anio} — {liquidaciones.length} trabajadores</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Selector mes/año */}
          <form method="GET" className="flex items-center gap-2">
            <select name="mes" defaultValue={mes}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {MESES.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select name="anio" defaultValue={anio}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
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
          <button onClick={exportarExcel} disabled={liquidaciones.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg disabled:opacity-40">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Excel
          </button>
        </div>
      </div>

      {/* Encabezado print */}
      <div className="hidden print:block mb-3">
        <div className="flex justify-between border-b-2 border-black pb-2">
          <div>
            <p className="text-[12pt] font-bold uppercase">{empresa_razon_social}</p>
            <p className="text-[9pt]">RUT: {empresa_rut}</p>
          </div>
          <div className="text-right text-[9pt]">
            <p className="font-bold">LIBRO DE REMUNERACIONES</p>
            <p>{MESES[mes-1]} {anio}</p>
          </div>
        </div>
      </div>

      {liquidaciones.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400">
          No hay liquidaciones aprobadas para {MESES[mes-1]} {anio}.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden print:border-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs print:text-[7pt]">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="text-left px-2 py-2 font-medium text-slate-500 w-7">#</th>
                  <th className="text-left px-2 py-2 font-medium text-slate-500 w-24">RUT</th>
                  <th className="text-left px-2 py-2 font-medium text-slate-500">Nombre</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500 w-8">Días</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500">S. Base</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500">Total Imp.</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500">No Imp.</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500 bg-blue-50 print:bg-white">Total Bruto</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500">AFP</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500">Salud</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500">Seg.Ces.</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500">Imp.2ª</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500">Total Desc.</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500 bg-green-50 print:bg-white">Líquido</th>
                  <th className="text-right px-2 py-2 font-medium text-slate-500">Ap. Patronal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liquidaciones.map((l, i) => {
                  const bruto = l.total_imponible + l.total_no_imponible
                  const aportes = l.aporte_scs + l.aporte_mutualidad + l.aporte_seguro_ces_emp
                  return (
                    <tr key={l.id} className="hover:bg-slate-50 print:hover:bg-white">
                      <td className="px-2 py-1.5 text-slate-400">{i+1}</td>
                      <td className="px-2 py-1.5 font-mono text-slate-600">{l.trabajador?.rut}</td>
                      <td className="px-2 py-1.5 font-medium text-slate-800">
                        {l.trabajador?.apellido_paterno} {l.trabajador?.nombre}
                      </td>
                      <td className="px-2 py-1.5 text-right text-slate-600">{l.dias_trabajados}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{formatCurrency(l.sueldo_base)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{formatCurrency(l.total_imponible)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">{formatCurrency(l.total_no_imponible)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-semibold bg-blue-50/50 print:bg-white">{formatCurrency(bruto)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-red-600">{formatCurrency(l.afp_monto)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-red-600">{formatCurrency(l.isapre_monto)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-red-600">{formatCurrency(l.seguro_cesantia)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-red-600">{formatCurrency(l.impuesto_2da_cat)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-red-700">{formatCurrency(l.total_descuentos)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold text-emerald-700 bg-green-50/50 print:bg-white">{formatCurrency(l.sueldo_liquido)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">{formatCurrency(aportes)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 print:bg-white">
                <tr className="font-bold">
                  <td colSpan={4} className="px-2 py-2 text-xs text-slate-600">TOTALES ({liquidaciones.length})</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(liquidaciones.reduce((s,l)=>s+l.sueldo_base,0))}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(totalImponible)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(liquidaciones.reduce((s,l)=>s+l.total_no_imponible,0))}</td>
                  <td className="px-2 py-2 text-right tabular-nums bg-blue-50/50 print:bg-white">{formatCurrency(totalBruto)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-red-700">{formatCurrency(totalAfp)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-red-700">{formatCurrency(totalSalud)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-red-700">{formatCurrency(totalCesantia)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-red-700">{formatCurrency(totalImpuesto)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-red-700">{formatCurrency(totalDescuentos)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-emerald-700 bg-green-50/50 print:bg-white">{formatCurrency(totalLiquido)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(totalAportes)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="hidden print:block mt-4 text-center text-[8pt] text-gray-400 border-t border-gray-300 pt-1">
        Libro de Remuneraciones — {empresa_razon_social} — {MESES[mes-1]} {anio}
      </div>
    </div>
  )
}
