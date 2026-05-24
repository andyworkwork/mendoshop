'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Todas las tiendas' },
  { href: '/admin/plantillas', label: 'Plantillas home' },
  { href: '/admin/crear-cuenta', label: 'Crear cuenta' },
  { href: '/admin/historial-planes', label: 'Historial de planes' },
  { href: '/admin/gasto', label: 'Gasto' },
] as const

export function AdminSubNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5 sm:gap-2"
      aria-label="Secciones de administración"
    >
      {LINKS.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`caps-nav-btn ${isActive ? 'caps-nav-btn--active' : 'caps-nav-btn--ghost'}`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
