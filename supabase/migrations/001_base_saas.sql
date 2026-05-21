-- ============================================================
-- ERP SaaS Chile — Migración 001: Arquitectura Base SaaS
-- Multiempresa, usuarios, roles, permisos
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- TABLA: empresas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empresas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rut                 VARCHAR(12) NOT NULL UNIQUE,
  razon_social        VARCHAR(200) NOT NULL,
  nombre_fantasia     VARCHAR(200),
  giro                VARCHAR(200),
  actividad_economica VARCHAR(10),
  direccion           VARCHAR(300),
  comuna              VARCHAR(100),
  ciudad              VARCHAR(100),
  region              VARCHAR(100),
  telefono            VARCHAR(20),
  email               VARCHAR(100),
  representante_legal VARCHAR(200),
  rut_representante   VARCHAR(12),
  logo_url            TEXT,
  plan_id             UUID,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  created_by          UUID REFERENCES auth.users(id)
);

-- ============================================================
-- TABLA: perfiles (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.perfiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre          VARCHAR(100) NOT NULL,
  apellido        VARCHAR(100) NOT NULL,
  email           VARCHAR(200) NOT NULL,
  telefono        VARCHAR(20),
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_superadmin   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  es_sistema  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, nombre)
);

-- ============================================================
-- TABLA: permisos (catálogo de permisos del sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.permisos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo      VARCHAR(50) NOT NULL,
  accion      VARCHAR(50) NOT NULL,
  recurso     VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(modulo, accion, recurso)
);

-- ============================================================
-- TABLA: rol_permisos (permisos asignados a roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rol_permisos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rol_id      UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permiso_id  UUID NOT NULL REFERENCES public.permisos(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES auth.users(id),
  UNIQUE(rol_id, permiso_id)
);

-- ============================================================
-- TABLA: empresa_usuarios (usuarios por empresa con rol)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empresa_usuarios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol_id      UUID NOT NULL REFERENCES public.roles(id),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES auth.users(id),
  UNIQUE(empresa_id, user_id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_empresas_rut ON public.empresas(rut);
CREATE INDEX IF NOT EXISTS idx_empresas_is_active ON public.empresas(is_active);
CREATE INDEX IF NOT EXISTS idx_perfiles_user_id ON public.perfiles(user_id);
CREATE INDEX IF NOT EXISTS idx_empresa_usuarios_empresa ON public.empresa_usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_usuarios_user ON public.empresa_usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_rol_permisos_rol ON public.rol_permisos(rol_id);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_perfiles_updated_at
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_empresa_usuarios_updated_at
  BEFORE UPDATE ON public.empresa_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCIÓN: crear perfil al registrarse (trigger en auth.users)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (user_id, nombre, apellido, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_new_user_perfil
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rol_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;

-- Perfiles: cada usuario ve y edita solo su perfil
CREATE POLICY "perfiles_select_own"
  ON public.perfiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "perfiles_update_own"
  ON public.perfiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "perfiles_insert_own"
  ON public.perfiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Empresas: usuario ve solo las empresas a las que pertenece
CREATE POLICY "empresas_select_member"
  ON public.empresas FOR SELECT
  USING (
    id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
    OR
    created_by = auth.uid()
  );

-- empresa_usuarios: usuario ve sus propias asignaciones
CREATE POLICY "empresa_usuarios_select_own"
  ON public.empresa_usuarios FOR SELECT
  USING (user_id = auth.uid());

-- roles: usuario ve los roles de sus empresas
CREATE POLICY "roles_select_member"
  ON public.roles FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
    OR empresa_id IS NULL
  );

-- permisos: lectura pública (catálogo del sistema)
CREATE POLICY "permisos_select_all"
  ON public.permisos FOR SELECT
  TO authenticated
  USING (TRUE);

-- rol_permisos: usuarios ven permisos de sus roles
CREATE POLICY "rol_permisos_select_member"
  ON public.rol_permisos FOR SELECT
  USING (
    rol_id IN (
      SELECT eu.rol_id FROM public.empresa_usuarios eu
      WHERE eu.user_id = auth.uid() AND eu.is_active = TRUE
    )
  );

-- ============================================================
-- DATOS INICIALES: Roles del sistema
-- ============================================================
INSERT INTO public.roles (nombre, descripcion, es_sistema, empresa_id) VALUES
  ('Superadmin',        'Acceso total al sistema',                              TRUE, NULL),
  ('Administrador',     'Administrador de empresa',                             TRUE, NULL),
  ('Contador',          'Acceso completo a módulos contables y tributarios',    TRUE, NULL),
  ('Asistente Contable','Acceso limitado a contabilidad y compras/ventas',      TRUE, NULL),
  ('RRHH',              'Acceso a remuneraciones y recursos humanos',           TRUE, NULL),
  ('Bodeguero',         'Acceso a inventario y bodegas',                        TRUE, NULL),
  ('Solo lectura',      'Visualización sin modificaciones',                     TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DATOS INICIALES: Catálogo de permisos
-- ============================================================
INSERT INTO public.permisos (modulo, accion, recurso, descripcion) VALUES
  -- Empresas
  ('admin', 'ver', 'empresas', 'Ver listado de empresas'),
  ('admin', 'crear', 'empresas', 'Crear empresa'),
  ('admin', 'editar', 'empresas', 'Editar empresa'),
  ('admin', 'eliminar', 'empresas', 'Eliminar empresa'),
  -- Usuarios
  ('admin', 'ver', 'usuarios', 'Ver usuarios'),
  ('admin', 'crear', 'usuarios', 'Crear usuario'),
  ('admin', 'editar', 'usuarios', 'Editar usuario'),
  ('admin', 'eliminar', 'usuarios', 'Eliminar usuario'),
  -- Contabilidad
  ('contabilidad', 'ver', 'plan_cuentas', 'Ver plan de cuentas'),
  ('contabilidad', 'crear', 'plan_cuentas', 'Crear cuentas contables'),
  ('contabilidad', 'editar', 'plan_cuentas', 'Editar cuentas contables'),
  ('contabilidad', 'ver', 'libro_diario', 'Ver libro diario'),
  ('contabilidad', 'crear', 'libro_diario', 'Crear asientos contables'),
  ('contabilidad', 'editar', 'libro_diario', 'Editar asientos'),
  ('contabilidad', 'ver', 'reportes', 'Ver reportes financieros'),
  -- Compras
  ('compras', 'ver', 'proveedores', 'Ver proveedores'),
  ('compras', 'crear', 'proveedores', 'Crear proveedor'),
  ('compras', 'ver', 'documentos', 'Ver documentos de compra'),
  ('compras', 'crear', 'documentos', 'Crear documentos de compra'),
  -- Ventas
  ('ventas', 'ver', 'clientes', 'Ver clientes'),
  ('ventas', 'crear', 'clientes', 'Crear cliente'),
  ('ventas', 'ver', 'documentos', 'Ver documentos de venta'),
  ('ventas', 'crear', 'documentos', 'Crear documentos de venta'),
  -- Remuneraciones
  ('remuneraciones', 'ver', 'trabajadores', 'Ver trabajadores'),
  ('remuneraciones', 'crear', 'liquidaciones', 'Crear liquidaciones'),
  ('remuneraciones', 'ver', 'liquidaciones', 'Ver liquidaciones'),
  -- Inventario
  ('inventario', 'ver', 'productos', 'Ver productos'),
  ('inventario', 'crear', 'productos', 'Crear productos'),
  ('inventario', 'ver', 'movimientos', 'Ver movimientos de inventario')
ON CONFLICT DO NOTHING;
