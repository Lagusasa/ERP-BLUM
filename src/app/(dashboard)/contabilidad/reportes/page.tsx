import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Reportes Financieros' }

const REPORTES = [
  {
    href: '/contabilidad/reportes/balance-comprobacion',
    titulo: 'Balance de Comprobación',
    descripcion: 'Sumas y saldos deudor/acreedor por cuenta para un período.',
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
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    href: '/contabilidad/reportes/balance-general',
    titulo: 'Balance General',
    descripcion: 'Activos, pasivos y patrimonio acumulados hasta la fecha.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORTES.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
              {r.icon}
            </div>
            <h2 className="text-sm font-semibold text-slate-800">{r.titulo}</h2>
            <p className="text-xs text-slate-500 mt-1">{r.descripcion}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
