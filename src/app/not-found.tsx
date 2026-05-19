import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mendoshop-page-bg flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">No encontrado</h1>
      <p className="text-zinc-400">La tienda o la página que buscás no existe.</p>
      <Link href="/" className="btn-primary">
        Ir a Mendoshop
      </Link>
    </div>
  )
}
