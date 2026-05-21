-- ============================================================
-- Fase 15: Flujo de Caja y Tesorería
-- ============================================================

CREATE TABLE cuentas_bancarias (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  banco           TEXT        NOT NULL,
  tipo_cuenta     TEXT        NOT NULL DEFAULT 'corriente' CHECK (tipo_cuenta IN ('corriente','ahorro','vista','credito')),
  numero_cuenta   TEXT        NOT NULL,
  moneda          TEXT        NOT NULL DEFAULT 'USD',
  saldo_inicial   NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_actual    NUMERIC(15,2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE movimientos_caja (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cuenta_id       UUID        NOT NULL REFERENCES cuentas_bancarias(id),
  tipo            TEXT        NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  categoria       TEXT        NOT NULL DEFAULT 'otros',
  descripcion     TEXT        NOT NULL,
  monto           NUMERIC(15,2) NOT NULL,
  fecha           DATE        NOT NULL,
  referencia      TEXT,
  conciliado      BOOLEAN     NOT NULL DEFAULT FALSE,
  referencia_tabla TEXT,
  referencia_id   UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID        REFERENCES auth.users(id)
);

CREATE TABLE proyecciones_caja (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  fecha           DATE        NOT NULL,
  tipo            TEXT        NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  categoria       TEXT        NOT NULL,
  descripcion     TEXT        NOT NULL,
  monto           NUMERIC(15,2) NOT NULL,
  es_recurrente   BOOLEAN     NOT NULL DEFAULT FALSE,
  periodicidad    TEXT        CHECK (periodicidad IN ('mensual','quincenal','semanal')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mov_caja_empresa_fecha ON movimientos_caja(empresa_id, fecha);
CREATE INDEX idx_mov_caja_cuenta        ON movimientos_caja(cuenta_id, fecha);
CREATE INDEX idx_proy_caja_empresa_fecha ON proyecciones_caja(empresa_id, fecha);

ALTER TABLE cuentas_bancarias     ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja      ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecciones_caja     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cuentas_bancarias_all" ON cuentas_bancarias  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "mov_caja_all"          ON movimientos_caja   USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "proy_caja_all"         ON proyecciones_caja  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
