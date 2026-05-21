'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Resumen',         href: '/tributacion' },
  { label: 'Libro IVA Compras', href: '/tributacion/libro-compras' },
  { label: 'Libro IVA Ventas',  href: '/tributacion/libro-ventas' },
  { label: 'Declaración F29',   href: '/tributacion/f29' },
]

export default function TributacionNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 border-b border-slate-200 overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.href === '/tributacion'
          ? pathname === '/tributacion'
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
