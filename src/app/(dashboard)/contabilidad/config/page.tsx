import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCuentasImputables } from '@/services/contabilidad.service'
import { getConfigContable } from '@/services/centralizacion.service'
import ConfigContableClient from '@/components/contabilidad/ConfigContableClient'

export const metadata: Metadata = { title: 'Configuración Contable' }

export default async function ConfigContablePage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [cuentas, config] = await Promise.allSettled([
    getCuentasImputables(empresa.id),
    getConfigContable(empresa.id),
  ])

  const listaCuentas = cuentas.status === 'fulfilled' ? cuentas.value : []
  const configActual = config.status === 'fulfilled' ? config.value : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Configuración Contable</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cuentas utilizadas en la centralización automática de documentos
        </p>
      </div>

      <ConfigContableClient
        empresa_id={empresa.id}
        cuentas={listaCuentas}
        config={configActual}
      />
    </div>
  )
}
