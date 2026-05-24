import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getRoles } from '@/services/admin.service'
import RolesClient from '@/components/admin/RolesClient'

export const metadata: Metadata = { title: 'Roles — Administración' }

export default async function AdminRolesPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm text-amber-800 font-medium">Selecciona una empresa activa para gestionar roles.</p>
      </div>
    )
  }

  const roles = await getRoles(empresa.id)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">
          Roles de <span className="font-medium text-slate-700">{empresa.razon_social}</span>
        </p>
      </div>
      <RolesClient roles={roles} empresa_id={empresa.id} />
    </div>
  )
}
