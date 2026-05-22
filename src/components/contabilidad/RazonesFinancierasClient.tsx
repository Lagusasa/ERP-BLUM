'use client'

import type { RazonesFinancierasData } from '@/types/reportes.types'

const USD = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function fmt(v: number | null, suffix = '') {
  if (v === null) return <span className="text-slate-300">N/D</span>
  return <>{v.toLocaleString('es-CL', { maximumFractionDigits: 2 })}{suffix}</>
}

type Estado = 'bueno' | 'regular' | 'malo' | 'neutro'

interface Ratio {
  nombre: string
  valor: number | null
  descripcion: string
  categoria: string
  estado: Estado
  suffix?: string
}

function estadoClase(e: Estado) {
  return e === 'bueno' ? 'border-emerald-200 bg-emerald-50' :
         e === 'regular' ? 'border-amber-200 bg-amber-50' :
         e === 'malo' ? 'border-red-200 bg-red-50' :
         'border-slate-200 bg-white'
}

function valorClase(e: Estado) {
  return e === 'bueno' ? 'text-emerald-700' :
         e === 'regular' ? 'text-amber-700' :
         e === 'malo' ? 'text-red-700' :
         'text-slate-700'
}

function buildRatios(d: RazonesFinancierasData): Ratio[] {
  const liq = d.liquidez_corriente
  const pa = d.prueba_acida
  const end = d.endeudamiento
  const roa = d.roa
  const roe = d.roe
  const mb = d.margen_bruto
  const mn = d.margen_neto

  return [
    {
      nombre: 'Liquidez corriente',
      valor: liq,
      descripcion: 'Activo corriente / Pasivo corriente. Óptimo ≥ 1.5',
      categoria: 'Liquidez',
      estado: liq === null ? 'neutro' : liq >= 1.5 ? 'bueno' : liq >= 1 ? 'regular' : 'malo',
    },
    {
      nombre: 'Prueba ácida',
      valor: pa,
      descripcion: '(Activo corriente − Inventarios) / Pasivo corriente. Óptimo ≥ 1',
      categoria: 'Liquidez',
      estado: pa === null ? 'neutro' : pa >= 1 ? 'bueno' : pa >= 0.7 ? 'regular' : 'malo',
    },
    {
      nombre: 'Endeudamiento',
      valor: end,
      descripcion: 'Pasivo total / Activo total. Menor es mejor (< 50%)',
      categoria: 'Endeudamiento',
      estado: end === null ? 'neutro' : end <= 40 ? 'bueno' : end <= 60 ? 'regular' : 'malo',
      suffix: '%',
    },
    {
      nombre: 'Pasivo / Patrimonio',
      valor: d.endeudamiento_patrimonio,
      descripcion: 'Nivel de apalancamiento financiero. Óptimo < 1',
      categoria: 'Endeudamiento',
      estado: d.endeudamiento_patrimonio === null ? 'neutro' : d.endeudamiento_patrimonio <= 1 ? 'bueno' : d.endeudamiento_patrimonio <= 2 ? 'regular' : 'malo',
    },
    {
      nombre: 'ROA',
      valor: roa,
      descripcion: 'Resultado neto / Activo total. Rentabilidad de activos.',
      categoria: 'Rentabilidad',
      estado: roa === null ? 'neutro' : roa > 5 ? 'bueno' : roa >= 0 ? 'regular' : 'malo',
      suffix: '%',
    },
    {
      nombre: 'ROE',
      valor: roe,
      descripcion: 'Resultado neto / Patrimonio. Rentabilidad del capital.',
      categoria: 'Rentabilidad',
      estado: roe === null ? 'neutro' : roe > 10 ? 'bueno' : roe >= 0 ? 'regular' : 'malo',
      suffix: '%',
    },
    {
      nombre: 'Margen bruto',
      valor: mb,
      descripcion: '(Ingresos − Costos) / Ingresos.',
      categoria: 'Rentabilidad',
      estado: mb === null ? 'neutro' : mb > 30 ? 'bueno' : mb >= 0 ? 'regular' : 'malo',
      suffix: '%',
    },
    {
      nombre: 'Margen neto',
      valor: mn,
      descripcion: 'Resultado neto / Ingresos totales.',
      categoria: 'Rentabilidad',
      estado: mn === null ? 'neutro' : mn > 10 ? 'bueno' : mn >= 0 ? 'regular' : 'malo',
      suffix: '%',
    },
  ]
}

interface Props { data: RazonesFinancierasData }

export default function RazonesFinancierasClient({ data }: Props) {
  const ratios = buildRatios(data)
  const categorias = ['Liquidez', 'Endeudamiento', 'Rentabilidad']

  return (
    <div className="space-y-6">
      {/* KPIs base */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Activo total',    v: data.total_activo },
          { label: 'Pasivo total',    v: data.total_pasivo },
          { label: 'Patrimonio',      v: data.total_patrimonio },
          { label: 'Resultado neto',  v: data.resultado_neto },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-lg font-bold mt-1 ${k.v < 0 ? 'text-red-600' : 'text-slate-900'}`}>{USD(k.v)}</p>
          </div>
        ))}
      </div>

      {/* Ratios por categoría */}
      {categorias.map((cat) => (
        <div key={cat}>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ratios.filter((r) => r.categoria === cat).map((r) => (
              <div key={r.nombre} className={`border rounded-xl p-4 ${estadoClase(r.estado)}`}>
                <p className="text-xs text-slate-500 font-medium">{r.nombre}</p>
                <p className={`text-2xl font-bold mt-2 ${valorClase(r.estado)}`}>
                  {fmt(r.valor, r.suffix)}
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{r.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Desglose corriente */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Desglose de capital de trabajo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Activo corriente',     v: data.activo_corriente },
            { label: 'Activo no corriente',  v: data.activo_no_corriente },
            { label: 'Inventarios',          v: data.inventarios },
            { label: 'Pasivo corriente',     v: data.pasivo_corriente },
          ].map((k) => (
            <div key={k.label}>
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className="text-base font-semibold text-slate-800 mt-0.5">{USD(k.v)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
