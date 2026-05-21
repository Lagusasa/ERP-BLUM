-- ============================================================
-- Fase 14: Inventario y Bodegas
-- ============================================================

CREATE TABLE bodegas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo      TEXT        NOT NULL,
  nombre      TEXT        NOT NULL,
  ubicacion   TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

CREATE TABLE unidades_medida (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo      TEXT        NOT NULL,
  nombre      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

CREATE TABLE categorias_producto (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre      TEXT        NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE productos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sku             TEXT        NOT NULL,
  nombre          TEXT        NOT NULL,
  descripcion     TEXT,
  categoria_id    UUID        REFERENCES categorias_producto(id),
  unidad_id       UUID        REFERENCES unidades_medida(id),
  tipo            TEXT        NOT NULL DEFAULT 'producto' CHECK (tipo IN ('producto','servicio','materia_prima')),
  precio_compra   NUMERIC(15,4) NOT NULL DEFAULT 0,
  precio_venta    NUMERIC(15,4) NOT NULL DEFAULT 0,
  stock_minimo    NUMERIC(15,4) NOT NULL DEFAULT 0,
  afecto_iva      BOOLEAN     NOT NULL DEFAULT TRUE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE(empresa_id, sku)
);

-- Stock por bodega
CREATE TABLE stock_bodega (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  producto_id UUID        NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  bodega_id   UUID        NOT NULL REFERENCES bodegas(id) ON DELETE CASCADE,
  cantidad    NUMERIC(15,4) NOT NULL DEFAULT 0,
  costo_prom  NUMERIC(15,4) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(producto_id, bodega_id)
);

-- Movimientos de inventario (Kardex)
CREATE TABLE movimientos_inventario (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  producto_id     UUID        NOT NULL REFERENCES productos(id),
  bodega_id       UUID        NOT NULL REFERENCES bodegas(id),
  tipo            TEXT        NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','traslado')),
  cantidad        NUMERIC(15,4) NOT NULL,
  costo_unitario  NUMERIC(15,4) NOT NULL DEFAULT 0,
  total           NUMERIC(15,4) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
  stock_resultante NUMERIC(15,4) NOT NULL DEFAULT 0,
  referencia_tabla TEXT,
  referencia_id    UUID,
  glosa           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID        REFERENCES auth.users(id)
);

CREATE INDEX idx_productos_empresa     ON productos(empresa_id, is_active);
CREATE INDEX idx_stock_producto        ON stock_bodega(empresa_id, producto_id);
CREATE INDEX idx_movimientos_producto  ON movimientos_inventario(empresa_id, producto_id, created_at);

-- RLS
ALTER TABLE bodegas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_medida          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_producto      ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_bodega             ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bodegas_all"         ON bodegas                USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "unidades_all"        ON unidades_medida         USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "categorias_all"      ON categorias_producto     USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "productos_all"       ON productos               USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true) AND deleted_at IS NULL);
CREATE POLICY "stock_all"           ON stock_bodega            USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "movimientos_all"     ON movimientos_inventario  USING (empresa_id IN (SELECT empresa_id FROM empresa_usuarios WHERE user_id = auth.uid() AND is_active = true));
