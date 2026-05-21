-- ============================================================
-- MIGRACIÓN: 001_base_saas.sql
-- ============================================================
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


-- ============================================================
-- MIGRACIÓN: 002_contabilidad.sql
-- ============================================================
-- ============================================================
-- ERP SaaS Chile — Migración 002: Motor Contable
-- Plan de Cuentas, Comprobantes, Períodos, Centros de Costo
-- ============================================================

-- ============================================================
-- TABLA: centros_costo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.centros_costo (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo      VARCHAR(20) NOT NULL,
  nombre      VARCHAR(200) NOT NULL,
  descripcion TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES auth.users(id),
  UNIQUE(empresa_id, codigo)
);

-- ============================================================
-- TABLA: plan_cuentas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plan_cuentas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  cuenta_padre_id UUID REFERENCES public.plan_cuentas(id),
  codigo          VARCHAR(20) NOT NULL,
  nombre          VARCHAR(200) NOT NULL,
  nombre_corto    VARCHAR(60),
  clase           VARCHAR(20) NOT NULL CHECK (clase IN ('activo','pasivo','patrimonio','ingreso','costo','gasto','orden')),
  tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('encabezado','detalle')),
  nivel           SMALLINT NOT NULL CHECK (nivel BETWEEN 1 AND 5),
  saldo_normal    VARCHAR(10) NOT NULL CHECK (saldo_normal IN ('deudor','acreedor')),
  es_imputable    BOOLEAN NOT NULL DEFAULT FALSE,
  es_ajuste       BOOLEAN NOT NULL DEFAULT FALSE,
  es_tributaria   BOOLEAN NOT NULL DEFAULT FALSE,
  codigo_sii      VARCHAR(10),
  orden           INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  UNIQUE(empresa_id, codigo)
);

-- ============================================================
-- TABLA: periodos_contables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.periodos_contables (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  anio        SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
  mes         SMALLINT NOT NULL CHECK (mes BETWEEN 0 AND 13),
  nombre      VARCHAR(50) NOT NULL,
  estado      VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','cerrado','bloqueado')),
  fecha_inicio DATE,
  fecha_fin    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cerrado_by  UUID REFERENCES auth.users(id),
  cerrado_at  TIMESTAMPTZ,
  UNIQUE(empresa_id, anio, mes)
);

-- ============================================================
-- TABLA: comprobantes (cabecera)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comprobantes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo_id      UUID REFERENCES public.periodos_contables(id),
  numero          INTEGER NOT NULL,
  tipo            VARCHAR(30) NOT NULL DEFAULT 'diario'
                    CHECK (tipo IN ('diario','compras','ventas','remuneraciones','apertura','cierre','ajuste','traslado','correccion')),
  fecha           DATE NOT NULL,
  glosa           VARCHAR(500) NOT NULL,
  estado          VARCHAR(20) NOT NULL DEFAULT 'borrador'
                    CHECK (estado IN ('borrador','aprobado','anulado')),
  total_debe      NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_haber     NUMERIC(18,2) NOT NULL DEFAULT 0,
  origen          VARCHAR(50),
  origen_id       UUID,
  documento_ref   VARCHAR(100),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  aprobado_by     UUID REFERENCES auth.users(id),
  aprobado_at     TIMESTAMPTZ,
  UNIQUE(empresa_id, numero)
);

-- ============================================================
-- TABLA: comprobante_lineas (detalle)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comprobante_lineas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comprobante_id  UUID NOT NULL REFERENCES public.comprobantes(id) ON DELETE CASCADE,
  empresa_id      UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cuenta_id       UUID NOT NULL REFERENCES public.plan_cuentas(id),
  centro_costo_id UUID REFERENCES public.centros_costo(id),
  debe            NUMERIC(18,2) NOT NULL DEFAULT 0,
  haber           NUMERIC(18,2) NOT NULL DEFAULT 0,
  glosa           VARCHAR(300),
  documento_ref   VARCHAR(100),
  orden           INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_debe_haber CHECK (
    (debe >= 0 AND haber = 0) OR (haber >= 0 AND debe = 0)
  )
);

-- ============================================================
-- TABLA: correlativo_comprobantes (autoincremental por empresa/año)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.correlativo_comprobantes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  anio        SMALLINT NOT NULL,
  ultimo      INTEGER NOT NULL DEFAULT 0,
  UNIQUE(empresa_id, anio)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_plan_cuentas_empresa ON public.plan_cuentas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_plan_cuentas_codigo ON public.plan_cuentas(codigo);
CREATE INDEX IF NOT EXISTS idx_plan_cuentas_padre ON public.plan_cuentas(cuenta_padre_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_empresa ON public.comprobantes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_fecha ON public.comprobantes(fecha);
CREATE INDEX IF NOT EXISTS idx_comprobantes_periodo ON public.comprobantes(periodo_id);
CREATE INDEX IF NOT EXISTS idx_comprobante_lineas_comp ON public.comprobante_lineas(comprobante_id);
CREATE INDEX IF NOT EXISTS idx_comprobante_lineas_cuenta ON public.comprobante_lineas(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_periodos_empresa ON public.periodos_contables(empresa_id);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE TRIGGER trigger_centros_costo_updated_at
  BEFORE UPDATE ON public.centros_costo
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_plan_cuentas_updated_at
  BEFORE UPDATE ON public.plan_cuentas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_periodos_updated_at
  BEFORE UPDATE ON public.periodos_contables
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_comprobantes_updated_at
  BEFORE UPDATE ON public.comprobantes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCIÓN: siguiente número de comprobante
-- ============================================================
CREATE OR REPLACE FUNCTION public.siguiente_numero_comprobante(
  p_empresa_id UUID,
  p_anio       SMALLINT
) RETURNS INTEGER AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  INSERT INTO public.correlativo_comprobantes(empresa_id, anio, ultimo)
  VALUES (p_empresa_id, p_anio, 1)
  ON CONFLICT (empresa_id, anio) DO UPDATE
    SET ultimo = correlativo_comprobantes.ultimo + 1
  RETURNING ultimo INTO v_numero;
  RETURN v_numero;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCIÓN: crear períodos para un año fiscal
-- ============================================================
CREATE OR REPLACE FUNCTION public.crear_periodos_anio(
  p_empresa_id UUID,
  p_anio       SMALLINT
) RETURNS VOID AS $$
DECLARE
  v_mes   SMALLINT;
  v_nombres TEXT[] := ARRAY['Apertura','Enero','Febrero','Marzo','Abril','Mayo','Junio',
                             'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre','Cierre'];
BEGIN
  FOR v_mes IN 0..13 LOOP
    INSERT INTO public.periodos_contables(empresa_id, anio, mes, nombre, fecha_inicio, fecha_fin)
    VALUES (
      p_empresa_id,
      p_anio,
      v_mes,
      v_nombres[v_mes + 1],
      CASE
        WHEN v_mes = 0  THEN MAKE_DATE(p_anio, 1, 1)
        WHEN v_mes = 13 THEN MAKE_DATE(p_anio, 12, 31)
        ELSE MAKE_DATE(p_anio, v_mes, 1)
      END,
      CASE
        WHEN v_mes = 0  THEN MAKE_DATE(p_anio, 1, 1)
        WHEN v_mes = 13 THEN MAKE_DATE(p_anio, 12, 31)
        ELSE (MAKE_DATE(p_anio, v_mes, 1) + INTERVAL '1 month - 1 day')::DATE
      END
    )
    ON CONFLICT (empresa_id, anio, mes) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCIÓN: importar plan de cuentas template a empresa
-- ============================================================
CREATE OR REPLACE FUNCTION public.importar_plan_cuentas_template(p_empresa_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_rec   RECORD;
  v_new_id UUID;
  v_padre_map JSONB := '{}'::JSONB;
BEGIN
  FOR v_rec IN
    SELECT * FROM public.plan_cuentas
    WHERE empresa_id IS NULL
    ORDER BY nivel, codigo
  LOOP
    v_new_id := uuid_generate_v4();

    INSERT INTO public.plan_cuentas(
      id, empresa_id, cuenta_padre_id, codigo, nombre, nombre_corto,
      clase, tipo, nivel, saldo_normal, es_imputable, es_ajuste,
      es_tributaria, codigo_sii, orden
    ) VALUES (
      v_new_id,
      p_empresa_id,
      CASE
        WHEN v_rec.cuenta_padre_id IS NULL THEN NULL
        ELSE (v_padre_map ->> v_rec.cuenta_padre_id::TEXT)::UUID
      END,
      v_rec.codigo,
      v_rec.nombre,
      v_rec.nombre_corto,
      v_rec.clase,
      v_rec.tipo,
      v_rec.nivel,
      v_rec.saldo_normal,
      v_rec.es_imputable,
      v_rec.es_ajuste,
      v_rec.es_tributaria,
      v_rec.codigo_sii,
      v_rec.orden
    )
    ON CONFLICT (empresa_id, codigo) DO NOTHING;

    v_padre_map := v_padre_map || jsonb_build_object(v_rec.id::TEXT, v_new_id::TEXT);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.centros_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprobante_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correlativo_comprobantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_cuentas_select"
  ON public.plan_cuentas FOR SELECT
  USING (
    empresa_id IS NULL
    OR empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "plan_cuentas_insert"
  ON public.plan_cuentas FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "plan_cuentas_update"
  ON public.plan_cuentas FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "centros_costo_select"
  ON public.centros_costo FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "periodos_select"
  ON public.periodos_contables FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "comprobantes_select"
  ON public.comprobantes FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "comprobantes_insert"
  ON public.comprobantes FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "comprobantes_update"
  ON public.comprobantes FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "comprobante_lineas_select"
  ON public.comprobante_lineas FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "comprobante_lineas_insert"
  ON public.comprobante_lineas FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- SEED: Plan de Cuentas Template Chileno (empresa_id = NULL)
-- Basado en IFRS para Pymes / Norma SII
-- ============================================================

-- ===== ACTIVOS (CLASE 1) =====
INSERT INTO public.plan_cuentas (empresa_id, codigo, nombre, clase, tipo, nivel, saldo_normal, es_imputable, orden) VALUES
(NULL, '1',    'ACTIVOS',                          'activo', 'encabezado', 1, 'deudor',   FALSE, 10),
(NULL, '11',   'Activos Corrientes',               'activo', 'encabezado', 2, 'deudor',   FALSE, 11),
(NULL, '111',  'Disponible',                       'activo', 'encabezado', 3, 'deudor',   FALSE, 12),
(NULL, '1101', 'Caja',                             'activo', 'detalle',    4, 'deudor',   TRUE,  13),
(NULL, '1102', 'Banco Cuenta Corriente',           'activo', 'detalle',    4, 'deudor',   TRUE,  14),
(NULL, '1103', 'Banco Cuenta Vista',               'activo', 'detalle',    4, 'deudor',   TRUE,  15),
(NULL, '1104', 'Fondos por Rendir',                'activo', 'detalle',    4, 'deudor',   TRUE,  16),
(NULL, '1105', 'Depósitos a Plazo',                'activo', 'detalle',    4, 'deudor',   TRUE,  17),
(NULL, '112',  'Cuentas por Cobrar',               'activo', 'encabezado', 3, 'deudor',   FALSE, 20),
(NULL, '1110', 'Clientes',                         'activo', 'detalle',    4, 'deudor',   TRUE,  21),
(NULL, '1111', 'Deudores Varios',                  'activo', 'detalle',    4, 'deudor',   TRUE,  22),
(NULL, '1112', 'Documentos por Cobrar',            'activo', 'detalle',    4, 'deudor',   TRUE,  23),
(NULL, '1113', 'Letras por Cobrar',                'activo', 'detalle',    4, 'deudor',   TRUE,  24),
(NULL, '113',  'Impuestos por Recuperar',          'activo', 'encabezado', 3, 'deudor',   FALSE, 30),
(NULL, '1120', 'IVA Crédito Fiscal',               'activo', 'detalle',    4, 'deudor',   TRUE,  31),
(NULL, '1121', 'PPM Pagos Provisionales Mensuales','activo', 'detalle',    4, 'deudor',   TRUE,  32),
(NULL, '1122', 'Retenciones por Recuperar',        'activo', 'detalle',    4, 'deudor',   TRUE,  33),
(NULL, '1123', 'Impuesto Renta por Recuperar',     'activo', 'detalle',    4, 'deudor',   TRUE,  34),
(NULL, '114',  'Existencias',                      'activo', 'encabezado', 3, 'deudor',   FALSE, 40),
(NULL, '1130', 'Mercaderías',                      'activo', 'detalle',    4, 'deudor',   TRUE,  41),
(NULL, '1131', 'Materias Primas',                  'activo', 'detalle',    4, 'deudor',   TRUE,  42),
(NULL, '1132', 'Productos en Proceso',             'activo', 'detalle',    4, 'deudor',   TRUE,  43),
(NULL, '1133', 'Productos Terminados',             'activo', 'detalle',    4, 'deudor',   TRUE,  44),
(NULL, '115',  'Otros Activos Corrientes',         'activo', 'encabezado', 3, 'deudor',   FALSE, 50),
(NULL, '1140', 'Anticipo a Proveedores',           'activo', 'detalle',    4, 'deudor',   TRUE,  51),
(NULL, '1141', 'Gastos Anticipados',               'activo', 'detalle',    4, 'deudor',   TRUE,  52),
(NULL, '1142', 'Otros Activos Corrientes',         'activo', 'detalle',    4, 'deudor',   TRUE,  53),
(NULL, '12',   'Activos No Corrientes',            'activo', 'encabezado', 2, 'deudor',   FALSE, 60),
(NULL, '121',  'Propiedades Planta y Equipo',      'activo', 'encabezado', 3, 'deudor',   FALSE, 61),
(NULL, '1201', 'Terrenos',                         'activo', 'detalle',    4, 'deudor',   TRUE,  62),
(NULL, '1202', 'Edificios y Construcciones',       'activo', 'detalle',    4, 'deudor',   TRUE,  63),
(NULL, '1203', 'Maquinarias y Equipos',            'activo', 'detalle',    4, 'deudor',   TRUE,  64),
(NULL, '1204', 'Muebles y Útiles',                 'activo', 'detalle',    4, 'deudor',   TRUE,  65),
(NULL, '1205', 'Vehículos',                        'activo', 'detalle',    4, 'deudor',   TRUE,  66),
(NULL, '1206', 'Equipos Computacionales',          'activo', 'detalle',    4, 'deudor',   TRUE,  67),
(NULL, '1207', 'Otros Activos Fijos',              'activo', 'detalle',    4, 'deudor',   TRUE,  68),
(NULL, '1208', 'Depreciación Acumulada',           'activo', 'detalle',    4, 'acreedor', TRUE,  69),
(NULL, '122',  'Intangibles',                      'activo', 'encabezado', 3, 'deudor',   FALSE, 70),
(NULL, '1210', 'Marcas y Patentes',                'activo', 'detalle',    4, 'deudor',   TRUE,  71),
(NULL, '1211', 'Software y Licencias',             'activo', 'detalle',    4, 'deudor',   TRUE,  72),
(NULL, '1212', 'Amortización Acumulada',           'activo', 'detalle',    4, 'acreedor', TRUE,  73),
(NULL, '123',  'Inversiones LP',                   'activo', 'encabezado', 3, 'deudor',   FALSE, 80),
(NULL, '1220', 'Inversiones en Empresas Rel.',     'activo', 'detalle',    4, 'deudor',   TRUE,  81),
(NULL, '1221', 'Otros Activos No Corrientes',      'activo', 'detalle',    4, 'deudor',   TRUE,  82),
(NULL, '1222', 'Impuesto Diferido Activo',         'activo', 'detalle',    4, 'deudor',   TRUE,  83)
ON CONFLICT DO NOTHING;

-- ===== PASIVOS (CLASE 2) =====
INSERT INTO public.plan_cuentas (empresa_id, codigo, nombre, clase, tipo, nivel, saldo_normal, es_imputable, orden) VALUES
(NULL, '2',    'PASIVOS',                          'pasivo', 'encabezado', 1, 'acreedor', FALSE, 200),
(NULL, '21',   'Pasivos Corrientes',               'pasivo', 'encabezado', 2, 'acreedor', FALSE, 201),
(NULL, '211',  'Cuentas por Pagar',                'pasivo', 'encabezado', 3, 'acreedor', FALSE, 202),
(NULL, '2101', 'Proveedores',                      'pasivo', 'detalle',    4, 'acreedor', TRUE,  203),
(NULL, '2102', 'Acreedores Varios',                'pasivo', 'detalle',    4, 'acreedor', TRUE,  204),
(NULL, '2103', 'Documentos por Pagar',             'pasivo', 'detalle',    4, 'acreedor', TRUE,  205),
(NULL, '2104', 'Letras por Pagar',                 'pasivo', 'detalle',    4, 'acreedor', TRUE,  206),
(NULL, '212',  'Impuestos por Pagar',              'pasivo', 'encabezado', 3, 'acreedor', FALSE, 210),
(NULL, '2110', 'IVA Débito Fiscal',                'pasivo', 'detalle',    4, 'acreedor', TRUE,  211),
(NULL, '2111', 'IVA por Pagar (neto)',             'pasivo', 'detalle',    4, 'acreedor', TRUE,  212),
(NULL, '2112', 'Impuesto Renta por Pagar',         'pasivo', 'detalle',    4, 'acreedor', TRUE,  213),
(NULL, '2113', 'PPM por Enterar',                  'pasivo', 'detalle',    4, 'acreedor', TRUE,  214),
(NULL, '2114', 'Retenciones por Enterar',          'pasivo', 'detalle',    4, 'acreedor', TRUE,  215),
(NULL, '2115', 'Impuesto Único 2da Cat.',          'pasivo', 'detalle',    4, 'acreedor', TRUE,  216),
(NULL, '213',  'Obligaciones Laborales',           'pasivo', 'encabezado', 3, 'acreedor', FALSE, 220),
(NULL, '2120', 'Remuneraciones por Pagar',         'pasivo', 'detalle',    4, 'acreedor', TRUE,  221),
(NULL, '2121', 'AFP por Pagar',                    'pasivo', 'detalle',    4, 'acreedor', TRUE,  222),
(NULL, '2122', 'Isapre / Fonasa por Pagar',        'pasivo', 'detalle',    4, 'acreedor', TRUE,  223),
(NULL, '2123', 'AFC por Pagar',                    'pasivo', 'detalle',    4, 'acreedor', TRUE,  224),
(NULL, '2124', 'Mutual por Pagar',                 'pasivo', 'detalle',    4, 'acreedor', TRUE,  225),
(NULL, '2125', 'Vacaciones por Pagar',             'pasivo', 'detalle',    4, 'acreedor', TRUE,  226),
(NULL, '214',  'Otros Pasivos Corrientes',         'pasivo', 'encabezado', 3, 'acreedor', FALSE, 230),
(NULL, '2130', 'Anticipo de Clientes',             'pasivo', 'detalle',    4, 'acreedor', TRUE,  231),
(NULL, '2131', 'Préstamos Bancarios Corto Plazo',  'pasivo', 'detalle',    4, 'acreedor', TRUE,  232),
(NULL, '2132', 'Línea de Crédito',                 'pasivo', 'detalle',    4, 'acreedor', TRUE,  233),
(NULL, '2133', 'Otros Pasivos Corrientes',         'pasivo', 'detalle',    4, 'acreedor', TRUE,  234),
(NULL, '22',   'Pasivos No Corrientes',            'pasivo', 'encabezado', 2, 'acreedor', FALSE, 240),
(NULL, '2201', 'Préstamos Bancarios Largo Plazo',  'pasivo', 'detalle',    4, 'acreedor', TRUE,  241),
(NULL, '2202', 'Leasing por Pagar LP',             'pasivo', 'detalle',    4, 'acreedor', TRUE,  242),
(NULL, '2203', 'Impuesto Diferido Pasivo',         'pasivo', 'detalle',    4, 'acreedor', TRUE,  243),
(NULL, '2204', 'Otros Pasivos No Corrientes',      'pasivo', 'detalle',    4, 'acreedor', TRUE,  244)
ON CONFLICT DO NOTHING;

-- ===== PATRIMONIO (CLASE 3) =====
INSERT INTO public.plan_cuentas (empresa_id, codigo, nombre, clase, tipo, nivel, saldo_normal, es_imputable, orden) VALUES
(NULL, '3',    'PATRIMONIO',                       'patrimonio', 'encabezado', 1, 'acreedor', FALSE, 300),
(NULL, '31',   'Capital',                          'patrimonio', 'encabezado', 2, 'acreedor', FALSE, 301),
(NULL, '3101', 'Capital Pagado',                   'patrimonio', 'detalle',    4, 'acreedor', TRUE,  302),
(NULL, '3102', 'Aportes Pendientes de Capital.',   'patrimonio', 'detalle',    4, 'deudor',   TRUE,  303),
(NULL, '3103', 'Reserva Legal',                    'patrimonio', 'detalle',    4, 'acreedor', TRUE,  304),
(NULL, '3104', 'Reservas Estatutarias',            'patrimonio', 'detalle',    4, 'acreedor', TRUE,  305),
(NULL, '3105', 'Reserva Revalorización Capital',   'patrimonio', 'detalle',    4, 'acreedor', TRUE,  306),
(NULL, '32',   'Resultados',                       'patrimonio', 'encabezado', 2, 'acreedor', FALSE, 310),
(NULL, '3201', 'Utilidades Acumuladas',            'patrimonio', 'detalle',    4, 'acreedor', TRUE,  311),
(NULL, '3202', 'Pérdidas Acumuladas',              'patrimonio', 'detalle',    4, 'deudor',   TRUE,  312),
(NULL, '3203', 'Utilidad del Ejercicio',           'patrimonio', 'detalle',    4, 'acreedor', TRUE,  313),
(NULL, '3204', 'Pérdida del Ejercicio',            'patrimonio', 'detalle',    4, 'deudor',   TRUE,  314),
(NULL, '3205', 'Dividendos Provisorios',           'patrimonio', 'detalle',    4, 'deudor',   TRUE,  315)
ON CONFLICT DO NOTHING;

-- ===== INGRESOS (CLASE 4) =====
INSERT INTO public.plan_cuentas (empresa_id, codigo, nombre, clase, tipo, nivel, saldo_normal, es_imputable, orden) VALUES
(NULL, '4',    'INGRESOS',                         'ingreso', 'encabezado', 1, 'acreedor', FALSE, 400),
(NULL, '41',   'Ingresos Operacionales',           'ingreso', 'encabezado', 2, 'acreedor', FALSE, 401),
(NULL, '4101', 'Ventas Afectas a IVA',             'ingreso', 'detalle',    4, 'acreedor', TRUE,  402),
(NULL, '4102', 'Ventas Exentas de IVA',            'ingreso', 'detalle',    4, 'acreedor', TRUE,  403),
(NULL, '4103', 'Ventas de Servicios Afectos',      'ingreso', 'detalle',    4, 'acreedor', TRUE,  404),
(NULL, '4104', 'Ventas de Servicios Exentos',      'ingreso', 'detalle',    4, 'acreedor', TRUE,  405),
(NULL, '4105', 'Notas de Crédito Emitidas (-)',    'ingreso', 'detalle',    4, 'deudor',   TRUE,  406),
(NULL, '42',   'Otros Ingresos',                   'ingreso', 'encabezado', 2, 'acreedor', FALSE, 410),
(NULL, '4201', 'Ingresos Financieros',             'ingreso', 'detalle',    4, 'acreedor', TRUE,  411),
(NULL, '4202', 'Utilidad en Venta de Activos',     'ingreso', 'detalle',    4, 'acreedor', TRUE,  412),
(NULL, '4203', 'Diferencia de Cambio Favorable',   'ingreso', 'detalle',    4, 'acreedor', TRUE,  413),
(NULL, '4204', 'Otros Ingresos No Operacionales',  'ingreso', 'detalle',    4, 'acreedor', TRUE,  414),
(NULL, '4205', 'Recupero de Gastos',               'ingreso', 'detalle',    4, 'acreedor', TRUE,  415)
ON CONFLICT DO NOTHING;

-- ===== COSTOS (CLASE 5) =====
INSERT INTO public.plan_cuentas (empresa_id, codigo, nombre, clase, tipo, nivel, saldo_normal, es_imputable, orden) VALUES
(NULL, '5',    'COSTOS',                           'costo', 'encabezado', 1, 'deudor',   FALSE, 500),
(NULL, '51',   'Costo de Ventas',                  'costo', 'encabezado', 2, 'deudor',   FALSE, 501),
(NULL, '5101', 'Costo Mercaderías Vendidas',       'costo', 'detalle',    4, 'deudor',   TRUE,  502),
(NULL, '5102', 'Costo Servicios Prestados',        'costo', 'detalle',    4, 'deudor',   TRUE,  503),
(NULL, '5103', 'Materias Primas Consumidas',       'costo', 'detalle',    4, 'deudor',   TRUE,  504),
(NULL, '5104', 'Mano de Obra Directa',             'costo', 'detalle',    4, 'deudor',   TRUE,  505),
(NULL, '5105', 'Gastos de Fabricación',            'costo', 'detalle',    4, 'deudor',   TRUE,  506)
ON CONFLICT DO NOTHING;

-- ===== GASTOS (CLASE 6) =====
INSERT INTO public.plan_cuentas (empresa_id, codigo, nombre, clase, tipo, nivel, saldo_normal, es_imputable, orden) VALUES
(NULL, '6',    'GASTOS',                           'gasto', 'encabezado', 1, 'deudor',   FALSE, 600),
(NULL, '61',   'Gastos de Administración',         'gasto', 'encabezado', 2, 'deudor',   FALSE, 601),
(NULL, '6101', 'Remuneraciones Personal Admin.',   'gasto', 'detalle',    4, 'deudor',   TRUE,  602),
(NULL, '6102', 'Gratificaciones',                  'gasto', 'detalle',    4, 'deudor',   TRUE,  603),
(NULL, '6103', 'Leyes Sociales',                   'gasto', 'detalle',    4, 'deudor',   TRUE,  604),
(NULL, '6104', 'Honorarios',                       'gasto', 'detalle',    4, 'deudor',   TRUE,  605),
(NULL, '6105', 'Arriendos y Arrendamientos',       'gasto', 'detalle',    4, 'deudor',   TRUE,  606),
(NULL, '6106', 'Luz, Agua y Gas',                  'gasto', 'detalle',    4, 'deudor',   TRUE,  607),
(NULL, '6107', 'Comunicaciones',                   'gasto', 'detalle',    4, 'deudor',   TRUE,  608),
(NULL, '6108', 'Materiales de Oficina',            'gasto', 'detalle',    4, 'deudor',   TRUE,  609),
(NULL, '6109', 'Seguros',                          'gasto', 'detalle',    4, 'deudor',   TRUE,  610),
(NULL, '6110', 'Mantención y Reparaciones',        'gasto', 'detalle',    4, 'deudor',   TRUE,  611),
(NULL, '6111', 'Depreciación del Ejercicio',       'gasto', 'detalle',    4, 'deudor',   TRUE,  612),
(NULL, '6112', 'Amortización Intangibles',         'gasto', 'detalle',    4, 'deudor',   TRUE,  613),
(NULL, '6113', 'Gastos Generales Admin.',          'gasto', 'detalle',    4, 'deudor',   TRUE,  614),
(NULL, '6114', 'Corrección Monetaria',             'gasto', 'detalle',    4, 'deudor',   TRUE,  615),
(NULL, '62',   'Gastos de Ventas',                 'gasto', 'encabezado', 2, 'deudor',   FALSE, 620),
(NULL, '6201', 'Remuneraciones Ventas',            'gasto', 'detalle',    4, 'deudor',   TRUE,  621),
(NULL, '6202', 'Comisiones de Venta',              'gasto', 'detalle',    4, 'deudor',   TRUE,  622),
(NULL, '6203', 'Publicidad y Marketing',           'gasto', 'detalle',    4, 'deudor',   TRUE,  623),
(NULL, '6204', 'Flete y Distribución',             'gasto', 'detalle',    4, 'deudor',   TRUE,  624),
(NULL, '6205', 'Garantías y Devoluciones',         'gasto', 'detalle',    4, 'deudor',   TRUE,  625),
(NULL, '6206', 'Gastos Generales Ventas',          'gasto', 'detalle',    4, 'deudor',   TRUE,  626),
(NULL, '63',   'Gastos Financieros',               'gasto', 'encabezado', 2, 'deudor',   FALSE, 630),
(NULL, '6301', 'Intereses Bancarios',              'gasto', 'detalle',    4, 'deudor',   TRUE,  631),
(NULL, '6302', 'Comisiones Bancarias',             'gasto', 'detalle',    4, 'deudor',   TRUE,  632),
(NULL, '6303', 'Diferencia de Cambio Desfav.',     'gasto', 'detalle',    4, 'deudor',   TRUE,  633),
(NULL, '6304', 'Gastos de Financiamiento',         'gasto', 'detalle',    4, 'deudor',   TRUE,  634),
(NULL, '6305', 'Pérdida en Venta de Activos',      'gasto', 'detalle',    4, 'deudor',   TRUE,  635)
ON CONFLICT DO NOTHING;

-- Actualizar cuenta_padre_id usando los códigos (para los registros template)
UPDATE public.plan_cuentas pc
SET cuenta_padre_id = padre.id
FROM public.plan_cuentas padre
WHERE padre.empresa_id IS NULL
  AND pc.empresa_id IS NULL
  AND pc.cuenta_padre_id IS NULL
  AND pc.nivel > 1
  AND (
    (pc.nivel = 2 AND padre.codigo = LEFT(pc.codigo, 1) AND padre.nivel = 1)
    OR (pc.nivel = 3 AND padre.codigo = LEFT(pc.codigo, 2) AND padre.nivel = 2)
    OR (pc.nivel = 4 AND padre.codigo = LEFT(pc.codigo, 3) AND padre.nivel = 3)
    OR (pc.nivel = 4 AND padre.codigo = LEFT(pc.codigo, 2) AND padre.nivel = 2
        AND NOT EXISTS (
          SELECT 1 FROM public.plan_cuentas x
          WHERE x.empresa_id IS NULL AND x.nivel = 3
          AND x.codigo = LEFT(pc.codigo, 3)
        ))
  );


-- ============================================================
-- MIGRACIÓN: 003_compras_ventas.sql
-- ============================================================
-- ============================================================
-- ERP SaaS Chile — Migración 003: Compras y Ventas
-- Proveedores, Clientes, Documentos tributarios
-- ============================================================

-- ============================================================
-- ENUMS como dominios de texto (CHECK constraints)
-- ============================================================

-- ============================================================
-- TABLA: proveedores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.proveedores (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id          UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rut                 VARCHAR(12) NOT NULL,
  razon_social        VARCHAR(200) NOT NULL,
  nombre_fantasia     VARCHAR(200),
  giro                VARCHAR(200),
  direccion           VARCHAR(300),
  comuna              VARCHAR(100),
  ciudad              VARCHAR(100),
  region              VARCHAR(100),
  telefono            VARCHAR(30),
  email               VARCHAR(100),
  sitio_web           VARCHAR(200),
  contacto_nombre     VARCHAR(100),
  contacto_telefono   VARCHAR(30),
  contacto_email      VARCHAR(100),
  condicion_pago      SMALLINT DEFAULT 30,
  cuenta_contable_id  UUID REFERENCES public.plan_cuentas(id),
  notas               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  created_by          UUID REFERENCES auth.users(id),
  UNIQUE(empresa_id, rut)
);

-- ============================================================
-- TABLA: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id          UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rut                 VARCHAR(12) NOT NULL,
  razon_social        VARCHAR(200) NOT NULL,
  nombre_fantasia     VARCHAR(200),
  giro                VARCHAR(200),
  direccion           VARCHAR(300),
  comuna              VARCHAR(100),
  ciudad              VARCHAR(100),
  region              VARCHAR(100),
  telefono            VARCHAR(30),
  email               VARCHAR(100),
  sitio_web           VARCHAR(200),
  contacto_nombre     VARCHAR(100),
  contacto_telefono   VARCHAR(30),
  contacto_email      VARCHAR(100),
  condicion_pago      SMALLINT DEFAULT 30,
  limite_credito      NUMERIC(18,2),
  cuenta_contable_id  UUID REFERENCES public.plan_cuentas(id),
  notas               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  created_by          UUID REFERENCES auth.users(id),
  UNIQUE(empresa_id, rut)
);

-- ============================================================
-- TABLA: tipos_documento (catálogo SII)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tipos_documento (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo      VARCHAR(10) NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  abreviatura VARCHAR(20) NOT NULL,
  afecto_iva  BOOLEAN NOT NULL DEFAULT TRUE,
  es_compra   BOOLEAN NOT NULL DEFAULT TRUE,
  es_venta    BOOLEAN NOT NULL DEFAULT TRUE,
  es_electronico BOOLEAN NOT NULL DEFAULT FALSE,
  orden       INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- TABLA: documentos_compra
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documentos_compra (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id          UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  proveedor_id        UUID NOT NULL REFERENCES public.proveedores(id),
  tipo_documento_id   UUID NOT NULL REFERENCES public.tipos_documento(id),
  numero_documento    VARCHAR(20) NOT NULL,
  fecha_emision       DATE NOT NULL,
  fecha_vencimiento   DATE,
  fecha_recepcion     DATE,
  periodo_id          UUID REFERENCES public.periodos_contables(id),
  neto                NUMERIC(18,2) NOT NULL DEFAULT 0,
  iva                 NUMERIC(18,2) NOT NULL DEFAULT 0,
  exento              NUMERIC(18,2) NOT NULL DEFAULT 0,
  total               NUMERIC(18,2) NOT NULL DEFAULT 0,
  tasa_iva            NUMERIC(5,2) NOT NULL DEFAULT 19.00,
  es_afecto           BOOLEAN NOT NULL DEFAULT TRUE,
  estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente','contabilizado','pagado','anulado')),
  comprobante_id      UUID REFERENCES public.comprobantes(id),
  referencia          VARCHAR(100),
  glosa               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  created_by          UUID REFERENCES auth.users(id),
  UNIQUE(empresa_id, proveedor_id, tipo_documento_id, numero_documento)
);

-- ============================================================
-- TABLA: documentos_venta
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documentos_venta (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id          UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id          UUID NOT NULL REFERENCES public.clientes(id),
  tipo_documento_id   UUID NOT NULL REFERENCES public.tipos_documento(id),
  numero_documento    VARCHAR(20) NOT NULL,
  fecha_emision       DATE NOT NULL,
  fecha_vencimiento   DATE,
  periodo_id          UUID REFERENCES public.periodos_contables(id),
  neto                NUMERIC(18,2) NOT NULL DEFAULT 0,
  iva                 NUMERIC(18,2) NOT NULL DEFAULT 0,
  exento              NUMERIC(18,2) NOT NULL DEFAULT 0,
  total               NUMERIC(18,2) NOT NULL DEFAULT 0,
  tasa_iva            NUMERIC(5,2) NOT NULL DEFAULT 19.00,
  es_afecto           BOOLEAN NOT NULL DEFAULT TRUE,
  estado              VARCHAR(20) NOT NULL DEFAULT 'emitido'
                        CHECK (estado IN ('emitido','contabilizado','cobrado','anulado')),
  comprobante_id      UUID REFERENCES public.comprobantes(id),
  referencia          VARCHAR(100),
  glosa               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  created_by          UUID REFERENCES auth.users(id),
  UNIQUE(empresa_id, tipo_documento_id, numero_documento)
);

-- ============================================================
-- TABLA: detalle_documentos (líneas de detalle de compras/ventas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.detalle_documentos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  documento_tipo    VARCHAR(10) NOT NULL CHECK (documento_tipo IN ('compra','venta')),
  documento_id      UUID NOT NULL,
  empresa_id        UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  descripcion       VARCHAR(500) NOT NULL,
  cantidad          NUMERIC(14,4) NOT NULL DEFAULT 1,
  precio_unitario   NUMERIC(18,2) NOT NULL DEFAULT 0,
  descuento_pct     NUMERIC(5,2) DEFAULT 0,
  neto_linea        NUMERIC(18,2) NOT NULL DEFAULT 0,
  producto_id       UUID,
  orden             INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_proveedores_empresa ON public.proveedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_rut ON public.proveedores(empresa_id, rut);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_rut ON public.clientes(empresa_id, rut);
CREATE INDEX IF NOT EXISTS idx_doc_compra_empresa ON public.documentos_compra(empresa_id);
CREATE INDEX IF NOT EXISTS idx_doc_compra_proveedor ON public.documentos_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_doc_compra_fecha ON public.documentos_compra(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_doc_venta_empresa ON public.documentos_venta(empresa_id);
CREATE INDEX IF NOT EXISTS idx_doc_venta_cliente ON public.documentos_venta(cliente_id);
CREATE INDEX IF NOT EXISTS idx_doc_venta_fecha ON public.documentos_venta(fecha_emision);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE TRIGGER trigger_proveedores_updated_at
  BEFORE UPDATE ON public.proveedores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_doc_compra_updated_at
  BEFORE UPDATE ON public.documentos_compra
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_doc_venta_updated_at
  BEFORE UPDATE ON public.documentos_venta
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCIÓN: calcular totales documento compra
-- ============================================================
CREATE OR REPLACE FUNCTION public.calcular_totales_documento_compra()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_afecto THEN
    NEW.iva := ROUND(NEW.neto * NEW.tasa_iva / 100, 0);
  ELSE
    NEW.iva := 0;
    NEW.exento := NEW.neto;
    NEW.neto := 0;
  END IF;
  NEW.total := NEW.neto + NEW.iva + NEW.exento;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_totales_compra
  BEFORE INSERT OR UPDATE OF neto, tasa_iva, es_afecto, exento
  ON public.documentos_compra
  FOR EACH ROW EXECUTE FUNCTION public.calcular_totales_documento_compra();

CREATE OR REPLACE FUNCTION public.calcular_totales_documento_venta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_afecto THEN
    NEW.iva := ROUND(NEW.neto * NEW.tasa_iva / 100, 0);
  ELSE
    NEW.iva := 0;
    NEW.exento := NEW.neto;
    NEW.neto := 0;
  END IF;
  NEW.total := NEW.neto + NEW.iva + NEW.exento;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_totales_venta
  BEFORE INSERT OR UPDATE OF neto, tasa_iva, es_afecto, exento
  ON public.documentos_venta
  FOR EACH ROW EXECUTE FUNCTION public.calcular_totales_documento_venta();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proveedores_empresa"
  ON public.proveedores FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "clientes_empresa"
  ON public.clientes FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "tipos_documento_read"
  ON public.tipos_documento FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "doc_compra_empresa"
  ON public.documentos_compra FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "doc_venta_empresa"
  ON public.documentos_venta FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "detalle_doc_empresa"
  ON public.detalle_documentos FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE));

-- ============================================================
-- SEED: Tipos de documento SII Chile
-- ============================================================
INSERT INTO public.tipos_documento (codigo, nombre, abreviatura, afecto_iva, es_compra, es_venta, es_electronico, orden) VALUES
  ('33',  'Factura Afecta',                       'FA',   TRUE,  TRUE,  TRUE,  TRUE,  10),
  ('34',  'Factura No Afecta o Exenta',            'FE',   FALSE, TRUE,  TRUE,  TRUE,  11),
  ('39',  'Boleta Afecta',                         'BA',   TRUE,  FALSE, TRUE,  TRUE,  12),
  ('41',  'Boleta No Afecta o Exenta',             'BE',   FALSE, FALSE, TRUE,  TRUE,  13),
  ('46',  'Liquidación Factura',                   'LF',   TRUE,  TRUE,  TRUE,  TRUE,  14),
  ('52',  'Guía de Despacho',                      'GD',   TRUE,  FALSE, TRUE,  TRUE,  15),
  ('56',  'Nota de Débito',                        'ND',   TRUE,  TRUE,  TRUE,  TRUE,  20),
  ('61',  'Nota de Crédito',                       'NC',   TRUE,  TRUE,  TRUE,  TRUE,  21),
  ('110', 'Factura de Exportación',                'FX',   FALSE, TRUE,  TRUE,  TRUE,  30),
  ('111', 'Nota de Débito de Exportación',         'NDX',  FALSE, TRUE,  TRUE,  TRUE,  31),
  ('112', 'Nota de Crédito de Exportación',        'NCX',  FALSE, TRUE,  TRUE,  TRUE,  32),
  ('35',  'Factura Afecta (Papel)',                'FAP',  TRUE,  TRUE,  TRUE,  FALSE, 50),
  ('38',  'Factura Exenta (Papel)',                'FEP',  FALSE, TRUE,  TRUE,  FALSE, 51),
  ('45',  'Liquidación Factura (Papel)',           'LFP',  TRUE,  TRUE,  TRUE,  FALSE, 52),
  ('55',  'Nota de Débito (Papel)',                'NDP',  TRUE,  TRUE,  TRUE,  FALSE, 53),
  ('60',  'Nota de Crédito (Papel)',               'NCP',  TRUE,  TRUE,  TRUE,  FALSE, 54),
  ('101', 'Factura de Compra',                     'FC',   TRUE,  TRUE,  FALSE, TRUE,  60),
  ('102', 'Liquidación',                           'LQ',   TRUE,  TRUE,  FALSE, TRUE,  61)
ON CONFLICT (codigo) DO NOTHING;


-- ============================================================
-- MIGRACIÓN: 004_tributacion.sql
-- ============================================================
-- ============================================================
-- ERP SaaS Chile — Migración 004: Tributación Chilena
-- Libro IVA Compras/Ventas, Declaración F29, PPM
-- ============================================================

-- ============================================================
-- TABLA: declaraciones_f29
-- Declaración mensual de IVA (Formulario 29)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.declaraciones_f29 (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id            UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo_mes           SMALLINT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio          SMALLINT NOT NULL CHECK (periodo_anio >= 2000),
  estado                VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'presentada', 'rectificatoria')),
  -- IVA Débito Fiscal
  debito_ventas_afectas BIGINT NOT NULL DEFAULT 0,
  debito_notas_credito  BIGINT NOT NULL DEFAULT 0,
  debito_notas_debito   BIGINT NOT NULL DEFAULT 0,
  total_debito_fiscal   BIGINT NOT NULL DEFAULT 0,
  -- IVA Crédito Fiscal
  credito_compras       BIGINT NOT NULL DEFAULT 0,
  credito_activo_fijo   BIGINT NOT NULL DEFAULT 0,
  credito_notas_credito BIGINT NOT NULL DEFAULT 0,
  credito_notas_debito  BIGINT NOT NULL DEFAULT 0,
  total_credito_fiscal  BIGINT NOT NULL DEFAULT 0,
  -- Resultado IVA
  iva_a_pagar           BIGINT NOT NULL DEFAULT 0,
  remanente_credito     BIGINT NOT NULL DEFAULT 0,
  -- PPM (Pagos Provisionales Mensuales)
  ppm_base_imponible    BIGINT NOT NULL DEFAULT 0,
  ppm_tasa              NUMERIC(6,4) NOT NULL DEFAULT 0,
  ppm_monto             BIGINT NOT NULL DEFAULT 0,
  -- Total a pagar
  total_a_pagar         BIGINT NOT NULL DEFAULT 0,
  -- Metadatos
  fecha_presentacion    DATE,
  folio_sii             VARCHAR(50),
  observaciones         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES auth.users(id),
  UNIQUE(empresa_id, periodo_mes, periodo_anio)
);

-- ============================================================
-- TABLA: libro_iva_compras
-- Vista materializada / tabla de cálculo de IVA compras
-- ============================================================
CREATE TABLE IF NOT EXISTS public.libro_iva_compras (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id        UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo_mes       SMALLINT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio      SMALLINT NOT NULL CHECK (periodo_anio >= 2000),
  documento_id      UUID NOT NULL REFERENCES public.documentos_compra(id) ON DELETE CASCADE,
  -- datos desnormalizados para el libro
  fecha_emision     DATE NOT NULL,
  tipo_doc_codigo   VARCHAR(20) NOT NULL,
  numero_documento  VARCHAR(50) NOT NULL,
  rut_proveedor     VARCHAR(12) NOT NULL,
  razon_social      VARCHAR(200) NOT NULL,
  neto              BIGINT NOT NULL DEFAULT 0,
  exento            BIGINT NOT NULL DEFAULT 0,
  iva               BIGINT NOT NULL DEFAULT 0,
  total             BIGINT NOT NULL DEFAULT 0,
  es_activo_fijo    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, documento_id)
);

-- ============================================================
-- TABLA: libro_iva_ventas
-- Vista materializada / tabla de cálculo de IVA ventas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.libro_iva_ventas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id        UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo_mes       SMALLINT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio      SMALLINT NOT NULL CHECK (periodo_anio >= 2000),
  documento_id      UUID NOT NULL REFERENCES public.documentos_venta(id) ON DELETE CASCADE,
  fecha_emision     DATE NOT NULL,
  tipo_doc_codigo   VARCHAR(20) NOT NULL,
  numero_documento  VARCHAR(50) NOT NULL,
  rut_cliente       VARCHAR(12) NOT NULL,
  razon_social      VARCHAR(200) NOT NULL,
  neto              BIGINT NOT NULL DEFAULT 0,
  exento            BIGINT NOT NULL DEFAULT 0,
  iva               BIGINT NOT NULL DEFAULT 0,
  total             BIGINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, documento_id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_f29_empresa_periodo ON public.declaraciones_f29(empresa_id, periodo_anio, periodo_mes);
CREATE INDEX IF NOT EXISTS idx_libro_compras_periodo ON public.libro_iva_compras(empresa_id, periodo_anio, periodo_mes);
CREATE INDEX IF NOT EXISTS idx_libro_ventas_periodo ON public.libro_iva_ventas(empresa_id, periodo_anio, periodo_mes);

-- ============================================================
-- FUNCIÓN: calcular_f29
-- Recalcula totales de IVA desde documentos del período
-- ============================================================
CREATE OR REPLACE FUNCTION public.calcular_f29(
  p_empresa_id  UUID,
  p_mes         SMALLINT,
  p_anio        SMALLINT
)
RETURNS TABLE(
  debito_fiscal    BIGINT,
  credito_fiscal   BIGINT,
  iva_a_pagar      BIGINT,
  remanente        BIGINT
) AS $$
DECLARE
  v_debito    BIGINT := 0;
  v_credito   BIGINT := 0;
BEGIN
  -- Débito fiscal: suma IVA de ventas afectas emitidas en el período
  SELECT COALESCE(SUM(dv.iva), 0) INTO v_debito
  FROM public.documentos_venta dv
  JOIN public.tipos_documento td ON td.id = dv.tipo_documento_id
  WHERE dv.empresa_id = p_empresa_id
    AND EXTRACT(MONTH FROM dv.fecha_emision) = p_mes
    AND EXTRACT(YEAR FROM dv.fecha_emision) = p_anio
    AND dv.estado != 'anulado'
    AND dv.es_afecto = TRUE
    AND td.afecta_iva_debito = TRUE;

  -- Crédito fiscal: suma IVA de compras afectas del período
  SELECT COALESCE(SUM(dc.iva), 0) INTO v_credito
  FROM public.documentos_compra dc
  JOIN public.tipos_documento td ON td.id = dc.tipo_documento_id
  WHERE dc.empresa_id = p_empresa_id
    AND EXTRACT(MONTH FROM dc.fecha_emision) = p_mes
    AND EXTRACT(YEAR FROM dc.fecha_emision) = p_anio
    AND dc.estado != 'anulado'
    AND dc.es_afecto = TRUE
    AND td.afecta_iva_credito = TRUE;

  debito_fiscal  := v_debito;
  credito_fiscal := v_credito;

  IF v_debito > v_credito THEN
    iva_a_pagar := v_debito - v_credito;
    remanente   := 0;
  ELSE
    iva_a_pagar := 0;
    remanente   := v_credito - v_debito;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: updated_at en declaraciones_f29
-- ============================================================
CREATE TRIGGER trg_f29_updated_at
  BEFORE UPDATE ON public.declaraciones_f29
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.declaraciones_f29 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.libro_iva_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.libro_iva_ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_declaraciones_f29" ON public.declaraciones_f29
  USING (empresa_id IN (
    SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
  ));

CREATE POLICY "empresa_libro_compras" ON public.libro_iva_compras
  USING (empresa_id IN (
    SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
  ));

CREATE POLICY "empresa_libro_ventas" ON public.libro_iva_ventas
  USING (empresa_id IN (
    SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
  ));

-- ============================================================
-- Agregar columnas de control IVA en tipos_documento
-- ============================================================
ALTER TABLE public.tipos_documento
  ADD COLUMN IF NOT EXISTS afecta_iva_debito  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS afecta_iva_credito BOOLEAN NOT NULL DEFAULT FALSE;

-- Actualizar tipos que afectan débito (ventas: FA, FE, ND)
UPDATE public.tipos_documento SET afecta_iva_debito = TRUE
WHERE codigo IN ('33', '34', '56');

-- Actualizar tipos que afectan crédito (compras: FA, FE, ND)
UPDATE public.tipos_documento SET afecta_iva_credito = TRUE
WHERE codigo IN ('33', '34', '56');


-- ============================================================
-- MIGRACIÓN: 005_remuneraciones.sql
-- ============================================================
-- ============================================================
-- ERP SaaS Chile — Migración 005: Remuneraciones
-- Trabajadores, contratos, liquidaciones, cálculos chile
-- ============================================================

-- ============================================================
-- TABLA: trabajadores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trabajadores (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id          UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rut                 VARCHAR(12) NOT NULL,
  nombre              VARCHAR(100) NOT NULL,
  apellido_paterno    VARCHAR(100) NOT NULL,
  apellido_materno    VARCHAR(100),
  fecha_nacimiento    DATE,
  genero              VARCHAR(10) CHECK (genero IN ('masculino', 'femenino', 'otro')),
  estado_civil        VARCHAR(20),
  nacionalidad        VARCHAR(60) DEFAULT 'Chilena',
  email               VARCHAR(200),
  telefono            VARCHAR(20),
  direccion           VARCHAR(300),
  comuna              VARCHAR(100),
  ciudad              VARCHAR(100),
  -- Datos previsionales
  afp_id              UUID,
  isapre_id           UUID,
  tipo_afiliacion     VARCHAR(20) DEFAULT 'afp' CHECK (tipo_afiliacion IN ('afp', 'ips', 'ninguno')),
  -- Estado
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  UNIQUE(empresa_id, rut)
);

-- ============================================================
-- TABLA: afp (catálogo)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.afp (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      VARCHAR(100) NOT NULL,
  tasa        NUMERIC(6,4) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.afp (nombre, tasa) VALUES
  ('Capital',      10.44),
  ('Cuprum',       10.48),
  ('Habitat',      10.27),
  ('PlanVital',    11.27),
  ('ProVida',      10.58),
  ('Modelo',       10.26),
  ('Uno',          10.49)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLA: isapres (catálogo)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.isapres (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      VARCHAR(100) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.isapres (nombre) VALUES
  ('Banmédica'), ('Colmena Golden Cross'), ('Consalud'), ('Cruz Blanca'),
  ('Cruz del Norte'), ('Más Vida'), ('Nueva Masvida'), ('Vida Tres'),
  ('Fonasa')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLA: contratos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contratos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id          UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  trabajador_id       UUID NOT NULL REFERENCES public.trabajadores(id) ON DELETE CASCADE,
  tipo_contrato       VARCHAR(30) NOT NULL DEFAULT 'indefinido'
                        CHECK (tipo_contrato IN ('indefinido', 'plazo_fijo', 'obra', 'honorarios', 'part_time')),
  cargo               VARCHAR(200),
  departamento        VARCHAR(200),
  fecha_inicio        DATE NOT NULL,
  fecha_termino       DATE,
  sueldo_base         BIGINT NOT NULL DEFAULT 0,
  jornada_horas       SMALLINT NOT NULL DEFAULT 45,
  gratificacion_tipo  VARCHAR(20) NOT NULL DEFAULT 'legal'
                        CHECK (gratificacion_tipo IN ('legal', 'garantizada', 'proporcional', 'ninguna')),
  es_activo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: liquidaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.liquidaciones (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id            UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  trabajador_id         UUID NOT NULL REFERENCES public.trabajadores(id) ON DELETE CASCADE,
  contrato_id           UUID REFERENCES public.contratos(id),
  periodo_mes           SMALLINT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio          SMALLINT NOT NULL CHECK (periodo_anio >= 2000),
  estado                VARCHAR(20) NOT NULL DEFAULT 'borrador'
                          CHECK (estado IN ('borrador', 'aprobada', 'pagada', 'anulada')),
  -- Haberes imponibles
  sueldo_base           BIGINT NOT NULL DEFAULT 0,
  horas_extra           SMALLINT NOT NULL DEFAULT 0,
  valor_hora_extra      BIGINT NOT NULL DEFAULT 0,
  monto_horas_extra     BIGINT NOT NULL DEFAULT 0,
  gratificacion         BIGINT NOT NULL DEFAULT 0,
  otros_haberes_impon   BIGINT NOT NULL DEFAULT 0,
  total_imponible       BIGINT NOT NULL DEFAULT 0,
  -- Haberes no imponibles
  asig_movilizacion     BIGINT NOT NULL DEFAULT 0,
  asig_colacion         BIGINT NOT NULL DEFAULT 0,
  viaticos              BIGINT NOT NULL DEFAULT 0,
  otros_no_imponibles   BIGINT NOT NULL DEFAULT 0,
  total_no_imponible    BIGINT NOT NULL DEFAULT 0,
  -- Descuentos legales
  afp_tasa              NUMERIC(6,4) NOT NULL DEFAULT 0,
  afp_monto             BIGINT NOT NULL DEFAULT 0,
  isapre_monto          BIGINT NOT NULL DEFAULT 0,
  seguro_cesantia       BIGINT NOT NULL DEFAULT 0,
  impuesto_2da_cat      BIGINT NOT NULL DEFAULT 0,
  -- Otros descuentos
  otros_descuentos      BIGINT NOT NULL DEFAULT 0,
  total_descuentos      BIGINT NOT NULL DEFAULT 0,
  -- Totales
  sueldo_liquido        BIGINT NOT NULL DEFAULT 0,
  -- Aportes empleador
  aporte_scs            BIGINT NOT NULL DEFAULT 0,
  aporte_mutualidad     BIGINT NOT NULL DEFAULT 0,
  aporte_seguro_ces_emp BIGINT NOT NULL DEFAULT 0,
  -- Metadatos
  dias_trabajados       SMALLINT NOT NULL DEFAULT 30,
  observaciones         TEXT,
  fecha_pago            DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES auth.users(id),
  UNIQUE(empresa_id, trabajador_id, periodo_mes, periodo_anio)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_trabajadores_empresa ON public.trabajadores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contratos_trabajador ON public.contratos(trabajador_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_empresa_periodo ON public.liquidaciones(empresa_id, periodo_anio, periodo_mes);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_trabajador ON public.liquidaciones(trabajador_id);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE TRIGGER trg_trabajadores_updated_at
  BEFORE UPDATE ON public.trabajadores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_liquidaciones_updated_at
  BEFORE UPDATE ON public.liquidaciones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.trabajadores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidaciones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afp              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.isapres          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_trabajadores" ON public.trabajadores
  USING (empresa_id IN (
    SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
  ));

CREATE POLICY "empresa_contratos" ON public.contratos
  USING (empresa_id IN (
    SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
  ));

CREATE POLICY "empresa_liquidaciones" ON public.liquidaciones
  USING (empresa_id IN (
    SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
  ));

CREATE POLICY "public_afp" ON public.afp FOR SELECT USING (TRUE);
CREATE POLICY "public_isapres" ON public.isapres FOR SELECT USING (TRUE);


-- ============================================================
-- MIGRACIÓN: 006_rls_fixes.sql
-- ============================================================
-- ============================================================
-- ERP SaaS Chile — Migración 006: Fixes de políticas RLS
-- Agrega políticas INSERT/UPDATE faltantes
-- ============================================================

-- ============================================================
-- empresas: INSERT y UPDATE
-- ============================================================
CREATE POLICY "empresas_insert_authenticated"
  ON public.empresas FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "empresas_update_member"
  ON public.empresas FOR UPDATE
  USING (
    id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- empresa_usuarios: INSERT y UPDATE
-- ============================================================
CREATE POLICY "empresa_usuarios_insert_member"
  ON public.empresa_usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Solo puede agregar usuarios a empresas donde ya es miembro activo
    -- O si está creando la primera asignación para sí mismo
    (
      empresa_id IN (
        SELECT empresa_id FROM public.empresa_usuarios
        WHERE user_id = auth.uid() AND is_active = TRUE
      )
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "empresa_usuarios_update_member"
  ON public.empresa_usuarios FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- roles: INSERT y UPDATE (para admins de empresa)
-- ============================================================
CREATE POLICY "roles_insert_member"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
    OR empresa_id IS NULL
  );

-- ============================================================
-- trabajadores: INSERT y UPDATE
-- ============================================================
CREATE POLICY "trabajadores_insert_member"
  ON public.trabajadores FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "trabajadores_update_member"
  ON public.trabajadores FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- contratos: INSERT y UPDATE
-- ============================================================
CREATE POLICY "contratos_insert_member"
  ON public.contratos FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "contratos_update_member"
  ON public.contratos FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- liquidaciones: INSERT y UPDATE
-- ============================================================
CREATE POLICY "liquidaciones_insert_member"
  ON public.liquidaciones FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "liquidaciones_update_member"
  ON public.liquidaciones FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- declaraciones_f29: INSERT y UPDATE
-- ============================================================
CREATE POLICY "f29_insert_member"
  ON public.declaraciones_f29 FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "f29_update_member"
  ON public.declaraciones_f29 FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );


-- ============================================================
-- MIGRACIÓN: 007_config_contable.sql
-- ============================================================
-- ============================================================
-- ERP SaaS Chile — Migración 007: Configuración contable
-- Tabla para mapeo de cuentas base por empresa (para centralización automática)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.config_contable (
  empresa_id    UUID PRIMARY KEY REFERENCES public.empresas(id) ON DELETE CASCADE,
  -- Cuentas para IVA
  cuenta_iva_cf_id  UUID REFERENCES public.plan_cuentas(id),  -- IVA Crédito Fiscal
  cuenta_iva_df_id  UUID REFERENCES public.plan_cuentas(id),  -- IVA Débito Fiscal
  -- Cuentas para documentos
  cuenta_cxc_id     UUID REFERENCES public.plan_cuentas(id),  -- Cuentas por Cobrar (ventas)
  cuenta_cxp_id     UUID REFERENCES public.plan_cuentas(id),  -- Cuentas por Pagar (compras)
  cuenta_ingreso_id UUID REFERENCES public.plan_cuentas(id),  -- Ingresos por ventas
  cuenta_gasto_id   UUID REFERENCES public.plan_cuentas(id),  -- Gastos/compras
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_by    UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.config_contable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_contable_select_member"
  ON public.config_contable FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "config_contable_insert_member"
  ON public.config_contable FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "config_contable_update_member"
  ON public.config_contable FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );


-- ============================================================
-- MIGRACIÓN: 008_rli.sql
-- ============================================================
-- ============================================================
-- Fase 10: Renta Líquida Imponible (RLI)
-- ============================================================

CREATE TABLE rli_ajustes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  anio        INTEGER     NOT NULL,
  tipo        TEXT        NOT NULL CHECK (tipo IN ('agrega', 'deduce')),
  concepto    TEXT        NOT NULL,
  monto       NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID        REFERENCES auth.users(id)
);

CREATE INDEX idx_rli_ajustes_empresa_anio ON rli_ajustes(empresa_id, anio);

ALTER TABLE rli_ajustes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rli_select"  ON rli_ajustes FOR SELECT  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "rli_insert"  ON rli_ajustes FOR INSERT  WITH CHECK (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "rli_update"  ON rli_ajustes FOR UPDATE  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "rli_delete"  ON rli_ajustes FOR DELETE  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));


-- ============================================================
-- MIGRACIÓN: 009_gestion_documental.sql
-- ============================================================
-- ============================================================
-- Fase 12: Gestión Documental
-- NOTA: Crear bucket 'documentos' en Supabase Storage antes de usar subidas
-- ============================================================

CREATE TABLE documentos_gestion (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo              TEXT        NOT NULL DEFAULT 'otro'
                                CHECK (tipo IN ('dte','contrato','liquidacion','nomina','certificado','otro')),
  nombre            TEXT        NOT NULL,
  descripcion       TEXT,
  url_externo       TEXT,
  storage_path      TEXT,
  mime_type         TEXT,
  tamano            BIGINT,
  referencia_tabla  TEXT,
  referencia_id     UUID,
  estado            TEXT        NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','archivado')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_doc_gestion_empresa ON documentos_gestion(empresa_id, estado);
CREATE INDEX idx_doc_gestion_tipo    ON documentos_gestion(empresa_id, tipo);
CREATE INDEX idx_doc_gestion_ref     ON documentos_gestion(referencia_tabla, referencia_id);

ALTER TABLE documentos_gestion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_gestion_select" ON documentos_gestion FOR SELECT
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true)
         AND deleted_at IS NULL);
CREATE POLICY "doc_gestion_insert" ON documentos_gestion FOR INSERT
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "doc_gestion_update" ON documentos_gestion FOR UPDATE
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "doc_gestion_delete" ON documentos_gestion FOR DELETE
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));


-- ============================================================
-- MIGRACIÓN: 010_workflows.sql
-- ============================================================
-- ============================================================
-- Fase 13: Workflows y aprobaciones
-- ============================================================

-- Definición de flujos de aprobación por empresa
CREATE TABLE workflow_configs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  modulo       TEXT        NOT NULL CHECK (modulo IN ('compras','ventas','pagos','otros')),
  nombre       TEXT        NOT NULL,
  descripcion  TEXT,
  monto_min    NUMERIC(15,2),   -- Aplica si el doc supera este monto
  monto_max    NUMERIC(15,2),
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pasos del flujo (aprobadores ordenados)
CREATE TABLE workflow_pasos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     UUID        NOT NULL REFERENCES workflow_configs(id) ON DELETE CASCADE,
  orden           INTEGER     NOT NULL,
  nombre          TEXT        NOT NULL,
  rol_requerido   TEXT,        -- Nombre del rol que puede aprobar
  user_id         UUID        REFERENCES auth.users(id),  -- O un usuario específico
  es_paralelo     BOOLEAN     NOT NULL DEFAULT FALSE       -- Si TRUE, todos los del orden deben aprobar
);

-- Instancias de aprobación para documentos específicos
CREATE TABLE workflow_instancias (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  workflow_id       UUID        NOT NULL REFERENCES workflow_configs(id),
  referencia_tabla  TEXT        NOT NULL,  -- 'documentos_compra', 'documentos_venta', etc.
  referencia_id     UUID        NOT NULL,
  estado            TEXT        NOT NULL DEFAULT 'pendiente'
                                CHECK (estado IN ('pendiente','en_proceso','aprobado','rechazado','cancelado')),
  paso_actual       INTEGER     NOT NULL DEFAULT 1,
  iniciado_por      UUID        REFERENCES auth.users(id),
  creado_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completado_at     TIMESTAMPTZ
);

-- Historial de decisiones por paso
CREATE TABLE workflow_decisiones (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  instancia_id    UUID        NOT NULL REFERENCES workflow_instancias(id) ON DELETE CASCADE,
  paso_id         UUID        NOT NULL REFERENCES workflow_pasos(id),
  user_id         UUID        REFERENCES auth.users(id),
  decision        TEXT        NOT NULL CHECK (decision IN ('aprobado','rechazado')),
  comentario      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wf_instancias_empresa  ON workflow_instancias(empresa_id, estado);
CREATE INDEX idx_wf_instancias_ref      ON workflow_instancias(referencia_tabla, referencia_id);
CREATE INDEX idx_wf_decisiones_inst     ON workflow_decisiones(instancia_id);

-- RLS
ALTER TABLE workflow_configs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_pasos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instancias  ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_decisiones  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wf_config_select"    ON workflow_configs     FOR SELECT  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "wf_config_insert"    ON workflow_configs     FOR INSERT  WITH CHECK (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "wf_config_update"    ON workflow_configs     FOR UPDATE  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "wf_pasos_select"     ON workflow_pasos       FOR SELECT  USING (workflow_id IN (SELECT id FROM workflow_configs WHERE empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "wf_pasos_all"        ON workflow_pasos       FOR ALL     USING (workflow_id IN (SELECT id FROM workflow_configs WHERE empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true)));

CREATE POLICY "wf_inst_select"      ON workflow_instancias  FOR SELECT  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "wf_inst_insert"      ON workflow_instancias  FOR INSERT  WITH CHECK (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "wf_inst_update"      ON workflow_instancias  FOR UPDATE  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "wf_dec_select"       ON workflow_decisiones  FOR SELECT  USING (instancia_id IN (SELECT id FROM workflow_instancias WHERE empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true)));
CREATE POLICY "wf_dec_insert"       ON workflow_decisiones  FOR INSERT  WITH CHECK (instancia_id IN (SELECT id FROM workflow_instancias WHERE empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true)));


-- ============================================================
-- MIGRACIÓN: 011_inventario.sql
-- ============================================================
-- ============================================================
-- Fase 14: Inventario y Bodegas
-- ============================================================

CREATE TABLE bodegas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo      TEXT        NOT NULL,
  nombre      TEXT        NOT NULL,
  ubicacion   TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

CREATE TABLE unidades_medida (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo      TEXT        NOT NULL,
  nombre      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

CREATE TABLE categorias_producto (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre      TEXT        NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE productos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sku             TEXT        NOT NULL,
  nombre          TEXT        NOT NULL,
  descripcion     TEXT,
  categoria_id    UUID        REFERENCES categorias_producto(id),
  unidad_id       UUID        REFERENCES unidades_medida(id),
  tipo            TEXT        NOT NULL DEFAULT 'producto' CHECK (tipo IN ('producto','servicio','materia_prima')),
  precio_compra   NUMERIC(15,4) NOT NULL DEFAULT 0,
  precio_venta    NUMERIC(15,4) NOT NULL DEFAULT 0,
  stock_minimo    NUMERIC(15,4) NOT NULL DEFAULT 0,
  afecto_iva      BOOLEAN     NOT NULL DEFAULT TRUE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE(empresa_id, sku)
);

-- Stock por bodega
CREATE TABLE stock_bodega (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  producto_id UUID        NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  bodega_id   UUID        NOT NULL REFERENCES bodegas(id) ON DELETE CASCADE,
  cantidad    NUMERIC(15,4) NOT NULL DEFAULT 0,
  costo_prom  NUMERIC(15,4) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(producto_id, bodega_id)
);

-- Movimientos de inventario (Kardex)
CREATE TABLE movimientos_inventario (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  producto_id     UUID        NOT NULL REFERENCES productos(id),
  bodega_id       UUID        NOT NULL REFERENCES bodegas(id),
  tipo            TEXT        NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','traslado')),
  cantidad        NUMERIC(15,4) NOT NULL,
  costo_unitario  NUMERIC(15,4) NOT NULL DEFAULT 0,
  total           NUMERIC(15,4) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
  stock_resultante NUMERIC(15,4) NOT NULL DEFAULT 0,
  referencia_tabla TEXT,
  referencia_id    UUID,
  glosa           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID        REFERENCES auth.users(id)
);

CREATE INDEX idx_productos_empresa     ON productos(empresa_id, is_active);
CREATE INDEX idx_stock_producto        ON stock_bodega(empresa_id, producto_id);
CREATE INDEX idx_movimientos_producto  ON movimientos_inventario(empresa_id, producto_id, created_at);

-- RLS
ALTER TABLE bodegas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_medida          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_producto      ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_bodega             ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bodegas_all"         ON bodegas                USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "unidades_all"        ON unidades_medida         USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "categorias_all"      ON categorias_producto     USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "productos_all"       ON productos               USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true) AND deleted_at IS NULL);
CREATE POLICY "stock_all"           ON stock_bodega            USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "movimientos_all"     ON movimientos_inventario  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));



-- ============================================================
-- Fase 15: Flujo de Caja y TesorerÃ­a
-- ============================================================

CREATE TABLE cuentas_bancarias (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  banco           TEXT        NOT NULL,
  tipo_cuenta     TEXT        NOT NULL DEFAULT 'corriente' CHECK (tipo_cuenta IN ('corriente','ahorro','vista','credito')),
  numero_cuenta   TEXT        NOT NULL,
  moneda          TEXT        NOT NULL DEFAULT 'USD',
  saldo_inicial   NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_actual    NUMERIC(15,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE movimientos_caja (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cuenta_id       UUID        NOT NULL REFERENCES cuentas_bancarias(id),
  tipo            TEXT        NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  categoria       TEXT        NOT NULL DEFAULT 'otros',
  descripcion     TEXT        NOT NULL,
  monto           NUMERIC(15,2) NOT NULL,
  fecha           DATE        NOT NULL,
  referencia      TEXT,
  conciliado      BOOLEAN     NOT NULL DEFAULT FALSE,
  referencia_tabla TEXT,
  referencia_id   UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID        REFERENCES auth.users(id)
);

CREATE TABLE proyecciones_caja (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  fecha           DATE        NOT NULL,
  tipo            TEXT        NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  categoria       TEXT        NOT NULL,
  descripcion     TEXT        NOT NULL,
  monto           NUMERIC(15,2) NOT NULL,
  es_recurrente   BOOLEAN     NOT NULL DEFAULT FALSE,
  periodicidad    TEXT        CHECK (periodicidad IN ('mensual','quincenal','semanal')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mov_caja_empresa_fecha ON movimientos_caja(empresa_id, fecha);
CREATE INDEX idx_mov_caja_cuenta        ON movimientos_caja(cuenta_id, fecha);
CREATE INDEX idx_proy_caja_empresa_fecha ON proyecciones_caja(empresa_id, fecha);

ALTER TABLE cuentas_bancarias     ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja      ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecciones_caja     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cuentas_bancarias_all" ON cuentas_bancarias  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "mov_caja_all"          ON movimientos_caja   USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "proy_caja_all"         ON proyecciones_caja  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
-- ============================================================
-- 013 Integraciones SII: DTE, F22, boletas honorarios
-- ============================================================

-- Documentos Tributarios ElectrÃ³nicos emitidos/recibidos
create table if not exists dte_documentos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references empresas(id) on delete cascade,
  tipo_dte      text not null,        -- 33=Factura, 34=F.Exenta, 39=Boleta, 61=N.CrÃ©dito, 52=GuÃ­a
  folio         integer not null,
  rut_contraparte text not null,
  razon_social  text,
  fecha_emision date not null,
  monto_neto    numeric(14,2) not null default 0,
  monto_iva     numeric(14,2) not null default 0,
  monto_total   numeric(14,2) not null default 0,
  estado        text not null default 'pendiente',  -- pendiente | aceptado | rechazado | anulado
  xml_raw       text,
  track_id      text,
  referencia_id uuid,    -- FK a ventas/compras si aplica
  created_at    timestamptz not null default now()
);

create index if not exists dte_documentos_empresa_idx on dte_documentos(empresa_id);
create index if not exists dte_documentos_tipo_folio_idx on dte_documentos(empresa_id, tipo_dte, folio);

alter table dte_documentos enable row level security;
create policy "tenant_dte" on dte_documentos
  using (empresa_id = (select (current_setting('app.empresa_id', true))::uuid));

-- Declaraciones F22 (Renta Anual)
create table if not exists f22_declaraciones (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references empresas(id) on delete cascade,
  anio_tributario integer not null,
  estado        text not null default 'borrador',  -- borrador | enviado | aceptado
  folio_sii     text,
  fecha_envio   date,
  datos_json    jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  unique(empresa_id, anio_tributario)
);

alter table f22_declaraciones enable row level security;
create policy "tenant_f22" on f22_declaraciones
  using (empresa_id = (select (current_setting('app.empresa_id', true))::uuid));

-- Boletas de Honorarios (emitidas por la empresa o recibidas)
create table if not exists boletas_honorarios (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references empresas(id) on delete cascade,
  tipo            text not null,          -- emitida | recibida
  numero          integer not null,
  rut_prestador   text not null,
  nombre_prestador text not null,
  rut_pagador     text not null,
  nombre_pagador  text,
  fecha           date not null,
  monto_bruto     numeric(14,2) not null,
  retencion_10    numeric(14,2) generated always as (round(monto_bruto * 0.10, 2)) stored,
  monto_liquido   numeric(14,2) generated always as (round(monto_bruto * 0.90, 2)) stored,
  concepto        text,
  estado          text not null default 'vigente',  -- vigente | anulada
  created_at      timestamptz not null default now()
);

create index if not exists boletas_honorarios_empresa_idx on boletas_honorarios(empresa_id);

alter table boletas_honorarios enable row level security;
create policy "tenant_boletas" on boletas_honorarios
  using (empresa_id = (select (current_setting('app.empresa_id', true))::uuid));

-- Tokens SII (almacenamiento seguro de credenciales API SII)
create table if not exists sii_config (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade unique,
  ambiente    text not null default 'certificacion',  -- certificacion | produccion
  rut_empresa text not null,
  razon_social text not null,
  actividades jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

alter table sii_config enable row level security;
create policy "tenant_sii_config" on sii_config
  using (empresa_id = (select (current_setting('app.empresa_id', true))::uuid));
