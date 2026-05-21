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
