'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  children?: NavItem[]
  disponible?: boolean
}

const NAV_MODULOS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    disponible: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Contabilidad',
    href: '/contabilidad',
    disponible: true,
    children: [
      { label: 'Resumen',              href: '/contabilidad',                                    icon: null, disponible: true },
      { label: 'Plan de Cuentas',     href: '/contabilidad/plan-cuentas',                        icon: null, disponible: true },
      { label: 'Libro Diario',        href: '/contabilidad/libro-diario',                        icon: null, disponible: true },
      { label: 'Libro Mayor',         href: '/contabilidad/libro-mayor',                         icon: null, disponible: true },
      { label: 'Reportes',            href: '/contabilidad/reportes',                            icon: null, disponible: true },
      { label: 'Configuración',       href: '/contabilidad/config',                              icon: null, disponible: true },
    ],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Compras',
    href: '/compras',
    disponible: true,
    children: [
      { label: 'Resumen',     href: '/compras',               icon: null, disponible: true },
      { label: 'Documentos',  href: '/compras/documentos',    icon: null, disponible: true },
      { label: 'Proveedores', href: '/compras/proveedores',   icon: null, disponible: true },
    ],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Ventas',
    href: '/ventas',
    disponible: true,
    children: [
      { label: 'Resumen',    href: '/ventas',             icon: null, disponible: true },
      { label: 'Documentos', href: '/ventas/documentos',  icon: null, disponible: true },
      { label: 'Clientes',   href: '/ventas/clientes',    icon: null, disponible: true },
    ],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: 'Tributación',
    href: '/tributacion',
    disponible: true,
    children: [
      { label: 'Resumen',          href: '/tributacion',                icon: null, disponible: true },
      { label: 'Libro Compras',    href: '/tributacion/libro-compras',  icon: null, disponible: true },
      { label: 'Libro Ventas',     href: '/tributacion/libro-ventas',   icon: null, disponible: true },
      { label: 'Declaración F29',  href: '/tributacion/f29',            icon: null, disponible: true },
      { label: 'RLI',              href: '/tributacion/rli',            icon: null, disponible: true },
    ],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
  {
    label: 'Remuneraciones',
    href: '/remuneraciones',
    disponible: true,
    children: [
      { label: 'Resumen',       href: '/remuneraciones',                       icon: null, disponible: true },
      { label: 'Trabajadores',  href: '/remuneraciones/trabajadores',           icon: null, disponible: true },
      { label: 'Liquidaciones', href: '/remuneraciones/liquidaciones',          icon: null, disponible: true },
    ],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Workflows',
    href: '/workflows',
    disponible: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
  },
  {
    label: 'Gestión Documental',
    href: '/gestion-documental',
    disponible: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    label: 'RRHH',
    href: '/rrhh',
    disponible: false,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Inventario',
    href: '/inventario',
    disponible: true,
    children: [
      { label: 'Resumen',    href: '/inventario',           icon: null, disponible: true },
      { label: 'Productos',  href: '/inventario/productos', icon: null, disponible: true },
      { label: 'Kardex',     href: '/inventario/kardex',    icon: null, disponible: true },
      { label: 'Bodegas',    href: '/inventario/bodegas',   icon: null, disponible: true },
    ],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'Finanzas',
    href: '/finanzas',
    disponible: false,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Reportes',
    href: '/reportes',
    disponible: false,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

const NAV_CONFIG: NavItem[] = [
  {
    label: 'Administración',
    href: '/admin',
    disponible: true,
    children: [
      { label: 'Empresas', href: '/admin/empresas', icon: null, disponible: true },
      { label: 'Usuarios', href: '/admin/usuarios', icon: null, disponible: true },
    ],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">ERP SaaS Chile</p>
            <p className="text-slate-400 text-xs">v0.1.0</p>
          </div>
        </div>
      </div>

      {/* Empresa activa */}
      <div className="px-4 py-3 border-b border-slate-800">
        <button className="w-full flex items-center gap-2 text-left hover:bg-slate-800 rounded-lg px-2 py-1.5 transition-colors group">
          <div className="w-6 h-6 rounded bg-blue-600/20 flex items-center justify-center shrink-0">
            <span className="text-blue-400 text-xs font-bold">E</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-300 text-xs font-medium truncate">Sin empresa</p>
            <p className="text-slate-500 text-xs truncate">Selecciona empresa</p>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-2 mb-2">Módulos</p>
        {NAV_MODULOS.map((item) => (
          <NavItemComponent key={item.href} item={item} pathname={pathname} />
        ))}

        <div className="pt-4">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-2 mb-2">Sistema</p>
          {NAV_CONFIG.map((item) => (
            <NavItemComponent key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-800">
        <p className="text-slate-600 text-xs text-center">ERP SaaS Chile © 2026</p>
      </div>
    </aside>
  )
}

function NavItemComponent({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const hasChildren = (item.children?.length ?? 0) > 0
  const childrenActive = hasChildren && pathname.startsWith(item.href)

  if (!item.disponible) {
    return (
      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg opacity-40 cursor-not-allowed">
        <span className="text-slate-500 shrink-0">{item.icon}</span>
        <span className="text-slate-500 text-sm">{item.label}</span>
      </div>
    )
  }

  if (hasChildren) {
    return (
      <div>
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors',
            childrenActive
              ? 'text-white bg-slate-700'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          )}
        >
          <span className={cn('shrink-0', childrenActive ? 'text-blue-400' : 'text-slate-500')}>
            {item.icon}
          </span>
          <span className="flex-1">{item.label}</span>
          <svg
            className={cn('w-3 h-3 transition-transform text-slate-500', childrenActive ? 'rotate-90' : '')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {childrenActive && (
          <div className="mt-0.5 ml-3 pl-3 border-l border-slate-700 space-y-0.5">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'block px-2.5 py-1 text-xs rounded-lg transition-colors',
                  pathname === child.href || (child.href !== item.href && pathname.startsWith(child.href))
                    ? 'text-white bg-blue-600'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors',
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      )}
    >
      <span className={cn('shrink-0', isActive ? 'text-white' : 'text-slate-500')}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  )
}
