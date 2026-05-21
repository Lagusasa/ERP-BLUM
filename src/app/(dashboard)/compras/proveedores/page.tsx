import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getProveedores } from '@/services/compras.service'
import ProveedoresClient from '@/components/compras/ProveedoresClient'

export const metadata: Metadata = { title: 'Proveedores' }

export default async function ProveedoresPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const proveedores = await getProveedores(empresa.id).catch(() => [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-0.5">{proveedores.filter((p) => p.is_active).length} proveedores activos</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Proveedor
        </button>
      </div>
      <ProveedoresClient proveedores={proveedores} empresa_id={empresa.id} />
    </div>
  )
}
