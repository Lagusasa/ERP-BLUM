import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import CotizacionesClient from '@/components/remuneraciones/CotizacionesClient'

export const metadata: Metadata = { title: 'Pago de Cotizaciones' }

export default async function CotizacionesPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const now = new Date()
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Pago de Cotizaciones</h2>
        <p className="text-sm text-slate-500 mt-0.5">Resumen para declaración y pago en Previred — AFP, isapre, mutualidad y seguro de cesantía</p>
      </div>
      <CotizacionesClient
        empresa_id={empresa.id}
        mesInicial={now.getMonth() + 1}
        anioInicial={now.getFullYear()}
      />
    </div>
  )
}
