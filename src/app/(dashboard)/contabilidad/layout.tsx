import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: {
    default: 'Contabilidad',
    template: '%s | Contabilidad',
  },
}

const SUBMENU = [
  { label: 'Resumen',        href: '/contabilidad' },
  { label: 'Plan de Cuentas', href: '/contabilidad/plan-cuentas' },
  { label: 'Libro Diario',   href: '/contabilidad/libro-diario' },
  { label: 'Libro Mayor',    href: '/contabilidad/libro-mayor' },
  { label: 'Períodos',       href: '/contabilidad/periodos' },
  { label: 'Activos Fijos',  href: '/contabilidad/activos-fijos' },
  { label: 'Presupuesto',    href: '/contabilidad/presupuesto' },
  { label: 'Reportes',       href: '/contabilidad/reportes' },
]

export default async function ContabilidadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const empresa = await getEmpresaActiva()
  if (!empresa) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-4">
      {/* Subnavegación de contabilidad */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center px-4 border-b border-slate-100">
          <div className="flex items-center gap-2 py-3 pr-6 border-r border-slate-200 mr-2">
            <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">Contabilidad</span>
          </div>
          <nav className="flex gap-1">
            {SUBMENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-3 text-sm text-slate-500 hover:text-slate-800 border-b-2 border-transparent hover:border-emerald-600 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto text-xs text-slate-400 py-3">
            {empresa.razon_social}
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}
