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

const base =
  'rounded-lg px-3 py-1.5 transition border border-transparent text-zinc-400 hover:border-zinc-600/80 hover:bg-white/5 hover:text-zinc-100'
const activeCls = 'border-zinc-600/80 bg-white/5 text-white'

export function SiteNavLink({ href, children, activePrefixes, className }: Props) {
  const pathname = usePathname()
  const prefixes = activePrefixes ?? []
  const isActive =
    pathname === href ||
    prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  return (
    <Link href={href} className={`${base} ${isActive ? activeCls : ''} ${className ?? ''}`}>
      {children}
    </Link>
  )
}
