import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import CertificadosCotizacionesClient from '@/components/remuneraciones/CertificadosCotizacionesClient'

export const metadata: Metadata = { title: 'Certificados y Reportes DT' }

export default async function CertificadosPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Certificados y Reportes DT</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Certificado de cotizaciones previsionales y planilla de remuneraciones para la Dirección del Trabajo.
        </p>
      </div>
      <CertificadosCotizacionesClient empresa_id={empresa.id} empresa={empresa} />
    </div>
  )
}
