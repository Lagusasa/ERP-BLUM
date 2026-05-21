import type { Metadata } from 'next'
import TributacionNav from '@/components/tributacion/TributacionNav'

export const metadata: Metadata = { title: 'Tributación — ERP SaaS Chile' }

export default function TributacionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Tributación</h1>
        <p className="text-sm text-slate-500 mt-0.5">IVA, Libro de Compras y Ventas, Declaración F29</p>
      </div>
      <TributacionNav />
      {children}
    </div>
  )
}
