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
