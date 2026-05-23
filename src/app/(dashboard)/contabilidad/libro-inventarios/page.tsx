import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getBalanceGeneral } from '@/services/contabilidad.service'
import LibroInventariosClient from '@/components/contabilidad/LibroInventariosClient'

export const metadata: Metadata = { title: 'Libro de Inventarios y Balances' }

export default async function LibroInventariosPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const anio = new Date().getFullYear()
  const hasta = `${anio}-12-31`
  const balance = await getBalanceGeneral(empresa.id, hasta)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Libro de Inventarios y Balances</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Registro obligatorio de activos, pasivos y patrimonio al cierre del ejercicio (art. 17 C. Tributario).
        </p>
      </div>
      <LibroInventariosClient
        empresa={empresa}
        balance={balance}
        anio={anio}
      />
    </div>
  )
}
