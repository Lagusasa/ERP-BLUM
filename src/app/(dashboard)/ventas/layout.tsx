import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: { default: 'Ventas', template: '%s | Ventas' },
}

const SUBMENU = [
  { label: 'Resumen',      href: '/ventas' },
  { label: 'Documentos',   href: '/ventas/documentos' },
  { label: 'CxC',          href: '/ventas/cxc' },
  { label: 'Clientes',     href: '/ventas/clientes' },
  { label: 'Libro Ventas', href: '/ventas/libro' },
]

export default async function VentasLayout({ children }: { children: React.ReactNode }) {
  const empresa = await getEmpresaActiva()
  if (!empresa) redirect('/dashboard')

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center px-4 border-b border-slate-100">
          <div className="flex items-center gap-2 py-3 pr-6 border-r border-slate-200 mr-2">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">Ventas</span>
          </div>
          <nav className="flex gap-1">
            {SUBMENU.map((item) => (
              <Link key={item.href} href={item.href}
                className="px-3 py-3 text-sm text-slate-500 hover:text-slate-800 border-b-2 border-transparent hover:border-green-500 transition-colors whitespace-nowrap">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto text-xs text-slate-400 py-3">{empresa.razon_social}</div>
        </div>
      </div>
      {children}
    </div>
  )
}
