import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getKpiEjecutivo, getResumenAnual } from '@/services/bi.service'
import { formatCurrency } from '@/lib/utils'
import ResumenAnualTable from '@/components/bi/ResumenAnualTable'

export const metadata: Metadata = { title: 'Reportes BI — Analytics' }

export default async function ReportesPage({ searchParams }: { searchParams: Promise<{ anio?: string }> }) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const anio = Number(params.anio ?? new Date().getFullYear())

  const [kpis, resumenAnual] = await Promise.allSettled([
    getKpiEjecutivo(empresa.id),
    getResumenAnual(empresa.id, anio),
  ])

  const k = kpis.status === 'fulfilled' ? kpis.value : null
  const r = resumenAnual.status === 'fulfilled' ? resumenAnual.value : null

  const varVentas = k && k.ventas_mes_anterior > 0
    ? ((k.ventas_mes - k.ventas_mes_anterior) / k.ventas_mes_anterior * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analytics & BI</h1>
          <p className="text-sm text-slate-500 mt-0.5">KPIs ejecutivos y reportes consolidados.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/reportes?anio=${anio - 1}`}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-slate-800 w-12 text-center">{anio}</span>
          <Link href={`/reportes?anio=${anio + 1}`}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* KPIs ejecutivos del mes actual */}
      {k && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">KPIs del mes en curso</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Ventas mes</p>
              <p className="text-2xl font-bold text-blue-600 mt-1 tabular-nums">{formatCurrency(k.ventas_mes)}</p>
              {varVentas !== 0 && (
                <p className={`text-xs mt-1 ${varVentas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {varVentas >= 0 ? '▲' : '▼'} {Math.abs(varVentas).toFixed(1)}% vs mes ant.
                </p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Resultado mes</p>
              <p className={`text-2xl font-bold mt-1 tabular-nums ${k.resultado_mes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(k.resultado_mes)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Ventas − Compras</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Saldo en caja</p>
              <p className={`text-2xl font-bold mt-1 tabular-nums ${k.saldo_caja >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                {formatCurrency(k.saldo_caja)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Todas las cuentas</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Compras mes</p>
              <p className="text-2xl font-bold text-purple-600 mt-1 tabular-nums">{formatCurrency(k.compras_mes)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alertas de gestión */}
      {k && (k.dtes_pendientes > 0 || k.stock_bajo_minimo > 0 || k.trabajadores_activos > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Indicadores de gestión</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{k.trabajadores_activos}</p>
                <p className="text-xs text-slate-500">Trabajadores activos</p>
              </div>
            </div>

            {k.dtes_pendientes > 0 && (
              <Link href="/sii/dte" className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 hover:border-amber-300">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{k.dtes_pendientes}</p>
                  <p className="text-xs text-amber-600">DTEs pendientes SII</p>
                </div>
              </Link>
            )}

            {k.stock_bajo_minimo > 0 && (
              <Link href="/inventario/productos" className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4 hover:border-red-300">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{k.stock_bajo_minimo}</p>
                  <p className="text-xs text-red-600">Productos bajo stock mínimo</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Resumen anual */}
      {r && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Resumen anual {anio}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ventas, compras, resultado y flujo de caja por mes.</p>
          </div>
          <div className="p-5">
            <ResumenAnualTable resumen={r} />
          </div>
        </div>
      )}

      {/* Links a reportes específicos */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Reportes por módulo</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Balance Comprobación', href: '/contabilidad/reportes/balance-comprobacion', color: 'blue' },
            { label: 'Estado Resultados',   href: '/contabilidad/reportes/estado-resultados',     color: 'green' },
            { label: 'Balance General',     href: '/contabilidad/reportes/balance-general',        color: 'purple' },
            { label: 'Declaración F29',     href: '/tributacion/f29',                              color: 'orange' },
            { label: 'RLI / Renta',         href: '/tributacion/rli',                              color: 'pink' },
            { label: 'F22 Anual',           href: '/sii/f22',                                      color: 'red' },
            { label: 'Flujo de Caja',       href: '/finanzas',                                     color: 'teal' },
            { label: 'Kardex Inventario',   href: '/inventario/kardex',                            color: 'slate' },
          ].map((r) => (
            <Link key={r.href} href={r.href}
              className="bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all">
              <p className="text-sm font-medium text-slate-700">{r.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">Ver reporte →</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
