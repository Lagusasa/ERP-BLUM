export interface UserProfile {
  id: string
  user_id: string
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  avatar_url: string | null
  is_active: boolean
  is_superadmin: boolean
}

export interface EmpresaUsuario {
  id: string
  empresa_id: string
  user_id: string
  rol_id: string
  is_active: boolean
  empresa?: EmpresaBasica
  rol?: RolBasico
}

export interface EmpresaBasica {
  id: string
  rut: string
  razon_social: string
  nombre_fantasia: string | null
  logo_url: string | null
  is_active: boolean
}

export interface RolBasico {
  id: string
  nombre: string
  es_sistema: boolean
}

export interface Permiso {
  id: string
  modulo: string
  accion: string
  recurso: string
  descripcion: string | null
}

export interface SessionData {
  user: UserProfile
  empresas: EmpresaUsuario[]
  empresa_activa: EmpresaBasica | null
  permisos: Permiso[]
}
