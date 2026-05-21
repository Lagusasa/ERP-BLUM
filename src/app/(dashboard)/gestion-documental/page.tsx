import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDocumentos } from '@/services/gestion-documental.service'
import DocumentosClient from '@/components/gestion-documental/DocumentosClient'

export const metadata: Metadata = { title: 'Gestión Documental' }

interface Props {
  searchParams: Promise<{ tipo?: string; q?: string }>
}

export default async function GestionDocumentalPage({ searchParams }: Props) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const documentos = await getDocumentos({
    empresa_id: empresa.id,
    tipo: params.tipo,
    busqueda: params.q,
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Gestión Documental</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Centraliza contratos, DTE, nóminas, certificados y otros documentos de la empresa.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', count: documentos.length, color: 'text-slate-800' },
          { label: 'DTE', count: documentos.filter((d) => d.tipo === 'dte').length, color: 'text-emerald-800' },
          { label: 'Contratos', count: documentos.filter((d) => d.tipo === 'contrato').length, color: 'text-purple-700' },
          { label: 'Liquidaciones', count: documentos.filter((d) => d.tipo === 'liquidacion').length, color: 'text-green-700' },
          { label: 'Otros', count: documentos.filter((d) => d.tipo === 'otro' || d.tipo === 'certificado' || d.tipo === 'nomina').length, color: 'text-slate-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.count}</p>
          </div>
        ))}
      </div>

      <DocumentosClient documentos={documentos} empresa_id={empresa.id} />
    </div>
  )
}
