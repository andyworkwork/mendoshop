import Link from 'next/link'
import { signOutAction } from '@/app/actions/shop'
import type { ShopRow } from '@/types/shop'
import { shopPublicUrl } from '@/lib/publicUrl'

const links = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/dashboard/catalog', label: 'Catálogo' },
  { href: '/dashboard/settings', label: 'Ajustes y SEO' },
  { href: '/dashboard/qr', label: 'QR' },
] as const

export function DashboardShell({
  shop,
  children,
}: {
  shop: ShopRow
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-bold text-teal-400">
            Mendoshop
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 hover:bg-zinc-800">
                {l.label}
              </Link>
            ))}
            <a
              href={shopPublicUrl(shop.slug)}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-3 py-1.5 text-teal-400 hover:bg-zinc-800"
            >
              Ver tienda ↗
            </a>
          </nav>
          <form action={signOutAction}>
            <button type="submit" className="text-sm text-zinc-500 hover:text-white">
              Salir
            </button>
          </form>
        </div>
        <p className="mx-auto max-w-5xl px-4 pb-2 text-xs text-zinc-500">{shop.name}</p>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
