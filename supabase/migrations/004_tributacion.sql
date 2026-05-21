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
