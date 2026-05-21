import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCuentasImputables, getPeriodoActual } from '@/services/contabilidad.service'
import NuevoComprobanteClient from '@/components/contabilidad/NuevoComprobanteClient'

export const metadata: Metadata = { title: 'Nuevo Comprobante' }

export default async function NuevoComprobantePage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [cuentas, periodo] = await Promise.allSettled([
    getCuentasImputables(empresa.id),
    getPeriodoActual(empresa.id),
  ])

  const listaCuentas = cuentas.status === 'fulfilled' ? cuentas.value : []
  const periodoActual = periodo.status === 'fulfilled' ? periodo.value : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Nuevo Comprobante</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {periodoActual
            ? `Período: ${periodoActual.nombre} ${periodoActual.anio}`
            : 'Sin período activo — el comprobante se guardará como borrador'
          }
        </p>
      </div>

      {listaCuentas.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">Plan de cuentas no configurado</p>
          <p className="text-amber-600 text-sm mt-1">
            Debes importar el plan de cuentas antes de crear comprobantes.
          </p>
          <a href="/contabilidad/plan-cuentas" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Ir a Plan de Cuentas →
          </a>
        </div>
      ) : (
        <NuevoComprobanteClient
          empresa_id={empresa.id}
          periodo_id={periodoActual?.id ?? null}
          cuentas={listaCuentas}
        />
      )}
    </div>
  )
}
