-- ============================================================
-- Fase 12: Gestión Documental
-- NOTA: Crear bucket 'documentos' en Supabase Storage antes de usar subidas
-- ============================================================

CREATE TABLE documentos_gestion (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo              TEXT        NOT NULL DEFAULT 'otro'
                                CHECK (tipo IN ('dte','contrato','liquidacion','nomina','certificado','otro')),
  nombre            TEXT        NOT NULL,
  descripcion       TEXT,
  url_externo       TEXT,
  storage_path      TEXT,
  mime_type         TEXT,
  tamano            BIGINT,
  referencia_tabla  TEXT,
  referencia_id     UUID,
  estado            TEXT        NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','archivado')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID        REFERENCES auth.users(id),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_doc_gestion_empresa ON documentos_gestion(empresa_id, estado);
CREATE INDEX idx_doc_gestion_tipo    ON documentos_gestion(empresa_id, tipo);
CREATE INDEX idx_doc_gestion_ref     ON documentos_gestion(referencia_tabla, referencia_id);

ALTER TABLE documentos_gestion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_gestion_select" ON documentos_gestion FOR SELECT
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true)
         AND deleted_at IS NULL);
CREATE POLICY "doc_gestion_insert" ON documentos_gestion FOR INSERT
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "doc_gestion_update" ON documentos_gestion FOR UPDATE
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "doc_gestion_delete" ON documentos_gestion FOR DELETE
  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
