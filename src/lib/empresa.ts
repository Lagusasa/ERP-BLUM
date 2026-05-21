import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { EmpresaBasica } from '@/types/auth.types'

const COOKIE_EMPRESA = 'erpEmpresaId'

export async function getEmpresaActiva(): Promise<EmpresaBasica | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const empresaIdCookie = cookieStore.get(COOKIE_EMPRESA)?.value

  const { data: asignaciones } = await supabase
    .from('empresa_usuarios')
    .select(`
      empresa_id,
      empresas (
        id, rut, razon_social, nombre_fantasia, logo_url, is_active
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (!asignaciones || asignaciones.length === 0) return null

  const todasLasEmpresas = asignaciones
    .map((a) => a.empresas as unknown as EmpresaBasica | null)
    .filter((e): e is EmpresaBasica => e !== null && e.is_active)

  if (todasLasEmpresas.length === 0) return null

  if (empresaIdCookie) {
    const match = todasLasEmpresas.find((e) => e.id === empresaIdCookie)
    if (match) return match
  }

  return todasLasEmpresas[0]
}

export async function getEmpresasUsuario(): Promise<EmpresaBasica[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: asignaciones } = await supabase
    .from('empresa_usuarios')
    .select(`
      empresa_id,
      empresas (
        id, rut, razon_social, nombre_fantasia, logo_url, is_active
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (!asignaciones) return []

  return asignaciones
    .map((a) => a.empresas as unknown as EmpresaBasica | null)
    .filter((e): e is EmpresaBasica => e !== null && e.is_active)
}
