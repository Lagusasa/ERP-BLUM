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
