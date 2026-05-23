import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import RegistrosEmpresaClient from '@/components/tributacion/RegistrosEmpresaClient'

export const metadata: Metadata = { title: 'Registros Empresas SII (RAI, DDAN, FUT)' }

export default async function RegistrosEmpresaPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Registros Empresas SII</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          RAI (Renta Atribuida), DDAN (Diferencias Depreciación), FUT/FUNT — Régimen Pro Pyme y General.
        </p>
      </div>
      <RegistrosEmpresaClient empresa_id={empresa.id} />
    </div>
  )
}
