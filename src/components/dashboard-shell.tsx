'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MendoshopLogoLink } from '@/components/mendoshop-logo'
import { signOutAction } from '@/app/actions/shop'
import { shopPublicUrl } from '@/lib/publicUrl'
import type { ShopRow } from '@/types/shop'

const links = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/dashboard/mis-redes', label: 'Mis redes' },
  { href: '/dashboard/editar-tienda', label: 'Editar tienda' },
  { href: '/dashboard/catalog', label: 'Catálogo' },
  { href: '/dashboard/settings', label: 'Ajustes' },
  { href: '/dashboard/account', label: 'Cuenta' },
] as const

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardShell({
  shop,
  platformAdmin = false,
  userEmail,
  children,
}: {
  shop: ShopRow
  platformAdmin?: boolean
  userEmail: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const vitrinaUrl = shopPublicUrl(shop.slug)

  return (
    <div className="dashboard-page-bg">
      <header className="relative z-10 border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <MendoshopLogoLink size={40} className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" />
            <div className="min-w-0">
              <p className="font-semibold text-brand">Mi tienda</p>
              <p className="truncate text-xs text-zinc-500">{userEmail || shop.name}</p>
            </div>
          </div>
          <nav
            className="-mx-1 flex flex-wrap items-center justify-end gap-1.5 sm:mx-0 sm:gap-2"
            aria-label="Acciones del panel"
          >
            <Link href="/" className="caps-nav-btn caps-nav-btn--ghost">
              Sitio público
            </Link>
            <a
              href={vitrinaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="caps-nav-btn caps-nav-btn--ghost"
            >
              Mi tienda
            </a>
            {platformAdmin && (
              <Link href="/admin" className="caps-nav-btn caps-nav-btn--ghost">
                Panel admin
              </Link>
            )}
            <form action={signOutAction} className="inline">
              <button type="submit" className="caps-nav-btn caps-nav-btn--muted">
                Salir
              </button>
            </form>
          </nav>
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-3">
          <nav
            className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5 sm:gap-2"
            aria-label="Secciones del panel"
          >
            {links.map((l) => {
              const active = isNavActive(pathname, l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`caps-nav-btn ${active ? 'caps-nav-btn--active' : 'caps-nav-btn--ghost'}`}
                >
                  {l.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
