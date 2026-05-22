-- ============================================================
-- 016: Libro de Honorarios + Indicadores Previsionales
-- ============================================================

-- Pagos de honorarios (Libro de Honorarios)
CREATE TABLE IF NOT EXISTS pagos_honorarios (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  trabajador_id   UUID REFERENCES trabajadores(id) ON DELETE SET NULL,
  rut_prestador   VARCHAR(20) NOT NULL,
  nombre_prestador TEXT NOT NULL,
  fecha           DATE NOT NULL,
  concepto        TEXT NOT NULL,
  n_boleta        VARCHAR(50),
  monto_bruto     NUMERIC(14,2) NOT NULL DEFAULT 0,
  retencion_pct   NUMERIC(6,4)  NOT NULL DEFAULT 0.1375,
  retencion_monto NUMERIC(14,2) GENERATED ALWAYS AS (ROUND(monto_bruto * retencion_pct, 0)) STORED,
  monto_neto      NUMERIC(14,2) GENERATED ALWAYS AS (monto_bruto - ROUND(monto_bruto * retencion_pct, 0)) STORED,
  estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','anulado')),
  referencia      TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_honorarios_empresa ON pagos_honorarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagos_honorarios_periodo  ON pagos_honorarios(empresa_id, fecha);

ALTER TABLE pagos_honorarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pagos_honorarios_empresa" ON pagos_honorarios
  USING (empresa_id IN (
    SELECT empresa_id FROM empresa_usuarios
    WHERE user_id = auth.uid() AND is_active = TRUE
  ));

-- Indicadores previsionales (por empresa y año)
CREATE TABLE IF NOT EXISTS indicadores_previsionales (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id                  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  anio                        INTEGER NOT NULL,
  sueldo_minimo               NUMERIC(12,2) NOT NULL DEFAULT 500000,
  uf_referencia               NUMERIC(10,4)          DEFAULT 37000,
  utm                         NUMERIC(12,2)          DEFAULT 66081,
  tope_imponible_uf           NUMERIC(8,2)  NOT NULL DEFAULT 81.6,
  retencion_honorarios_pct    NUMERIC(6,4)  NOT NULL DEFAULT 0.1375,
  tasa_seg_ces_trab           NUMERIC(6,4)  NOT NULL DEFAULT 0.006,
  tasa_seg_ces_emp_indef      NUMERIC(6,4)  NOT NULL DEFAULT 0.0240,
  tasa_seg_ces_emp_plazo      NUMERIC(6,4)  NOT NULL DEFAULT 0.0300,
  tasa_scs                    NUMERIC(6,4)  NOT NULL DEFAULT 0.0100,
  tasa_mutualidad             NUMERIC(6,4)  NOT NULL DEFAULT 0.0093,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, anio)
);

CREATE INDEX IF NOT EXISTS idx_indicadores_empresa ON indicadores_previsionales(empresa_id, anio);

ALTER TABLE indicadores_previsionales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indicadores_empresa" ON indicadores_previsionales
  USING (empresa_id IN (
    SELECT empresa_id FROM empresa_usuarios
    WHERE user_id = auth.uid() AND is_active = TRUE
  ));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_pagos_honorarios_updated
  BEFORE UPDATE ON pagos_honorarios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_indicadores_updated
  BEFORE UPDATE ON indicadores_previsionales
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
