'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MendoshopLogoLink } from '@/components/mendoshop-logo'
import { signOutAction } from '@/app/actions/shop'
import type { ShopRow } from '@/types/shop'

const links = [
  { href: '/dashboard', label: 'INICIO' },
  { href: '/dashboard/editar-tienda', label: 'EDITAR TIENDA' },
  { href: '/dashboard/catalog', label: 'CATÁLOGO' },
  { href: '/dashboard/settings', label: 'AJUSTES' },
  { href: '/dashboard/account', label: 'CUENTA' },
] as const

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardShell({
  shop,
  platformAdmin = false,
  children,
}: {
  shop: ShopRow
  platformAdmin?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="dashboard-page-bg">
      <header className="relative z-10 border-b border-white/10 bg-black/45 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <MendoshopLogoLink size={44} />
          <nav className="flex flex-wrap items-center gap-1.5 text-sm sm:gap-2">
            {links.map((l) => {
              const active = isNavActive(pathname, l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide transition sm:text-sm ${
                    active
                      ? 'border-brand/60 bg-brand/15 text-brand shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand-orange)_35%,transparent)]'
                      : 'border-transparent text-zinc-400 hover:border-zinc-600/80 hover:bg-white/5 hover:text-zinc-100'
                  }`}
                >
                  {l.label}
                </Link>
              )
            })}
            {platformAdmin && (
              <Link
                href="/admin"
                className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-brand transition hover:bg-brand/20 sm:text-sm"
              >
                PANEL ADMIN
              </Link>
            )}
          </nav>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 transition hover:bg-white/5 hover:text-white sm:text-sm"
            >
              Salir
            </button>
          </form>
        </div>
        <p className="mx-auto max-w-5xl px-4 pb-2 text-xs text-zinc-400">
          <span className="text-brand">{shop.name}</span>
        </p>
      </header>
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
