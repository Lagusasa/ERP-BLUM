-- ============================================================
-- ERP SaaS Chile — Migración 006: Fixes de políticas RLS
-- Agrega políticas INSERT/UPDATE faltantes
-- ============================================================

-- ============================================================
-- empresas: INSERT y UPDATE
-- ============================================================
CREATE POLICY "empresas_insert_authenticated"
  ON public.empresas FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "empresas_update_member"
  ON public.empresas FOR UPDATE
  USING (
    id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- empresa_usuarios: INSERT y UPDATE
-- ============================================================
CREATE POLICY "empresa_usuarios_insert_member"
  ON public.empresa_usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Solo puede agregar usuarios a empresas donde ya es miembro activo
    -- O si está creando la primera asignación para sí mismo
    (
      empresa_id IN (
        SELECT empresa_id FROM public.empresa_usuarios
        WHERE user_id = auth.uid() AND is_active = TRUE
      )
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "empresa_usuarios_update_member"
  ON public.empresa_usuarios FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- roles: INSERT y UPDATE (para admins de empresa)
-- ============================================================
CREATE POLICY "roles_insert_member"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
    OR empresa_id IS NULL
  );

-- ============================================================
-- trabajadores: INSERT y UPDATE
-- ============================================================
CREATE POLICY "trabajadores_insert_member"
  ON public.trabajadores FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "trabajadores_update_member"
  ON public.trabajadores FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- contratos: INSERT y UPDATE
-- ============================================================
CREATE POLICY "contratos_insert_member"
  ON public.contratos FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "contratos_update_member"
  ON public.contratos FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- liquidaciones: INSERT y UPDATE
-- ============================================================
CREATE POLICY "liquidaciones_insert_member"
  ON public.liquidaciones FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "liquidaciones_update_member"
  ON public.liquidaciones FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- declaraciones_f29: INSERT y UPDATE
-- ============================================================
CREATE POLICY "f29_insert_member"
  ON public.declaraciones_f29 FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "f29_update_member"
  ON public.declaraciones_f29 FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.empresa_usuarios
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );
