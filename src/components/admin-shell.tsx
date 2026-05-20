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
            <MendoshopLogoLink size={36} className="sm:hidden" />
            <MendoshopLogoLink size={40} className="hidden sm:inline-flex" />
            <div className="min-w-0">
              <p className="font-semibold text-brand">Panel admin</p>
              <p className="truncate text-xs text-zinc-500">{adminEmail}</p>
            </div>
          </div>
          <nav className="-mx-1 flex items-center gap-1 overflow-x-auto pb-0.5 text-sm sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
            <Link
              href="/"
              className="shrink-0 rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Sitio público
            </Link>
            <Link
              href="/dashboard"
              className="shrink-0 rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Mi dashboard
            </Link>
            <form action={signOutAction} className="shrink-0">
              <button type="submit" className="rounded-lg px-3 py-1.5 text-zinc-500 hover:text-white">
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  )
}
