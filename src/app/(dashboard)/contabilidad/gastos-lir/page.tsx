import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCuentasImputables } from '@/services/contabilidad.service'
import GastosLirClient from '@/components/contabilidad/GastosLirClient'

export const metadata: Metadata = { title: 'Gastos LIR — art. 31 y 21' }

export default async function GastosLirPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const cuentas = await getCuentasImputables(empresa.id)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Gastos LIR — Control art. 31 y 21</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Clasificación de gastos necesarios (art. 31) y gastos rechazados sujetos a impuesto único (art. 21).
        </p>
      </div>
      <GastosLirClient empresa_id={empresa.id} cuentas={cuentas} />
    </div>
  )
}
