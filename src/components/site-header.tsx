import Link from 'next/link'
import { MendoshopLogoLink } from '@/components/mendoshop-logo'
import { isPlatformAdmin } from '@/lib/admin'

export async function SiteHeader() {
  const admin = await isPlatformAdmin()

  return (
    <header className="border-b border-white/10 bg-black/45 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <MendoshopLogoLink size={48} priority />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/#tiendas" className="text-zinc-400 hover:text-white">
            Tiendas
          </Link>
          {admin && (
            <Link href="/admin" className="text-brand hover:text-white">
              Admin
            </Link>
          )}
          <Link href="/login" className="text-zinc-400 hover:text-white">
            Entrar
          </Link>
          <Link href="/registro" className="btn-primary text-sm">
            Crear mi tienda
          </Link>
        </nav>
      </div>
    </header>
  )
}
