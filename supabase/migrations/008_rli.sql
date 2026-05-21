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
