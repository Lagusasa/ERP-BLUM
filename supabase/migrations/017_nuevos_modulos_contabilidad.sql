-- ============================================================
-- 017 — Nuevos módulos contabilidad: gastos LIR, registros SII,
--       devolución IVA exportadores, convenios de pago
-- ============================================================

-- ─── 1. GASTOS LIR (art. 31 y art. 21) ─────────────────────
CREATE TABLE IF NOT EXISTS gastos_lir (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cuenta_id           UUID REFERENCES plan_cuentas(id),
  fecha               DATE NOT NULL,
  anio                INTEGER NOT NULL,
  concepto            TEXT NOT NULL,
  monto               NUMERIC(15,2) NOT NULL DEFAULT 0,
  articulo            TEXT NOT NULL CHECK (articulo IN ('31','21')),
  tipo_gasto          TEXT,
  rut_beneficiario    TEXT,
  nombre_beneficiario TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gastos_lir ENABLE ROW LEVEL SECURITY;
CREATE POLICY gastos_lir_empresa ON gastos_lir
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE INDEX IF NOT EXISTS idx_gastos_lir_empresa_anio ON gastos_lir(empresa_id, anio);

-- ─── 2. REGISTROS EMPRESAS SII (RAI, DDAN, FUT, FUNT) ───────
CREATE TABLE IF NOT EXISTS registros_empresa_sii (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('RAI','DDAN','FUT','FUNT')),
  anio        INTEGER NOT NULL,
  concepto    TEXT NOT NULL,
  monto       NUMERIC(15,2) NOT NULL DEFAULT 0,
  descripcion TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE registros_empresa_sii ENABLE ROW LEVEL SECURITY;
CREATE POLICY registros_empresa_sii_empresa ON registros_empresa_sii
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE INDEX IF NOT EXISTS idx_registros_sii_empresa_tipo ON registros_empresa_sii(empresa_id, tipo, anio);

-- ─── 3. DEVOLUCIÓN IVA EXPORTADORES ──────────────────────────
CREATE TABLE IF NOT EXISTS devolucion_iva_exportador (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id               UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  periodo                  TEXT NOT NULL,          -- YYYY-MM
  monto_iva_exportaciones  NUMERIC(15,2) NOT NULL DEFAULT 0,
  monto_solicitado         NUMERIC(15,2) NOT NULL DEFAULT 0,
  numero_solicitud         TEXT,
  estado                   TEXT NOT NULL DEFAULT 'pendiente'
                             CHECK (estado IN ('pendiente','aprobada','rechazada','pagada')),
  observacion              TEXT,
  is_active                BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE devolucion_iva_exportador ENABLE ROW LEVEL SECURITY;
CREATE POLICY devolucion_iva_empresa ON devolucion_iva_exportador
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE));

-- ─── 4. CONVENIOS DE PAGO ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS convenios_pago (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  acreedor     TEXT NOT NULL,
  tipo         TEXT NOT NULL DEFAULT 'proveedor'
                CHECK (tipo IN ('sii','tgr','proveedor','banco','otro')),
  monto_total  NUMERIC(15,2) NOT NULL DEFAULT 0,
  n_cuotas     INTEGER NOT NULL DEFAULT 1,
  monto_cuota  NUMERIC(15,2) NOT NULL DEFAULT 0,
  fecha_inicio DATE NOT NULL,
  tasa_interes NUMERIC(6,4) NOT NULL DEFAULT 0,
  descripcion  TEXT,
  estado       TEXT NOT NULL DEFAULT 'vigente'
                CHECK (estado IN ('vigente','terminado','incumplido')),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE convenios_pago ENABLE ROW LEVEL SECURITY;
CREATE POLICY convenios_pago_empresa ON convenios_pago
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE));

-- ─── 5. CUOTAS DE CONVENIO ────────────────────────────────────
CREATE TABLE IF NOT EXISTS convenio_cuotas (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convenio_id        UUID NOT NULL REFERENCES convenios_pago(id) ON DELETE CASCADE,
  empresa_id         UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero             INTEGER NOT NULL,
  fecha_vencimiento  DATE NOT NULL,
  monto              NUMERIC(15,2) NOT NULL DEFAULT 0,
  estado             TEXT NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','pagada','vencida')),
  fecha_pago         DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE convenio_cuotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY convenio_cuotas_empresa ON convenio_cuotas
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE INDEX IF NOT EXISTS idx_convenio_cuotas_convenio ON convenio_cuotas(convenio_id);
CREATE INDEX IF NOT EXISTS idx_convenio_cuotas_empresa ON convenio_cuotas(empresa_id, estado);

-- ─── Trigger updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['gastos_lir','registros_empresa_sii','devolucion_iva_exportador','convenios_pago']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$s;
       CREATE TRIGGER trg_%1$s_updated_at
         BEFORE UPDATE ON %1$s
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl
    );
  END LOOP;
END $$;
