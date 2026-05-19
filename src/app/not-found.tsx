import { MendoshopPageBackground } from '@/components/mendoshop-page-background'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="relative mendoshop-page-bg flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <MendoshopPageBackground />
      <h1 className="relative z-10 text-2xl font-bold">No encontrado</h1>
      <p className="relative z-10 text-zinc-400">La tienda o la página que buscás no existe.</p>
      <Link href="/" className="btn-primary relative z-10">
        Ir a Mendoshop
      </Link>
    </div>
  )
}
