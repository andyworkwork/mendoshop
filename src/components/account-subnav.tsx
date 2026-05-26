'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard/account/plan', label: 'Plan' },
  { href: '/dashboard/account/configuracion', label: 'Configuración' },
] as const

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AccountSubnav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1"
      aria-label="Secciones de cuenta"
    >
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
              active
                ? 'bg-brand/15 text-brand ring-1 ring-brand/40'
                : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
