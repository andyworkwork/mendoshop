import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-teal-400">
          Mendoshop
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/#tiendas" className="text-zinc-400 hover:text-white">
            Tiendas
          </Link>
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
