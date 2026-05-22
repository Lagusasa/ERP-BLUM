import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCuentasBancarias, getMovimientosCaja } from '@/services/finanzas.service'
import ConciliacionClient from '@/components/finanzas/ConciliacionClient'

export const metadata: Metadata = { title: 'Conciliación Bancaria' }

export default async function ConciliacionPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [cuentas, movimientos] = await Promise.all([
    getCuentasBancarias(empresa.id).catch(() => []),
    getMovimientosCaja(empresa.id).catch(() => []),
  ])

  if (cuentas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <p className="text-slate-500 text-sm">No hay cuentas bancarias configuradas.</p>
        <a href="/finanzas/cuentas/nueva" className="text-sm text-emerald-700 hover:underline">
          Agregar primera cuenta →
        </a>
      </div>
    )
  }

  return (
    <ConciliacionClient
      empresa_id={empresa.id}
      cuentas={cuentas}
      movimientos={movimientos}
    />
  )
}
