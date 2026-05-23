'use client'

import { useState, useEffect } from 'react'
import type { BoletaHonorarios } from '@/types/sii.types'

interface Props {
  empresa_id: string
  boletas: BoletaHonorarios[]
}

interface LineaDJ1879 {
  rut_prestador: string
  nombre_prestador: string
  monto_bruto: number
  retencion: number
  monto_liquido: number
  n_boletas: number
}

interface LineaDJ1887 {
  rut: string
  nombre: string
  total_remuneraciones: number
  total_retenciones_segunda: number
  total_cotizaciones: number
  n_liquidaciones: number
}

interface LineaDJ1886 {
  rut: string
  nombre: string
  monto_pagado: number
  retencion: number
  tipo: 'honorarios' | 'segunda_categoria'
}

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

export default function DeclaracionesJuradasClient({ empresa_id, boletas }: Props) {
  const anioActual = new Date().getFullYear()
  const [anio, setAnio] = useState(anioActual - 1)  // DJ se presenta por año anterior
  const [dj, setDj] = useState<'1879' | '1887' | '1886'>('1879')
  const [liquidaciones, setLiquidaciones] = useState<LineaDJ1887[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (dj === '1887') {
      setCargando(true)
      fetch(`/api/remuneraciones/liquidaciones?empresa_id=${empresa_id}&anio=${anio}`)
        .then((r) => r.json())
        .then((d) => {
          if (!d.ok) return
          // Agrupar por trabajador
          const mapa = new Map<string, LineaDJ1887>()
          for (const liq of d.data ?? []) {
            const key = liq.rut_trabajador
            const curr = mapa.get(key) ?? {
              rut: liq.rut_trabajador,
              nombre: liq.nombre_trabajador,
              total_remuneraciones: 0,
              total_retenciones_segunda: 0,
              total_cotizaciones: 0,
              n_liquidaciones: 0,
            }
            mapa.set(key, {
              ...curr,
              total_remuneraciones: curr.total_remuneraciones + (liq.total_imponible ?? 0),
              total_retenciones_segunda: curr.total_retenciones_segunda + (liq.impuesto_segunda_categoria ?? 0),
              total_cotizaciones: curr.total_cotizaciones + (liq.total_descuentos ?? 0),
              n_liquidaciones: curr.n_liquidaciones + 1,
            })
          }
          setLiquidaciones(Array.from(mapa.values()))
        })
        .finally(() => setCargando(false))
    }
  }, [empresa_id, anio, dj])

  // DJ 1879 — Honorarios recibidos (retención sobre terceros)
  const boletasAnio = boletas.filter((b) => {
    return b.estado === 'vigente' && b.tipo === 'recibida' && new Date(b.fecha).getFullYear() === anio
  })
  const lineas1879 = boletasAnio.reduce((mapa, b) => {
    const curr = mapa.get(b.rut_prestador) ?? {
      rut_prestador: b.rut_prestador,
      nombre_prestador: b.nombre_prestador,
      monto_bruto: 0,
      retencion: 0,
      monto_liquido: 0,
      n_boletas: 0,
    }
    mapa.set(b.rut_prestador, {
      ...curr,
      monto_bruto: curr.monto_bruto + b.monto_bruto,
      retencion: curr.retencion + b.retencion_10,
      monto_liquido: curr.monto_liquido + b.monto_liquido,
      n_boletas: curr.n_boletas + 1,
    })
    return mapa
  }, new Map<string, LineaDJ1879>())
  const filas1879 = Array.from(lineas1879.values())

  // DJ 1886 — Retenciones (consolida honorarios + segunda categoría)
  const filas1886: LineaDJ1886[] = [
    ...filas1879.map((f) => ({
      rut: f.rut_prestador, nombre: f.nombre_prestador,
      monto_pagado: f.monto_bruto, retencion: f.retencion,
      tipo: 'honorarios' as const,
    })),
    ...liquidaciones.filter((l) => l.total_retenciones_segunda > 0).map((l) => ({
      rut: l.rut, nombre: l.nombre,
      monto_pagado: l.total_remuneraciones, retencion: l.total_retenciones_segunda,
      tipo: 'segunda_categoria' as const,
    })),
  ]

  const DJ_INFO = {
    '1879': { titulo: 'DJ 1879 — Honorarios y Retenciones a Terceros', desc: 'Informa honorarios pagados a personas naturales con retención 10.75% (año 2024+). Una línea por prestador.' },
    '1887': { titulo: 'DJ 1887 — Rentas del Art. 42 N°1 (Remuneraciones)', desc: 'Informa remuneraciones pagadas a trabajadores dependientes y retenciones de segunda categoría.' },
    '1886': { titulo: 'DJ 1886 — Retenciones del Art. 74 LIR', desc: 'Consolida retenciones de segunda categoría y honorarios. Una línea por beneficiario.' },
  }

  return (
    <div className="space-y-5">
      {/* Selector DJ + año */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-slate-500 block mb-1">Declaración Jurada</label>
            <div className="flex gap-2">
              {(['1879', '1887', '1886'] as const).map((d) => (
                <button key={d} onClick={() => setDj(d)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors flex-1 ${dj === d ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  DJ {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Año tributario</label>
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {[anioActual - 1, anioActual - 2, anioActual - 3].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => window.print()}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              Imprimir / PDF
            </button>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">{DJ_INFO[dj].titulo}</p>
          <p className="text-xs text-slate-500 mt-1">{DJ_INFO[dj].desc}</p>
        </div>
      </div>

      {/* DJ 1879 */}
      {dj === '1879' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">DJ 1879 — Detalle prestadores {anio}</h2>
            <span className="text-xs text-slate-400">{filas1879.length} prestadores</span>
          </div>
          {filas1879.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">Sin boletas de honorarios recibidas en {anio}.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">RUT Prestador</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Nombre</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">N° Boletas</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Monto bruto</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Retención</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Monto líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas1879.map((f) => (
                  <tr key={f.rut_prestador} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-700">{f.rut_prestador}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-700">{f.nombre_prestador}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">{f.n_boletas}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{CLP(f.monto_bruto)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-orange-600">{CLP(f.retencion)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">{CLP(f.monto_liquido)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-5 py-2.5 font-bold text-slate-800">TOTAL</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-800">{CLP(filas1879.reduce((s, f) => s + f.monto_bruto, 0))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-orange-700">{CLP(filas1879.reduce((s, f) => s + f.retencion, 0))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-800">{CLP(filas1879.reduce((s, f) => s + f.monto_liquido, 0))}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* DJ 1887 */}
      {dj === '1887' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">DJ 1887 — Remuneraciones {anio}</h2>
            <span className="text-xs text-slate-400">{cargando ? 'Cargando…' : `${liquidaciones.length} trabajadores`}</span>
          </div>
          {liquidaciones.length === 0 && !cargando ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">Sin liquidaciones en {anio}.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">RUT</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Nombre</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Meses</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total remuneraciones</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Retención 2ª cat.</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Cotizaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liquidaciones.map((l) => (
                  <tr key={l.rut} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-700">{l.rut}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-700">{l.nombre}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">{l.n_liquidaciones}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{CLP(l.total_remuneraciones)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-orange-600">{CLP(l.total_retenciones_segunda)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{CLP(l.total_cotizaciones)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-5 py-2.5 font-bold text-slate-800">TOTAL</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-800">{CLP(liquidaciones.reduce((s, l) => s + l.total_remuneraciones, 0))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-orange-700">{CLP(liquidaciones.reduce((s, l) => s + l.total_retenciones_segunda, 0))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-800">{CLP(liquidaciones.reduce((s, l) => s + l.total_cotizaciones, 0))}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* DJ 1886 */}
      {dj === '1886' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">DJ 1886 — Retenciones {anio}</h2>
            <span className="text-xs text-slate-400">{filas1886.length} beneficiarios</span>
          </div>
          {filas1886.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">Sin retenciones en {anio}.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">RUT</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Nombre</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Monto pagado</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Retención</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas1886.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-700">{f.rut}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-700">{f.nombre}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${f.tipo === 'honorarios' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {f.tipo === 'honorarios' ? 'Honorarios' : '2ª Categoría'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{CLP(f.monto_pagado)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-orange-600">{CLP(f.retencion)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-5 py-2.5 font-bold text-slate-800">TOTAL RETENCIONES A ENTERAR</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-800">{CLP(filas1886.reduce((s, f) => s + f.monto_pagado, 0))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-orange-700">{CLP(filas1886.reduce((s, f) => s + f.retencion, 0))}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
