'use client'

import { useState, useEffect } from 'react'

interface LiquidacionResumen {
  rut_trabajador: string
  nombre_trabajador: string
  cargo: string | null
  total_imponible: number
  afp_trabajador: number
  salud_trabajador: number
  cesantia_trabajador: number
  afp_empleador: number
  salud_empleador: number
  cesantia_empleador: number
  sueldo_liquido: number
  mes: number
  anio: number
}

interface Empresa { id: string; razon_social: string; rut?: string }

interface Props {
  empresa_id: string
  empresa: Empresa
}

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function CertificadosCotizacionesClient({ empresa_id, empresa }: Props) {
  const anioActual = new Date().getFullYear()
  const mesActual = new Date().getMonth() + 1
  const [anio, setAnio] = useState(anioActual)
  const [mes, setMes] = useState(mesActual)
  const [modo, setModo] = useState<'certificado' | 'planilla_dt'>('certificado')
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionResumen[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    setCargando(true)
    fetch(`/api/remuneraciones/liquidaciones?empresa_id=${empresa_id}&anio=${anio}&mes=${mes}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setLiquidaciones(d.data ?? []) })
      .catch(() => setLiquidaciones([]))
      .finally(() => setCargando(false))
  }, [empresa_id, anio, mes])

  const totalImponible = liquidaciones.reduce((s, l) => s + l.total_imponible, 0)
  const totalAfpTrab   = liquidaciones.reduce((s, l) => s + l.afp_trabajador, 0)
  const totalSaludTrab = liquidaciones.reduce((s, l) => s + l.salud_trabajador, 0)
  const totalCesaTrab  = liquidaciones.reduce((s, l) => s + l.cesantia_trabajador, 0)
  const totalAfpEmp    = liquidaciones.reduce((s, l) => s + l.afp_empleador, 0)
  const totalSaludEmp  = liquidaciones.reduce((s, l) => s + l.salud_empleador, 0)
  const totalCesaEmp   = liquidaciones.reduce((s, l) => s + l.cesantia_empleador, 0)
  const totalLiquido   = liquidaciones.reduce((s, l) => s + l.sueldo_liquido, 0)

  return (
    <div className="space-y-4">
      {/* Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Tipo de reporte</label>
            <div className="flex gap-2">
              <button onClick={() => setModo('certificado')}
                className={`px-3 py-2 text-xs rounded-lg border flex-1 ${modo === 'certificado' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                Certificado
              </button>
              <button onClick={() => setModo('planilla_dt')}
                className={`px-3 py-2 text-xs rounded-lg border flex-1 ${modo === 'planilla_dt' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                Planilla DT
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Año</label>
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {[anioActual, anioActual - 1, anioActual - 2].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Mes</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-end col-span-2">
            <button onClick={() => window.print()}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 w-full">
              Imprimir / PDF
            </button>
          </div>
        </div>
      </div>

      {cargando && <p className="text-sm text-slate-400 text-center py-4">Cargando…</p>}

      {!cargando && liquidaciones.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">
          Sin liquidaciones para {MESES[mes - 1]} {anio}.
        </div>
      )}

      {!cargando && liquidaciones.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6 print:border-0 print:p-4">
          {/* Encabezado */}
          <div className="text-center border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 uppercase">
              {modo === 'certificado' ? 'CERTIFICADO DE COTIZACIONES PREVISIONALES' : 'PLANILLA DE REMUNERACIONES — DIRECCIÓN DEL TRABAJO'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {modo === 'certificado' ? 'Art. 19 D.L. 3.500 / Art. 38 bis D.L. 3.500' : 'Art. 52 Código del Trabajo'}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-left">
              <div><span className="text-xs text-slate-400 block">Empresa</span><span className="font-semibold">{empresa.razon_social}</span></div>
              <div><span className="text-xs text-slate-400 block">RUT</span><span className="font-semibold">{empresa.rut ?? '—'}</span></div>
              <div><span className="text-xs text-slate-400 block">Período</span><span className="font-semibold">{MESES[mes - 1]} {anio}</span></div>
            </div>
          </div>

          {/* CERTIFICADO DE COTIZACIONES */}
          {modo === 'certificado' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">RUT</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">Trabajador</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-600">Imponible</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-600">AFP</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-600">Salud</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-600">AFC</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-600">AFP emp.</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-600">Salud emp.</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-600">AFC emp.</th>
                </tr>
              </thead>
              <tbody>
                {liquidaciones.map((l) => (
                  <tr key={l.rut_trabajador} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs">{l.rut_trabajador}</td>
                    <td className="px-3 py-2 text-xs">{l.nombre_trabajador}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">{CLP(l.total_imponible)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">{CLP(l.afp_trabajador)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">{CLP(l.salud_trabajador)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">{CLP(l.cesantia_trabajador)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">{CLP(l.afp_empleador)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">{CLP(l.salud_empleador)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">{CLP(l.cesantia_empleador)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                  <td colSpan={2} className="px-3 py-2.5">TOTAL ({liquidaciones.length} trabajadores)</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{CLP(totalImponible)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{CLP(totalAfpTrab)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{CLP(totalSaludTrab)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{CLP(totalCesaTrab)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{CLP(totalAfpEmp)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{CLP(totalSaludEmp)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{CLP(totalCesaEmp)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* PLANILLA DT */}
          {modo === 'planilla_dt' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">N°</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">RUT</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">Nombre completo</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">Cargo</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-600">Rem. imponible</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-600">Descuentos</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-600">Líquido</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-600">Firma</th>
                </tr>
              </thead>
              <tbody>
                {liquidaciones.map((l, i) => (
                  <tr key={l.rut_trabajador} className="border-b border-slate-100">
                    <td className="px-3 py-3 text-xs text-slate-500">{i + 1}</td>
                    <td className="px-3 py-3 font-mono text-xs">{l.rut_trabajador}</td>
                    <td className="px-3 py-3 text-xs">{l.nombre_trabajador}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{l.cargo ?? '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs">{CLP(l.total_imponible)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-xs">{CLP(l.afp_trabajador + l.salud_trabajador + l.cesantia_trabajador)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-xs">{CLP(l.sueldo_liquido)}</td>
                    <td className="px-3 py-3 w-24 border-b border-slate-300 print:border-b print:h-8"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                  <td colSpan={4} className="px-3 py-2.5">TOTAL</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{CLP(totalImponible)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{CLP(totalAfpTrab + totalSaludTrab + totalCesaTrab)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{CLP(totalLiquido)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}

          {/* Firma */}
          <div className="pt-6 grid grid-cols-3 gap-8 text-center text-xs text-slate-500">
            <div><div className="border-t border-slate-400 pt-2">Representante Legal</div></div>
            <div><div className="border-t border-slate-400 pt-2">Contador / Profesional</div></div>
            <div><div className="border-t border-slate-400 pt-2">Fecha y Timbre</div></div>
          </div>
        </div>
      )}
    </div>
  )
}
