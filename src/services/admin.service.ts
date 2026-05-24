import { createClient } from '@/lib/supabase/server'

export interface EmpresaAdmin {
  id: string
  razon_social: string
  rut: string
  giro: string | null
  email: string | null
  telefono: string | null
  direccion: string | null
  comuna: string | null
  ciudad: string | null
  is_active: boolean
  created_at: string
}

export interface UsuarioEmpresa {
  id: string
  user_id: string
  empresa_id: string
  is_active: boolean
  created_at: string
  perfil: {
    nombre_completo: string | null
    email: string | null
    avatar_url: string | null
  } | null
  rol: {
    id: string
    nombre: string
  } | null
}

export interface EmpresaAdminConMembership extends EmpresaAdmin {
  es_miembro: boolean
}

export async function getEmpresas(): Promise<EmpresaAdminConMembership[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Empresas donde el usuario es miembro activo
  const { data: miembro } = await supabase
    .from('empresa_usuarios')
    .select(`
      empresa_id,
      empresas!inner(
        id, razon_social, rut, giro, email, telefono, direccion, comuna, ciudad, is_active, created_at
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  // Empresas creadas por el usuario pero sin membership (registro faltante)
  const { data: creadas } = await supabase
    .from('empresas')
    .select('id, razon_social, rut, giro, email, telefono, direccion, comuna, ciudad, is_active, created_at')
    .eq('created_by', user.id)

  const miembroIds = new Set((miembro ?? []).map((m) => m.empresa_id))

  const resultado: EmpresaAdminConMembership[] = [
    ...(miembro ?? []).map((m) => ({ ...(m.empresas as unknown as EmpresaAdmin), es_miembro: true })),
  ]

  for (const e of creadas ?? []) {
    if (!miembroIds.has(e.id)) {
      resultado.push({ ...(e as unknown as EmpresaAdmin), es_miembro: false })
    }
  }

  return resultado
}

export async function getEmpresa(id: string): Promise<EmpresaAdmin | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('empresas')
    .select('id, razon_social, rut, giro, email, telefono, direccion, comuna, ciudad, is_active, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return data as EmpresaAdmin
}

export interface CreateEmpresaInput {
  razon_social: string
  rut: string
  giro?: string
  email?: string
  telefono?: string
  direccion?: string
  comuna?: string
  ciudad?: string
  representante_legal?: string
}

export async function createEmpresa(input: CreateEmpresaInput): Promise<{ id: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: empresa, error } = await supabase
    .from('empresas')
    .insert({
      razon_social: input.razon_social,
      rut: input.rut,
      giro: input.giro || null,
      email: input.email || null,
      telefono: input.telefono || null,
      direccion: input.direccion || null,
      comuna: input.comuna || null,
      ciudad: input.ciudad || null,
      representante_legal: input.representante_legal || null,
      is_active: true,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !empresa) return null

  const { data: rolSuperadmin } = await supabase
    .from('roles')
    .select('id')
    .eq('nombre', 'Administrador')
    .is('empresa_id', null)
    .maybeSingle()

  await supabase.from('empresa_usuarios').insert({
    empresa_id: empresa.id,
    user_id: user.id,
    rol_id: rolSuperadmin?.id ?? null,
    is_active: true,
    created_by: user.id,
  })

  return { id: empresa.id }
}

export async function updateEmpresa(id: string, input: Partial<CreateEmpresaInput>): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('empresas')
    .update({ ...input })
    .eq('id', id)
  return !error
}

export async function getUsuariosEmpresa(empresa_id: string): Promise<UsuarioEmpresa[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('empresa_usuarios')
    .select(`
      id, user_id, empresa_id, is_active, created_at,
      perfil:perfiles!user_id(nombre, apellido, email, avatar_url),
      rol:roles(id, nombre)
    `)
    .eq('empresa_id', empresa_id)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as unknown as UsuarioEmpresa[]
}

export async function getRoles(empresa_id?: string): Promise<{ id: string; nombre: string; descripcion: string | null; es_sistema: boolean }[]> {
  const supabase = await createClient()
  let query = supabase
    .from('roles')
    .select('id, nombre, descripcion, es_sistema')
    .eq('is_active', true)
    .order('es_sistema', { ascending: false })
    .order('nombre')

  if (empresa_id) {
    query = query.or(`empresa_id.eq.${empresa_id},empresa_id.is.null`)
  }

  const { data, error } = await query
  if (error || !data) return []
  return data as { id: string; nombre: string; descripcion: string | null; es_sistema: boolean }[]
}
