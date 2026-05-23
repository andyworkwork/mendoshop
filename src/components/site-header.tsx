import Link from 'next/link'
import { signOutAction } from '@/app/actions/shop'
import { MendoshopLogoLink } from '@/components/mendoshop-logo'
import { SiteNavLink } from '@/components/site-nav-link'
import { getSessionNavState } from '@/lib/session-nav'

const navLinkCompact = 'px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm'
const btnCompact = 'btn-primary px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm'
const textBtnCompact =
  'rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white sm:px-3 sm:py-1.5 sm:text-sm'

export async function SiteHeader() {
  const { loggedIn, hasShop, admin } = await getSessionNavState()

  return (
    <header className="border-b border-white/10 bg-black/45 backdrop-blur-md">
      <div className="site-header-bar mx-auto max-w-6xl px-3 py-2 sm:px-4 sm:py-3">
        <MendoshopLogoLink size={40} priority className="site-header-bar__logo" />

        <div className="site-header-bar__nav">
          <div className="site-header-bar__nav-row site-header-bar__nav-row--primary">
          <SiteNavLink href="/" className={navLinkCompact}>
            Tiendas
          </SiteNavLink>
          <SiteNavLink href="/precios" className={navLinkCompact}>
            Precios
          </SiteNavLink>
          {loggedIn && hasShop && (
            <Link href="/dashboard" className={`${btnCompact} max-sm:hidden`}>
              Mi tienda
            </Link>
          )}
          {loggedIn && admin && (
            <SiteNavLink href="/admin" activePrefixes={['/admin']} className={`${navLinkCompact} max-sm:hidden`}>
              Admin
            </SiteNavLink>
          )}
        </div>

        <div className="site-header-bar__nav-row site-header-bar__nav-row--secondary">
          {loggedIn ? (
            <>
              {hasShop && (
                <Link href="/dashboard" className={`${btnCompact} sm:hidden`}>
                  Mi tienda
                </Link>
              )}
              {admin && (
                <SiteNavLink href="/admin" activePrefixes={['/admin']} className={`${navLinkCompact} sm:hidden`}>
                  Admin
                </SiteNavLink>
              )}
              {!hasShop && (
                <Link href="/registro" className={btnCompact}>
                  Crear mi tienda
                </Link>
              )}
              <form action={signOutAction} className="inline">
                <button type="submit" className={textBtnCompact}>
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={textBtnCompact}>
                Entrar
              </Link>
              <Link href="/registro" className={btnCompact}>
                Crear mi tienda
              </Link>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}
