import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getResumenIVAVentas } from '@/services/ventas.service'
import { getResumenIVACompras } from '@/services/compras.service'
import { getResumenMes } from '@/services/contabilidad.service'
import { getResumenRemuneraciones } from '@/services/remuneraciones.service'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Dashboard' }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const MODULOS = [
  { nombre: 'Contabilidad',    descripcion: 'Plan de cuentas y libros',    href: '/contabilidad',    disponible: true },
  { nombre: 'Compras',         descripcion: 'Proveedores y facturas',      href: '/compras',         disponible: true },
  { nombre: 'Ventas',          descripcion: 'Clientes y documentos',       href: '/ventas',          disponible: true },
  { nombre: 'Tributación',     descripcion: 'IVA, F29, Libro CV',          href: '/tributacion',     disponible: true },
  { nombre: 'Remuneraciones',  descripcion: 'Liquidaciones y cotizaciones', href: '/remuneraciones', disponible: true },
  { nombre: 'Administración',  descripcion: 'Empresas y usuarios',         href: '/admin',           disponible: true },
  { nombre: 'RRHH',            descripcion: 'Próximamente',                href: '/rrhh',            disponible: false },
  { nombre: 'Inventario',      descripcion: 'Próximamente',                href: '/inventario',      disponible: false },
  { nombre: 'Finanzas',        descripcion: 'Próximamente',                href: '/finanzas',        disponible: false },
  { nombre: 'Reportes',        descripcion: 'Próximamente',                href: '/reportes',        disponible: false },
]

export default async function DashboardPage() {
  const empresa = await getEmpresaActiva()

  if (!empresa) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Bienvenido a ERP SaaS Chile</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-sm font-medium text-blue-800 mb-2">No tienes empresas configuradas</p>
          <p className="text-xs text-blue-600 mb-4">Crea tu primera empresa para comenzar a usar el sistema</p>
          <Link href="/admin/empresas/nueva"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Crear empresa
          </Link>
        </div>
      </div>
    )
  }

  const now = new Date()
  const mes = now.getMonth() + 1
  const anio = now.getFullYear()

  const [resVentas, resCompras, resMes, resRem] = await Promise.allSettled([
    getResumenIVAVentas(empresa.id, anio, mes),
    getResumenIVACompras(empresa.id, anio, mes),
    getResumenMes(empresa.id, anio, mes),
    getResumenRemuneraciones(empresa.id, mes, anio),
  ])

  const ventas = resVentas.status === 'fulfilled' ? resVentas.value : null
  const compras = resCompras.status === 'fulfilled' ? resCompras.value : null
  const contabilidad = resMes.status === 'fulfilled' ? resMes.value : null
  const remuneraciones = resRem.status === 'fulfilled' ? resRem.value : null

  const ventasTotal = ventas?.total ?? 0
  const comprasTotal = compras?.total ?? 0
  const ivaAPagar = Math.max(0, (ventas?.total_iva ?? 0) - (compras?.total_iva ?? 0))
  const resultado = (contabilidad?.ventas ?? 0) - (contabilidad?.compras ?? 0) - (contabilidad?.gastos ?? 0)

  const diasMes = new Date(anio, mes, 0).getDate()
  const diaActual = now.getDate()
  const diasVencF29 = 12 - diaActual
  const proximoVencimiento = mes <= 12 ? `12 de ${MESES[mes - 1]}` : ''

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            {empresa.razon_social} — {MESES[mes - 1]} {anio}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ventas del mes</p>
          <p className="text-2xl font-bold mt-1 text-blue-700 tabular-nums">{formatCurrency(ventasTotal)}</p>
          <p className="text-xs text-slate-400 mt-1">
            {(ventas?.cantidad ?? 0)} documentos emitidos
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Compras del mes</p>
          <p className="text-2xl font-bold mt-1 text-purple-700 tabular-nums">{formatCurrency(comprasTotal)}</p>
          <p className="text-xs text-slate-400 mt-1">
            {(compras?.cantidad ?? 0)} documentos registrados
          </p>
        </div>
        <div className={`border rounded-xl p-5 ${ivaAPagar > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">IVA a declarar</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${ivaAPagar > 0 ? 'text-orange-700' : 'text-green-700'}`}>
            {formatCurrency(ivaAPagar)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {ivaAPagar > 0 ? `Vence el ${proximoVencimiento}` : 'Con remanente crédito'}
          </p>
        </div>
        <div className={`border rounded-xl p-5 ${resultado >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Resultado del mes</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${resultado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(resultado)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Ingresos − Egresos</p>
        </div>
      </div>

      {/* Segunda fila de KPIs */}
      {remuneraciones && remuneraciones.total_trabajadores > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Trabajadores activos</p>
            <p className="text-2xl font-bold mt-1 text-slate-900">{remuneraciones.total_trabajadores}</p>
            <p className="text-xs text-slate-400 mt-1">Con contrato vigente</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Masa salarial</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 tabular-nums">{formatCurrency(remuneraciones.total_bruto)}</p>
            <p className="text-xs text-slate-400 mt-1">Total bruto del mes</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Liquidaciones generadas</p>
            <p className="text-2xl font-bold mt-1 text-slate-900">{remuneraciones.liquidaciones_aprobadas}</p>
            <p className="text-xs text-slate-400 mt-1">Aprobadas / pagadas</p>
          </div>
        </div>
      )}

      {/* Alertas tributarias */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Alertas y vencimientos</h2>
        <div className="space-y-2">
          {ivaAPagar > 0 && diaActual <= 12 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Declaración F29 pendiente</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Debes declarar y pagar {formatCurrency(ivaAPagar)} por IVA del mes anterior.
                  {diasVencF29 > 0 ? ` Vencimiento en ${diasVencF29} días.` : ' ¡Vence hoy!'}
                </p>
              </div>
              <Link href="/tributacion/f29" className="text-xs text-amber-700 font-medium hover:underline shrink-0">
                Ver F29 →
              </Link>
            </div>
          )}
          {diaActual >= 20 && diaActual <= 31 && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">Cierre de período próximo</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Estás en los últimos días de {MESES[mes - 1]}. Recuerda ingresar todos los documentos del período.
                </p>
              </div>
            </div>
          )}
          {ivaAPagar === 0 && diaActual > 12 && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800">Sin alertas tributarias pendientes para este período.</p>
            </div>
          )}
        </div>
      </div>

      {/* Módulos */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-4">Módulos del sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {MODULOS.map((modulo) => (
            <ModuloCard key={modulo.nombre} {...modulo} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ModuloCard({ nombre, descripcion, href, disponible }: {
  nombre: string; descripcion: string; href: string; disponible: boolean
}) {
  const content = (
    <div className={`bg-white border rounded-xl p-4 transition-all h-full ${
      disponible
        ? 'border-slate-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
        : 'border-slate-100 opacity-40 cursor-not-allowed'
    }`}>
      <p className="text-sm font-semibold text-slate-800">{nombre}</p>
      <p className="text-xs text-slate-400 mt-0.5">{descripcion}</p>
      {!disponible && (
        <span className="inline-block mt-2 text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
          Próximamente
        </span>
      )}
    </div>
  )
  if (!disponible) return content
  return <Link href={href}>{content}</Link>
}
