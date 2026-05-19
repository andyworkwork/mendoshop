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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <MendoshopLogoLink size={40} />
            <div>
              <p className="font-semibold text-brand">Panel admin</p>
              <p className="text-xs text-zinc-500">{adminEmail}</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
              Sitio público
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Mi dashboard
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="rounded-lg px-3 py-1.5 text-zinc-500 hover:text-white">
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
