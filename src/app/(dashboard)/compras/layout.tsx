import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: { default: 'Compras', template: '%s | Compras' },
}

const SUBMENU = [
  { label: 'Resumen',       href: '/compras' },
  { label: 'Documentos',    href: '/compras/documentos' },
  { label: 'Proveedores',   href: '/compras/proveedores' },
  { label: 'Libro Compras', href: '/compras/libro' },
]

export default async function ComprasLayout({ children }: { children: React.ReactNode }) {
  const empresa = await getEmpresaActiva()
  if (!empresa) redirect('/dashboard')

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center px-4 border-b border-slate-100">
          <div className="flex items-center gap-2 py-3 pr-6 border-r border-slate-200 mr-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">Compras</span>
          </div>
          <nav className="flex gap-1">
            {SUBMENU.map((item) => (
              <Link key={item.href} href={item.href}
                className="px-3 py-3 text-sm text-slate-500 hover:text-slate-800 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap">
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
