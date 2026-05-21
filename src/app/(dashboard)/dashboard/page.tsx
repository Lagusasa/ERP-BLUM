import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Bienvenido a ERP SaaS Chile</p>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          titulo="Ventas del mes"
          valor="$0"
          descripcion="Sin datos aún"
          color="blue"
          icono="ventas"
        />
        <KpiCard
          titulo="Compras del mes"
          valor="$0"
          descripcion="Sin datos aún"
          color="purple"
          icono="compras"
        />
        <KpiCard
          titulo="IVA por pagar"
          valor="$0"
          descripcion="Sin datos aún"
          color="orange"
          icono="iva"
        />
        <KpiCard
          titulo="Resultado del mes"
          valor="$0"
          descripcion="Sin datos aún"
          color="green"
          icono="resultado"
        />
      </div>

      {/* Módulos disponibles */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-4">Módulos activos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {MODULOS.map((modulo) => (
            <ModuloCard key={modulo.nombre} {...modulo} />
          ))}
        </div>
      </div>

      {/* Alertas tributarias */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-4">Alertas y vencimientos</h2>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-400 text-center py-4">
            No hay alertas pendientes. Configura tu empresa para comenzar.
          </p>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  titulo,
  valor,
  descripcion,
  color,
}: {
  titulo: string
  valor: string
  descripcion: string
  color: 'blue' | 'purple' | 'orange' | 'green'
  icono: string
}) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-100',
    purple: 'bg-purple-50 border-purple-100',
    orange: 'bg-orange-50 border-orange-100',
    green: 'bg-green-50 border-green-100',
  }
  const textMap = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    green: 'text-green-600',
  }

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{titulo}</p>
      <p className={`text-2xl font-bold mt-1 ${textMap[color]}`}>{valor}</p>
      <p className="text-xs text-slate-400 mt-1">{descripcion}</p>
    </div>
  )
}

function ModuloCard({
  nombre,
  descripcion,
  href,
  disponible,
}: {
  nombre: string
  descripcion: string
  href: string
  disponible: boolean
}) {
  const content = (
    <div className={`bg-white border rounded-xl p-4 transition-all ${
      disponible
        ? 'border-slate-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
        : 'border-slate-100 opacity-50 cursor-not-allowed'
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

  return <a href={href}>{content}</a>
}

const MODULOS = [
  { nombre: 'Contabilidad', descripcion: 'Plan de cuentas y libros', href: '/contabilidad', disponible: false },
  { nombre: 'Compras', descripcion: 'Proveedores y facturas', href: '/compras', disponible: false },
  { nombre: 'Ventas', descripcion: 'Clientes y documentos', href: '/ventas', disponible: false },
  { nombre: 'Tributación', descripcion: 'IVA, F29, F22', href: '/tributacion', disponible: false },
  { nombre: 'Remuneraciones', descripcion: 'Liquidaciones y finiquitos', href: '/remuneraciones', disponible: false },
  { nombre: 'RRHH', descripcion: 'Trabajadores y contratos', href: '/rrhh', disponible: false },
  { nombre: 'Inventario', descripcion: 'Productos y bodegas', href: '/inventario', disponible: false },
  { nombre: 'Finanzas', descripcion: 'Flujo de caja y bancos', href: '/finanzas', disponible: false },
  { nombre: 'Reportes', descripcion: 'BI y analytics', href: '/reportes', disponible: false },
  { nombre: 'Administración', descripcion: 'Usuarios y permisos', href: '/admin', disponible: false },
]
