-- ============================================================
-- ERP SaaS Chile — Migración 014: Template Plan de Cuentas
-- Función RPC para importar el Plan de Cuentas Estándar Chileno (PYME)
-- ============================================================

CREATE OR REPLACE FUNCTION public.importar_plan_cuentas_template(p_empresa_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- No importar si ya existen cuentas
  SELECT COUNT(*) INTO v_count FROM public.plan_cuentas WHERE empresa_id = p_empresa_id;
  IF v_count > 0 THEN
    RETURN v_count;
  END IF;

  -- --------------------------------------------------------
  -- Insertar todas las cuentas sin padres (se actualizan después)
  -- --------------------------------------------------------
  INSERT INTO public.plan_cuentas
    (empresa_id, codigo, nombre, clase, tipo, nivel, saldo_normal, es_imputable, orden, cuenta_padre_id)
  VALUES
  -- ============================
  -- 1. ACTIVO
  -- ============================
  (p_empresa_id,'1','ACTIVO','activo','encabezado',1,'deudor',false,100,NULL),
  (p_empresa_id,'1.1','Activo Corriente','activo','encabezado',2,'deudor',false,110,NULL),
  (p_empresa_id,'1.1.01','Disponible','activo','encabezado',3,'deudor',false,111,NULL),
  (p_empresa_id,'1.1.01.01','Caja','activo','detalle',4,'deudor',true,1110,NULL),
  (p_empresa_id,'1.1.01.02','Banco Cuenta Corriente','activo','detalle',4,'deudor',true,1111,NULL),
  (p_empresa_id,'1.1.01.03','Fondos por Rendir','activo','detalle',4,'deudor',true,1112,NULL),
  (p_empresa_id,'1.1.02','Clientes y Deudores','activo','encabezado',3,'deudor',false,112,NULL),
  (p_empresa_id,'1.1.02.01','Clientes Nacionales','activo','detalle',4,'deudor',true,1120,NULL),
  (p_empresa_id,'1.1.02.02','Documentos por Cobrar','activo','detalle',4,'deudor',true,1121,NULL),
  (p_empresa_id,'1.1.02.03','Deudores Varios','activo','detalle',4,'deudor',true,1122,NULL),
  (p_empresa_id,'1.1.02.04','(-) Provisión Deudores Incobrables','activo','detalle',4,'acreedor',true,1123,NULL),
  (p_empresa_id,'1.1.03','Existencias','activo','encabezado',3,'deudor',false,113,NULL),
  (p_empresa_id,'1.1.03.01','Mercaderías','activo','detalle',4,'deudor',true,1130,NULL),
  (p_empresa_id,'1.1.03.02','Materias Primas','activo','detalle',4,'deudor',true,1131,NULL),
  (p_empresa_id,'1.1.03.03','Productos Terminados','activo','detalle',4,'deudor',true,1132,NULL),
  (p_empresa_id,'1.1.04','Otros Activos Corrientes','activo','encabezado',3,'deudor',false,114,NULL),
  (p_empresa_id,'1.1.04.01','IVA Crédito Fiscal','activo','detalle',4,'deudor',true,1140,NULL),
  (p_empresa_id,'1.1.04.02','PPM por Recuperar','activo','detalle',4,'deudor',true,1141,NULL),
  (p_empresa_id,'1.1.04.03','Seguros Pagados por Anticipado','activo','detalle',4,'deudor',true,1142,NULL),
  (p_empresa_id,'1.1.04.04','Gastos Pagados por Anticipado','activo','detalle',4,'deudor',true,1143,NULL),
  (p_empresa_id,'1.2','Activo No Corriente','activo','encabezado',2,'deudor',false,120,NULL),
  (p_empresa_id,'1.2.01','Propiedades, Planta y Equipo','activo','encabezado',3,'deudor',false,121,NULL),
  (p_empresa_id,'1.2.01.01','Terrenos','activo','detalle',4,'deudor',true,1210,NULL),
  (p_empresa_id,'1.2.01.02','Edificios y Construcciones','activo','detalle',4,'deudor',true,1211,NULL),
  (p_empresa_id,'1.2.01.03','Maquinaria y Equipos','activo','detalle',4,'deudor',true,1212,NULL),
  (p_empresa_id,'1.2.01.04','Vehículos','activo','detalle',4,'deudor',true,1213,NULL),
  (p_empresa_id,'1.2.01.05','Equipos de Oficina y Computacionales','activo','detalle',4,'deudor',true,1214,NULL),
  (p_empresa_id,'1.2.01.06','(-) Dep. Acumulada Edificios','activo','detalle',4,'acreedor',true,1215,NULL),
  (p_empresa_id,'1.2.01.07','(-) Dep. Acumulada Maquinaria','activo','detalle',4,'acreedor',true,1216,NULL),
  (p_empresa_id,'1.2.01.08','(-) Dep. Acumulada Vehículos','activo','detalle',4,'acreedor',true,1217,NULL),
  (p_empresa_id,'1.2.01.09','(-) Dep. Acumulada Equipos Oficina','activo','detalle',4,'acreedor',true,1218,NULL),
  (p_empresa_id,'1.2.02','Activos Intangibles','activo','encabezado',3,'deudor',false,122,NULL),
  (p_empresa_id,'1.2.02.01','Software y Licencias','activo','detalle',4,'deudor',true,1220,NULL),
  (p_empresa_id,'1.2.02.02','Marcas y Patentes','activo','detalle',4,'deudor',true,1221,NULL),
  (p_empresa_id,'1.2.02.03','(-) Amortización Acumulada Intangibles','activo','detalle',4,'acreedor',true,1222,NULL),
  (p_empresa_id,'1.2.03','Otros Activos No Corrientes','activo','encabezado',3,'deudor',false,123,NULL),
  (p_empresa_id,'1.2.03.01','Inversiones Permanentes','activo','detalle',4,'deudor',true,1230,NULL),
  (p_empresa_id,'1.2.03.02','Garantías y Depósitos','activo','detalle',4,'deudor',true,1231,NULL),

  -- ============================
  -- 2. PASIVO
  -- ============================
  (p_empresa_id,'2','PASIVO','pasivo','encabezado',1,'acreedor',false,200,NULL),
  (p_empresa_id,'2.1','Pasivo Corriente','pasivo','encabezado',2,'acreedor',false,210,NULL),
  (p_empresa_id,'2.1.01','Proveedores y Cuentas por Pagar','pasivo','encabezado',3,'acreedor',false,211,NULL),
  (p_empresa_id,'2.1.01.01','Proveedores Nacionales','pasivo','detalle',4,'acreedor',true,2110,NULL),
  (p_empresa_id,'2.1.01.02','Documentos por Pagar','pasivo','detalle',4,'acreedor',true,2111,NULL),
  (p_empresa_id,'2.1.01.03','Acreedores Varios','pasivo','detalle',4,'acreedor',true,2112,NULL),
  (p_empresa_id,'2.1.02','Obligaciones Financieras CP','pasivo','encabezado',3,'acreedor',false,212,NULL),
  (p_empresa_id,'2.1.02.01','Préstamos Bancarios Corto Plazo','pasivo','detalle',4,'acreedor',true,2120,NULL),
  (p_empresa_id,'2.1.02.02','Líneas de Crédito Bancarias','pasivo','detalle',4,'acreedor',true,2121,NULL),
  (p_empresa_id,'2.1.03','Obligaciones Tributarias y Laborales','pasivo','encabezado',3,'acreedor',false,213,NULL),
  (p_empresa_id,'2.1.03.01','IVA Débito Fiscal','pasivo','detalle',4,'acreedor',true,2130,NULL),
  (p_empresa_id,'2.1.03.02','Retención Impuesto Único Trabajadores','pasivo','detalle',4,'acreedor',true,2131,NULL),
  (p_empresa_id,'2.1.03.03','Remuneraciones por Pagar','pasivo','detalle',4,'acreedor',true,2132,NULL),
  (p_empresa_id,'2.1.03.04','AFP y Salud por Pagar','pasivo','detalle',4,'acreedor',true,2133,NULL),
  (p_empresa_id,'2.1.03.05','Provisión Vacaciones','pasivo','detalle',4,'acreedor',true,2134,NULL),
  (p_empresa_id,'2.1.03.06','PPM por Pagar','pasivo','detalle',4,'acreedor',true,2135,NULL),
  (p_empresa_id,'2.2','Pasivo No Corriente','pasivo','encabezado',2,'acreedor',false,220,NULL),
  (p_empresa_id,'2.2.01','Obligaciones Financieras LP','pasivo','encabezado',3,'acreedor',false,221,NULL),
  (p_empresa_id,'2.2.01.01','Préstamos Bancarios Largo Plazo','pasivo','detalle',4,'acreedor',true,2210,NULL),
  (p_empresa_id,'2.2.01.02','Leasing Financiero Largo Plazo','pasivo','detalle',4,'acreedor',true,2211,NULL),

  -- ============================
  -- 3. PATRIMONIO
  -- ============================
  (p_empresa_id,'3','PATRIMONIO','patrimonio','encabezado',1,'acreedor',false,300,NULL),
  (p_empresa_id,'3.1','Capital','patrimonio','encabezado',2,'acreedor',false,310,NULL),
  (p_empresa_id,'3.1.01','Capital Pagado','patrimonio','detalle',3,'acreedor',true,3100,NULL),
  (p_empresa_id,'3.1.02','Capital por Enterar','patrimonio','detalle',3,'deudor',true,3101,NULL),
  (p_empresa_id,'3.2','Reservas','patrimonio','encabezado',2,'acreedor',false,320,NULL),
  (p_empresa_id,'3.2.01','Reserva Legal','patrimonio','detalle',3,'acreedor',true,3200,NULL),
  (p_empresa_id,'3.2.02','Otras Reservas','patrimonio','detalle',3,'acreedor',true,3201,NULL),
  (p_empresa_id,'3.3','Resultados','patrimonio','encabezado',2,'acreedor',false,330,NULL),
  (p_empresa_id,'3.3.01','Utilidades Acumuladas','patrimonio','detalle',3,'acreedor',true,3300,NULL),
  (p_empresa_id,'3.3.02','(-) Pérdidas Acumuladas','patrimonio','detalle',3,'deudor',true,3301,NULL),
  (p_empresa_id,'3.3.03','Resultado del Ejercicio','patrimonio','detalle',3,'acreedor',true,3302,NULL),

  -- ============================
  -- 4. INGRESOS
  -- ============================
  (p_empresa_id,'4','INGRESOS','ingreso','encabezado',1,'acreedor',false,400,NULL),
  (p_empresa_id,'4.1','Ingresos Operacionales','ingreso','encabezado',2,'acreedor',false,410,NULL),
  (p_empresa_id,'4.1.01','Ventas Afectas (con IVA)','ingreso','detalle',3,'acreedor',true,4100,NULL),
  (p_empresa_id,'4.1.02','Ventas Exentas (sin IVA)','ingreso','detalle',3,'acreedor',true,4101,NULL),
  (p_empresa_id,'4.1.03','(-) Descuentos y Devoluciones s/Ventas','ingreso','detalle',3,'deudor',true,4102,NULL),
  (p_empresa_id,'4.1.04','Servicios Prestados','ingreso','detalle',3,'acreedor',true,4103,NULL),
  (p_empresa_id,'4.2','Ingresos No Operacionales','ingreso','encabezado',2,'acreedor',false,420,NULL),
  (p_empresa_id,'4.2.01','Ingresos Financieros','ingreso','detalle',3,'acreedor',true,4200,NULL),
  (p_empresa_id,'4.2.02','Utilidad en Venta de Activos','ingreso','detalle',3,'acreedor',true,4201,NULL),
  (p_empresa_id,'4.2.03','Otros Ingresos No Operacionales','ingreso','detalle',3,'acreedor',true,4202,NULL),

  -- ============================
  -- 5. COSTOS
  -- ============================
  (p_empresa_id,'5','COSTOS','costo','encabezado',1,'deudor',false,500,NULL),
  (p_empresa_id,'5.1','Costo de Ventas y Servicios','costo','encabezado',2,'deudor',false,510,NULL),
  (p_empresa_id,'5.1.01','Costo de Mercaderías Vendidas','costo','detalle',3,'deudor',true,5100,NULL),
  (p_empresa_id,'5.1.02','Costo de Materias Primas Utilizadas','costo','detalle',3,'deudor',true,5101,NULL),
  (p_empresa_id,'5.1.03','Costo de Producción','costo','detalle',3,'deudor',true,5102,NULL),
  (p_empresa_id,'5.1.04','Costo de Servicios Prestados','costo','detalle',3,'deudor',true,5103,NULL),

  -- ============================
  -- 6. GASTOS
  -- ============================
  (p_empresa_id,'6','GASTOS','gasto','encabezado',1,'deudor',false,600,NULL),
  (p_empresa_id,'6.1','Gastos de Administración y Ventas','gasto','encabezado',2,'deudor',false,610,NULL),
  (p_empresa_id,'6.1.01','Remuneraciones y Honorarios','gasto','encabezado',3,'deudor',false,611,NULL),
  (p_empresa_id,'6.1.01.01','Sueldos y Salarios','gasto','detalle',4,'deudor',true,6110,NULL),
  (p_empresa_id,'6.1.01.02','Honorarios a Terceros','gasto','detalle',4,'deudor',true,6111,NULL),
  (p_empresa_id,'6.1.01.03','Bonos y Gratificaciones','gasto','detalle',4,'deudor',true,6112,NULL),
  (p_empresa_id,'6.1.01.04','Indemnizaciones','gasto','detalle',4,'deudor',true,6113,NULL),
  (p_empresa_id,'6.1.02','Servicios y Arriendos','gasto','encabezado',3,'deudor',false,612,NULL),
  (p_empresa_id,'6.1.02.01','Arriendo de Oficinas y Locales','gasto','detalle',4,'deudor',true,6120,NULL),
  (p_empresa_id,'6.1.02.02','Servicios Básicos (Agua, Luz, Gas)','gasto','detalle',4,'deudor',true,6121,NULL),
  (p_empresa_id,'6.1.02.03','Telecomunicaciones e Internet','gasto','detalle',4,'deudor',true,6122,NULL),
  (p_empresa_id,'6.1.03','Materiales y Suministros','gasto','encabezado',3,'deudor',false,613,NULL),
  (p_empresa_id,'6.1.03.01','Materiales de Oficina','gasto','detalle',4,'deudor',true,6130,NULL),
  (p_empresa_id,'6.1.03.02','Materiales de Limpieza y Aseo','gasto','detalle',4,'deudor',true,6131,NULL),
  (p_empresa_id,'6.1.04','Publicidad y Ventas','gasto','encabezado',3,'deudor',false,614,NULL),
  (p_empresa_id,'6.1.04.01','Publicidad y Marketing','gasto','detalle',4,'deudor',true,6140,NULL),
  (p_empresa_id,'6.1.04.02','Gastos de Representación','gasto','detalle',4,'deudor',true,6141,NULL),
  (p_empresa_id,'6.1.04.03','Comisiones Vendedores','gasto','detalle',4,'deudor',true,6142,NULL),
  (p_empresa_id,'6.1.05','Seguros y Mantenimiento','gasto','encabezado',3,'deudor',false,615,NULL),
  (p_empresa_id,'6.1.05.01','Seguros Generales','gasto','detalle',4,'deudor',true,6150,NULL),
  (p_empresa_id,'6.1.05.02','Mantención y Reparaciones','gasto','detalle',4,'deudor',true,6151,NULL),
  (p_empresa_id,'6.1.06','Depreciaciones y Amortizaciones','gasto','encabezado',3,'deudor',false,616,NULL),
  (p_empresa_id,'6.1.06.01','Depreciación del Ejercicio','gasto','detalle',4,'deudor',true,6160,NULL),
  (p_empresa_id,'6.1.06.02','Amortización del Ejercicio','gasto','detalle',4,'deudor',true,6161,NULL),
  (p_empresa_id,'6.1.07','Otros Gastos Operacionales','gasto','encabezado',3,'deudor',false,617,NULL),
  (p_empresa_id,'6.1.07.01','Capacitación y Perfeccionamiento','gasto','detalle',4,'deudor',true,6170,NULL),
  (p_empresa_id,'6.1.07.02','Gastos de Viaje y Traslado','gasto','detalle',4,'deudor',true,6171,NULL),
  (p_empresa_id,'6.1.07.03','Gastos Legales y Notariales','gasto','detalle',4,'deudor',true,6172,NULL),
  (p_empresa_id,'6.1.07.04','Contabilidad y Auditoría','gasto','detalle',4,'deudor',true,6173,NULL),
  (p_empresa_id,'6.1.07.05','Otros Gastos Generales','gasto','detalle',4,'deudor',true,6174,NULL),
  (p_empresa_id,'6.2','Gastos Financieros','gasto','encabezado',2,'deudor',false,620,NULL),
  (p_empresa_id,'6.2.01','Intereses Bancarios y Financieros','gasto','detalle',3,'deudor',true,6200,NULL),
  (p_empresa_id,'6.2.02','Gastos Bancarios y Comisiones','gasto','detalle',3,'deudor',true,6201,NULL),
  (p_empresa_id,'6.2.03','Pérdida por Diferencia de Cambio','gasto','detalle',3,'deudor',true,6202,NULL);

  -- --------------------------------------------------------
  -- Actualizar referencias a cuenta padre usando el código
  -- El padre de '1.1.01.01' es '1.1.01', del '1.1.01' es '1.1', etc.
  -- --------------------------------------------------------
  UPDATE public.plan_cuentas AS pc
  SET cuenta_padre_id = padre.id
  FROM public.plan_cuentas AS padre
  WHERE pc.empresa_id = p_empresa_id
    AND padre.empresa_id = p_empresa_id
    AND pc.nivel > 1
    AND padre.codigo = regexp_replace(pc.codigo, '\.[^.]+$', '');

  SELECT COUNT(*) INTO v_count FROM public.plan_cuentas WHERE empresa_id = p_empresa_id;
  RETURN v_count;
END;
$$;

-- Permitir que usuarios autenticados llamen a la función
GRANT EXECUTE ON FUNCTION public.importar_plan_cuentas_template(uuid) TO authenticated;
