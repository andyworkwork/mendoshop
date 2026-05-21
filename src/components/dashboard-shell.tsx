import Link from 'next/link'
import { MendoshopLogoLink } from '@/components/mendoshop-logo'
import { signOutAction } from '@/app/actions/shop'
import type { ShopRow } from '@/types/shop'
import { shopPublicUrl } from '@/lib/publicUrl'

const links = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/dashboard/editar-tienda', label: 'Editar tienda' },
  { href: '/dashboard/catalog', label: 'Catálogo' },
  { href: '/dashboard/settings', label: 'Ajustes y SEO' },
  { href: '/dashboard/account', label: 'Cuenta' },
  { href: '/dashboard/qr', label: 'QR' },
] as const

export function DashboardShell({
  shop,
  platformAdmin = false,
  children,
}: {
  shop: ShopRow
  platformAdmin?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-page-bg">
      <header className="relative z-10 border-b border-white/10 bg-black/45 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <MendoshopLogoLink size={44} />
          <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={shopPublicUrl(shop.slug)}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-3 py-1.5 text-brand-accent transition hover:bg-white/5"
            >
              Ir a tienda ↗
            </a>
            {platformAdmin && (
              <Link
                href="/admin"
                className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 font-medium text-brand transition hover:bg-brand/20"
              >
                Panel admin
              </Link>
            )}
          </nav>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-white/5 hover:text-white"
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
