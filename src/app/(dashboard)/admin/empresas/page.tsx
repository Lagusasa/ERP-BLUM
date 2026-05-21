import type { Metadata } from 'next'
import { getEmpresas } from '@/services/admin.service'
import EmpresasClient from '@/components/admin/EmpresasClient'

export const metadata: Metadata = { title: 'Empresas — Administración' }

export default async function AdminEmpresasPage() {
  const empresas = await getEmpresas()
  return <EmpresasClient empresas={empresas} />
}
