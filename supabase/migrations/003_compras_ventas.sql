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
