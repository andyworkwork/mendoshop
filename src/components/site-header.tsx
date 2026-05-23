import Link from 'next/link'
import { signOutAction } from '@/app/actions/shop'
import { MendoshopLogoLink } from '@/components/mendoshop-logo'
import { SiteNavLink } from '@/components/site-nav-link'
import { getSessionNavState } from '@/lib/session-nav'

export async function SiteHeader() {
  const { loggedIn, hasShop, admin } = await getSessionNavState()

  return (
    <header className="border-b border-white/10 bg-black/45 backdrop-blur-md">
      <div className="site-header-bar mx-auto max-w-6xl px-3 py-2 sm:px-4 sm:py-3">
        <MendoshopLogoLink size={40} priority className="site-header-bar__logo" />

        <div className="site-header-bar__nav">
          <div className="site-header-bar__nav-row site-header-bar__nav-row--primary">
            <SiteNavLink href="/">Tiendas</SiteNavLink>
            <SiteNavLink href="/precios">Precios</SiteNavLink>
            {loggedIn && hasShop && (
              <Link href="/dashboard" className="caps-nav-btn caps-nav-btn--cta max-sm:hidden">
                Mi tienda
              </Link>
            )}
            {loggedIn && admin && (
              <SiteNavLink href="/admin" activePrefixes={['/admin']} className="max-sm:hidden">
                Admin
              </SiteNavLink>
            )}
          </div>

          <div className="site-header-bar__nav-row site-header-bar__nav-row--secondary">
            {loggedIn ? (
              <>
                {hasShop && (
                  <Link href="/dashboard" className="caps-nav-btn caps-nav-btn--cta sm:hidden">
                    Mi tienda
                  </Link>
                )}
                {admin && (
                  <SiteNavLink href="/admin" activePrefixes={['/admin']} className="sm:hidden">
                    Admin
                  </SiteNavLink>
                )}
                {!hasShop && (
                  <Link href="/registro" className="caps-nav-btn caps-nav-btn--cta">
                    Crear mi tienda
                  </Link>
                )}
                <form action={signOutAction} className="inline">
                  <button type="submit" className="caps-nav-btn caps-nav-btn--ghost-glass">
                    Salir
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="caps-nav-btn caps-nav-btn--ghost-glass">
                  Entrar
                </Link>
                <Link href="/registro" className="caps-nav-btn caps-nav-btn--cta">
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
