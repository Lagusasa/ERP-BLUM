import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getClientes } from '@/services/ventas.service'
import ClientesClient from '@/components/ventas/ClientesClient'

export const metadata: Metadata = { title: 'Clientes' }

export default async function ClientesPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const clientes = await getClientes(empresa.id).catch(() => [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clientes.filter((c) => c.is_active).length} clientes activos</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </button>
      </div>
      <ClientesClient clientes={clientes} empresa_id={empresa.id} />
    </div>
  )
}
