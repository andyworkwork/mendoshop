'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  href: string
  children: React.ReactNode
  /** Rutas que también marcan este enlace como activo */
  activePrefixes?: string[]
  className?: string
}

export function SiteNavLink({ href, children, activePrefixes, className }: Props) {
  const pathname = usePathname()
  const prefixes = activePrefixes ?? []
  const isActive =
    pathname === href ||
    prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`caps-nav-btn ${isActive ? 'caps-nav-btn--active-glass' : 'caps-nav-btn--ghost-glass'} ${className ?? ''}`}
    >
      {children}
    </Link>
  )
}
