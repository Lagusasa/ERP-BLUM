'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Resumen',         href: '/remuneraciones' },
  { label: 'Trabajadores',    href: '/remuneraciones/trabajadores' },
  { label: 'Asistencia',      href: '/remuneraciones/asistencia' },
  { label: 'Vacaciones',      href: '/remuneraciones/vacaciones' },
  { label: 'Liquidaciones',   href: '/remuneraciones/liquidaciones' },
  { label: 'Cotizaciones',    href: '/remuneraciones/cotizaciones' },
  { label: 'Libro de Rem.',   href: '/remuneraciones/libro' },
  { label: 'Honorarios',      href: '/remuneraciones/honorarios' },
  { label: 'Terminaciones',   href: '/remuneraciones/terminaciones' },
  { label: 'Indicadores',     href: '/remuneraciones/indicadores' },
  { label: 'Certificados',    href: '/remuneraciones/certificados' },
]

export default function RemuneracionesNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 border-b border-slate-200 overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.href === '/remuneraciones'
          ? pathname === '/remuneraciones'
          : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              active
                ? 'border-emerald-700 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
