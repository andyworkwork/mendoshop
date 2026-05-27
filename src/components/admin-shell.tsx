import Link from 'next/link'
import { MendoshopLogoLink } from '@/components/mendoshop-logo'
import { signOutAction } from '@/app/actions/shop'

export function AdminShell({
  adminEmail,
  children,
}: {
  adminEmail: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <MendoshopLogoLink size={40} className="shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-brand">Panel admin</p>
              <p className="truncate text-xs text-zinc-500">{adminEmail}</p>
            </div>
          </div>
          <nav
            className="-mx-1 flex flex-wrap items-center justify-end gap-1.5 sm:mx-0 sm:gap-2"
            aria-label="Acciones de administración"
          >
            <Link href="/" className="caps-nav-btn caps-nav-btn--ghost">
              Sitio público
            </Link>
            <Link href="/dashboard" className="caps-nav-btn caps-nav-btn--ghost">
              Mi dashboard
            </Link>
            <form action={signOutAction} className="inline">
              <button type="submit" className="caps-nav-btn caps-nav-btn--muted">
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-6 pt-0 sm:pb-8 sm:pt-0">{children}</main>
    </div>
  )
}
