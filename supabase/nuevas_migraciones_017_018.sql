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


-- ============================================================
-- 018_rrhh_ampliado.sql
-- Módulos RRHH completos: mutualidades, asistencia, banco horas,
-- pactos horas extra, vacaciones/ausencias, terminaciones contrato.
-- ALTER de tablas existentes para nuevos campos.
-- ============================================================

-- ─── MUTUALIDADES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mutualidades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL,                -- ACHS, IST, Mutual de Seguridad, ISL
  tasa_base    NUMERIC(5,2) NOT NULL DEFAULT 0.93,  -- tasa mínima Ley 16.744 (0.93%)
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catálogo inicial mutualidades Chile
INSERT INTO mutualidades (nombre, tasa_base) VALUES
  ('ACHS (Asociación Chilena de Seguridad)',  0.93),
  ('IST (Instituto de Seguridad del Trabajo)', 0.93),
  ('Mutual de Seguridad CChC',                0.93),
  ('ISL (Instituto de Seguridad Laboral)',     0.93)
ON CONFLICT DO NOTHING;

-- ─── ALTER: afp → agregar comisión y SIS ─────────────────────
ALTER TABLE afp
  ADD COLUMN IF NOT EXISTS tasa_afp  NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS comision  NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sis       NUMERIC(5,2) NOT NULL DEFAULT 1.49;

-- Actualizar valores aproximados AFP Chile 2025
UPDATE afp SET tasa_afp = 10.0, comision = 0.58, sis = 1.49 WHERE nombre ILIKE '%capital%';
UPDATE afp SET tasa_afp = 10.0, comision = 0.44, sis = 1.49 WHERE nombre ILIKE '%cuprum%';
UPDATE afp SET tasa_afp = 10.0, comision = 0.77, sis = 1.49 WHERE nombre ILIKE '%habitat%';
UPDATE afp SET tasa_afp = 10.0, comision = 0.69, sis = 1.49 WHERE nombre ILIKE '%planvital%';
UPDATE afp SET tasa_afp = 10.0, comision = 0.49, sis = 1.49 WHERE nombre ILIKE '%provida%';
UPDATE afp SET tasa_afp = 10.0, comision = 0.57, sis = 1.49 WHERE nombre ILIKE '%modelo%';

-- ─── ALTER: trabajadores → mutualidad_id ─────────────────────
ALTER TABLE trabajadores
  ADD COLUMN IF NOT EXISTS mutualidad_id UUID REFERENCES mutualidades(id);

-- ─── ALTER: contratos → lugar_prestacion, departamento ───────
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS lugar_prestacion TEXT,
  ADD COLUMN IF NOT EXISTS departamento     TEXT;

-- ─── ALTER: liquidaciones → afp_comision, afp_sis ────────────
ALTER TABLE liquidaciones
  ADD COLUMN IF NOT EXISTS afp_comision NUMERIC(12,0) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS afp_sis      NUMERIC(12,0) NOT NULL DEFAULT 0;

-- ─── REGISTRO ASISTENCIA ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS registro_asistencia (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  trabajador_id     UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  fecha             DATE NOT NULL,
  hora_entrada      TIME,
  hora_salida       TIME,
  horas_ordinarias  NUMERIC(5,2) NOT NULL DEFAULT 0,
  horas_extra       NUMERIC(5,2) NOT NULL DEFAULT 0,
  tipo              TEXT NOT NULL DEFAULT 'entrada'
                    CHECK (tipo IN ('entrada','salida','hora_extra','ausencia')),
  observacion       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asistencia_empresa_fecha
  ON registro_asistencia (empresa_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_asistencia_trabajador
  ON registro_asistencia (trabajador_id, fecha DESC);

-- ─── PACTO HORAS EXTRA ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS pactos_horas_extra (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  fecha_inicio  DATE NOT NULL,
  fecha_termino DATE,
  horas_semana  NUMERIC(4,1) NOT NULL DEFAULT 0,
  monto_hora    NUMERIC(12,0) NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pactos_horas_empresa
  ON pactos_horas_extra (empresa_id, trabajador_id);

-- ─── BANCO DE HORAS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banco_horas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  periodo_mes   INT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio  INT NOT NULL,
  horas_extra   NUMERIC(6,2) NOT NULL DEFAULT 0,
  horas_usadas  NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── AUSENCIAS (vacaciones y licencias) ─────────────────────
CREATE TABLE IF NOT EXISTS ausencias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  trabajador_id   UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL
                  CHECK (tipo IN (
                    'vacaciones','permiso_goce','permiso_sin_goce',
                    'licencia_medica','licencia_maternal','licencia_paternal',
                    'sala_cuna','fuero_maternal','otro'
                  )),
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  dias_habiles    INT NOT NULL DEFAULT 0,
  dias_corridos   INT NOT NULL DEFAULT 0,
  estado          TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','aprobada','rechazada','anulada')),
  motivo          TEXT,
  numero_licencia TEXT,
  documento_url   TEXT,
  aprobado_por    UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ausencias_empresa
  ON ausencias (empresa_id, trabajador_id, fecha_inicio DESC);

-- ─── TERMINACIONES DE CONTRATO ───────────────────────────────
CREATE TABLE IF NOT EXISTS terminaciones_contrato (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  trabajador_id         UUID NOT NULL REFERENCES trabajadores(id),
  contrato_id           UUID NOT NULL REFERENCES contratos(id),
  fecha_termino         DATE NOT NULL,
  causal                TEXT NOT NULL
                        CHECK (causal IN (
                          '159_1','159_2','159_3','159_4','159_5','159_6',
                          '160_1','160_2','160_3','160_4','160_5','160_6','160_7','160_8',
                          '161'
                        )),
  descripcion           TEXT,
  preaviso_dias         INT NOT NULL DEFAULT 30,
  indemnizacion_anios   INT NOT NULL DEFAULT 0,
  indemnizacion_monto   NUMERIC(14,0) NOT NULL DEFAULT 0,
  vacaciones_pendientes INT NOT NULL DEFAULT 0,
  monto_total_finiquito NUMERIC(14,0) NOT NULL DEFAULT 0,
  ministro_de_fe        TEXT,
  firmado               BOOLEAN NOT NULL DEFAULT false,
  fecha_firma           DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terminaciones_empresa
  ON terminaciones_contrato (empresa_id, fecha_termino DESC);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE mutualidades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_asistencia   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pactos_horas_extra    ENABLE ROW LEVEL SECURITY;
ALTER TABLE banco_horas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ausencias             ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminaciones_contrato ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso por empresa_id vía perfil
CREATE POLICY "mutualidades_public_read" ON mutualidades
  FOR SELECT USING (true);

CREATE POLICY "asistencia_empresa" ON registro_asistencia
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "pactos_empresa" ON pactos_horas_extra
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "banco_horas_empresa" ON banco_horas
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "ausencias_empresa" ON ausencias
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "terminaciones_empresa" ON terminaciones_contrato
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );
