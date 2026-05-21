import type { Metadata } from 'next'
import AdminNav from '@/components/admin/AdminNav'

export const metadata: Metadata = { title: 'Administración — ERP SaaS Chile' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Administración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Empresas, usuarios y configuración del sistema</p>
      </div>
      <AdminNav />
      {children}
    </div>
  )
}
