'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Todas las tiendas' },
  { href: '/admin/crear-cuenta', label: 'Crear cuenta' },
  { href: '/admin/historial-planes', label: 'Historial de planes' },
] as const

export function AdminSubNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1"
      aria-label="Secciones de administración"
    >
      {LINKS.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-brand/15 text-brand'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
