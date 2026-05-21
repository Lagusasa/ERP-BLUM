'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Empresas', href: '/admin/empresas' },
  { label: 'Usuarios', href: '/admin/usuarios' },
]

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 border-b border-slate-200">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            pathname.startsWith(tab.href)
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
