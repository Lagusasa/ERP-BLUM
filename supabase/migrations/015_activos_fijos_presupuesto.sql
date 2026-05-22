-- ============================================================
-- 015: ACTIVOS FIJOS Y PRESUPUESTO CONTABLE
-- ============================================================

-- ACTIVOS FIJOS
CREATE TABLE IF NOT EXISTS public.activos_fijos (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id              UUID        NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo                  VARCHAR(50) NOT NULL,
  nombre                  VARCHAR(200) NOT NULL,
  descripcion             TEXT,
  categoria               VARCHAR(30) NOT NULL
                            CHECK (categoria IN ('edificios','maquinaria','vehiculos','equipos_computacion','mobiliario','herramientas','otros')),
  fecha_adquisicion       DATE        NOT NULL,
  valor_adquisicion       NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_residual          NUMERIC(15,2) NOT NULL DEFAULT 0,
  vida_util_meses         INTEGER     NOT NULL,
  metodo                  VARCHAR(20) NOT NULL DEFAULT 'lineal'
                            CHECK (metodo IN ('lineal','acelerada')),
  cuenta_activo_id        UUID        REFERENCES public.plan_cuentas(id),
  cuenta_dep_acumulada_id UUID        REFERENCES public.plan_cuentas(id),
  cuenta_gasto_dep_id     UUID        REFERENCES public.plan_cuentas(id),
  estado                  VARCHAR(20) NOT NULL DEFAULT 'activo'
                            CHECK (estado IN ('activo','dado_baja','vendido')),
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

-- DEPRECIACIONES MENSUALES
CREATE TABLE IF NOT EXISTS public.depreciaciones (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  activo_id      UUID        NOT NULL REFERENCES public.activos_fijos(id) ON DELETE CASCADE,
  empresa_id     UUID        NOT NULL REFERENCES public.empresas(id)      ON DELETE CASCADE,
  anio           INTEGER     NOT NULL,
  mes            INTEGER     NOT NULL CHECK (mes BETWEEN 1 AND 12),
  monto          NUMERIC(15,2) NOT NULL DEFAULT 0,
  comprobante_id UUID        REFERENCES public.comprobantes(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(activo_id, anio, mes)
);

-- PRESUPUESTO CONTABLE
CREATE TABLE IF NOT EXISTS public.presupuestos_contables (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES public.empresas(id)    ON DELETE CASCADE,
  cuenta_id   UUID        NOT NULL REFERENCES public.plan_cuentas(id) ON DELETE CASCADE,
  anio        INTEGER     NOT NULL,
  mes         INTEGER     NOT NULL CHECK (mes BETWEEN 1 AND 12),
  monto       NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, cuenta_id, anio, mes)
);

CREATE INDEX IF NOT EXISTS idx_activos_fijos_empresa ON public.activos_fijos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_depreciaciones_activo ON public.depreciaciones(activo_id, anio, mes);
CREATE INDEX IF NOT EXISTS idx_presupuesto_empresa_anio ON public.presupuestos_contables(empresa_id, anio);

-- RLS
ALTER TABLE public.activos_fijos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciaciones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos_contables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activos_fijos_all" ON public.activos_fijos
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "depreciaciones_all" ON public.depreciaciones
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "presupuestos_all" ON public.presupuestos_contables
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
