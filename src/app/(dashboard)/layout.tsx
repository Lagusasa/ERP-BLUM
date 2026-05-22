import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEmpresaActiva, getEmpresasUsuario } from '@/lib/empresa'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [perfil, empresas, empresaActiva] = await Promise.all([
    supabase.from('perfiles').select('*').eq('user_id', user.id).maybeSingle().then((r) => r.data),
    getEmpresasUsuario(),
    getEmpresaActiva(),
  ])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar empresaActiva={empresaActiva} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={perfil}
          email={user.email ?? ''}
          empresas={empresas}
          empresaActiva={empresaActiva}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
