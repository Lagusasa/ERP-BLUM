import type { Metadata } from 'next'
import RemuneracionesNav from '@/components/remuneraciones/RemuneracionesNav'

export const metadata: Metadata = { title: 'Remuneraciones — ERP SaaS Chile' }

export default function RemuneracionesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Remuneraciones</h1>
        <p className="text-sm text-slate-500 mt-0.5">Trabajadores, contratos, liquidaciones y cotizaciones</p>
      </div>
      <RemuneracionesNav />
      {children}
    </div>
  )
}
