import Link from 'next/link'
import { signOutAction } from '@/app/actions/shop'
import { MendoshopLogoLink } from '@/components/mendoshop-logo'
import { getSessionNavState } from '@/lib/session-nav'

export async function SiteHeader() {
  const { loggedIn, hasShop, admin } = await getSessionNavState()

  return (
    <header className="border-b border-white/10 bg-black/45 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <MendoshopLogoLink size={48} priority />
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm sm:gap-3">
          <Link href="/#tiendas" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white">
            Tiendas
          </Link>

          {loggedIn ? (
            <>
              {hasShop && (
                <Link href="/dashboard" className="btn-primary px-3 py-1.5 text-sm">
                  Mi tienda
                </Link>
              )}
              {admin && (
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-1.5 text-brand hover:bg-white/5 hover:text-white"
                >
                  Admin
                </Link>
              )}
              {!hasShop && (
                <Link href="/registro" className="btn-primary px-3 py-1.5 text-sm">
                  Crear mi tienda
                </Link>
              )}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                Entrar
              </Link>
              <Link href="/registro" className="btn-primary px-3 py-1.5 text-sm">
                Crear mi tienda
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
