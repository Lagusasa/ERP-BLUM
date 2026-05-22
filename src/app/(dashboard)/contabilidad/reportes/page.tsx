import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Reportes Financieros' }

const REPORTES = [
  {
    href: '/contabilidad/reportes/balance-comprobacion',
    titulo: 'Balance de 8 Columnas',
    descripcion: 'Sumas, saldos, balance y resultados por cuenta. Hoja de trabajo completa.',
    badge: 'NIIF / PCGA',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 6l-7 7 7 7M14 6l7 7-7 7" />
      </svg>
    ),
  },
  {
    href: '/contabilidad/reportes/estado-resultados',
    titulo: 'Estado de Resultados',
    descripcion: 'Ingresos, costos y gastos del período con resultado neto.',
    badge: null,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    href: '/contabilidad/reportes/balance-general',
    titulo: 'Estado de Situación Financiera',
    descripcion: 'Activos, pasivos y patrimonio acumulados hasta la fecha.',
    badge: null,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    href: '/contabilidad/reportes/flujo-efectivo',
    titulo: 'Estado de Flujo de Efectivo',
    descripcion: 'Variación del efectivo por actividades de operación, inversión y financiamiento.',
    badge: 'NIC 7',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Reportes Financieros</h1>
        <p className="text-sm text-slate-500 mt-0.5">Estados financieros basados en comprobantes aprobados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORTES.map((r) => (
          <Link key={r.href} href={r.href}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                {r.icon}
              </div>
              {r.badge && (
                <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">{r.badge}</span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-slate-800">{r.titulo}</h2>
            <p className="text-xs text-slate-500 mt-1">{r.descripcion}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
