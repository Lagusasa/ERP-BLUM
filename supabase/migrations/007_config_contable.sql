-- ============================================================
-- ERP SaaS Chile — Migración 007: Configuración contable
-- Tabla para mapeo de cuentas base por empresa (para centralización automática)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.config_contable (
  empresa_id    UUID PRIMARY KEY REFERENCES public.empresas(id) ON DELETE CASCADE,
  -- Cuentas para IVA
  cuenta_iva_cf_id  UUID REFERENCES public.plan_cuentas(id),  -- IVA Crédito Fiscal
  cuenta_iva_df_id  UUID REFERENCES public.plan_cuentas(id),  -- IVA Débito Fiscal
  -- Cuentas para documentos
  cuenta_cxc_id     UUID REFERENCES public.plan_cuentas(id),  -- Cuentas por Cobrar (ventas)
  cuenta_cxp_id     UUID REFERENCES public.plan_cuentas(id),  -- Cuentas por Pagar (compras)
  cuenta_ingreso_id UUID REFERENCES public.plan_cuentas(id),  -- Ingresos por ventas
  cuenta_gasto_id   UUID REFERENCES public.plan_cuentas(id),  -- Gastos/compras
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_by    UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.config_contable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_contable_select_member"
  ON public.config_contable FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "config_contable_insert_member"
  ON public.config_contable FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "config_contable_update_member"
  ON public.config_contable FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );
