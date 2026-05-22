import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getAntiguedadSaldos } from '@/services/contabilidad.service'
import AntiguedadSaldosClient from '@/components/contabilidad/AntiguedadSaldosClient'

export const metadata: Metadata = { title: 'Antigüedad de Saldos' }

export default async function AntiguedadSaldosPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const data = await getAntiguedadSaldos(empresa.id)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Antigüedad de Saldos</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cuentas por cobrar y por pagar pendientes, ordenadas por tramo de vencimiento.
        </p>
      </div>
      <AntiguedadSaldosClient data={data} />
    </div>
  )
}
