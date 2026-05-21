-- ============================================================
-- 013 Integraciones SII: DTE, F22, boletas honorarios
-- ============================================================

-- Documentos Tributarios Electrónicos emitidos/recibidos
create table if not exists dte_documentos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references empresas(id) on delete cascade,
  tipo_dte      text not null,        -- 33=Factura, 34=F.Exenta, 39=Boleta, 61=N.Crédito, 52=Guía
  folio         integer not null,
  rut_contraparte text not null,
  razon_social  text,
  fecha_emision date not null,
  monto_neto    numeric(14,2) not null default 0,
  monto_iva     numeric(14,2) not null default 0,
  monto_total   numeric(14,2) not null default 0,
  estado        text not null default 'pendiente',  -- pendiente | aceptado | rechazado | anulado
  xml_raw       text,
  track_id      text,
  referencia_id uuid,    -- FK a ventas/compras si aplica
  created_at    timestamptz not null default now()
);

create index if not exists dte_documentos_empresa_idx on dte_documentos(empresa_id);
create index if not exists dte_documentos_tipo_folio_idx on dte_documentos(empresa_id, tipo_dte, folio);

alter table dte_documentos enable row level security;
create policy "tenant_dte" on dte_documentos
  using (empresa_id = (select (current_setting('app.empresa_id', true))::uuid));

-- Declaraciones F22 (Renta Anual)
create table if not exists f22_declaraciones (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references empresas(id) on delete cascade,
  anio_tributario integer not null,
  estado        text not null default 'borrador',  -- borrador | enviado | aceptado
  folio_sii     text,
  fecha_envio   date,
  datos_json    jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  unique(empresa_id, anio_tributario)
);

alter table f22_declaraciones enable row level security;
create policy "tenant_f22" on f22_declaraciones
  using (empresa_id = (select (current_setting('app.empresa_id', true))::uuid));

-- Boletas de Honorarios (emitidas por la empresa o recibidas)
create table if not exists boletas_honorarios (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references empresas(id) on delete cascade,
  tipo            text not null,          -- emitida | recibida
  numero          integer not null,
  rut_prestador   text not null,
  nombre_prestador text not null,
  rut_pagador     text not null,
  nombre_pagador  text,
  fecha           date not null,
  monto_bruto     numeric(14,2) not null,
  retencion_10    numeric(14,2) generated always as (round(monto_bruto * 0.10, 2)) stored,
  monto_liquido   numeric(14,2) generated always as (round(monto_bruto * 0.90, 2)) stored,
  concepto        text,
  estado          text not null default 'vigente',  -- vigente | anulada
  created_at      timestamptz not null default now()
);

create index if not exists boletas_honorarios_empresa_idx on boletas_honorarios(empresa_id);

alter table boletas_honorarios enable row level security;
create policy "tenant_boletas" on boletas_honorarios
  using (empresa_id = (select (current_setting('app.empresa_id', true))::uuid));

-- Tokens SII (almacenamiento seguro de credenciales API SII)
create table if not exists sii_config (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade unique,
  ambiente    text not null default 'certificacion',  -- certificacion | produccion
  rut_empresa text not null,
  razon_social text not null,
  actividades jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

alter table sii_config enable row level security;
create policy "tenant_sii_config" on sii_config
  using (empresa_id = (select (current_setting('app.empresa_id', true))::uuid));
