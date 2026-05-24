import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getUsuariosEmpresa, getRoles } from '@/services/admin.service'
import UsuariosClient from '@/components/admin/UsuariosClient'

export const metadata: Metadata = { title: 'Usuarios — Administración' }

export default async function AdminUsuariosPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm text-amber-800 font-medium">Selecciona una empresa activa para gestionar usuarios.</p>
      </div>
    )
  }

  const [usuarios, roles] = await Promise.all([
    getUsuariosEmpresa(empresa.id),
    getRoles(empresa.id),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Usuarios de <span className="font-medium text-slate-700">{empresa.razon_social}</span>
        </p>
      </div>
      <UsuariosClient usuarios={usuarios} roles={roles} empresa_id={empresa.id} />
    </div>
  )
}
