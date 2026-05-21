import type { Metadata } from 'next'
import EmpresaForm from '@/components/admin/EmpresaForm'

export const metadata: Metadata = { title: 'Nueva Empresa' }

export default function NuevaEmpresaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Nueva empresa</h2>
        <p className="text-sm text-slate-500 mt-0.5">Registra una nueva empresa en el sistema</p>
      </div>
      <EmpresaForm />
    </div>
  )
}
