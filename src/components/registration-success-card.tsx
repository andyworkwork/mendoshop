import Link from 'next/link'
import { shopPublicUrl } from '@/lib/publicUrl'

export function RegistrationSuccessCard({
  shopName,
  shopSlug,
}: {
  shopName: string
  shopSlug: string
}) {
  const vitrinaUrl = shopPublicUrl(shopSlug)

  return (
    <div className="card mx-auto max-w-lg space-y-5 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">
          Cuenta creada con éxito
        </p>
        <h1 className="text-2xl font-bold text-white">¡Tu tienda está lista!</h1>
        <p className="text-sm text-zinc-300">
          <span className="font-semibold text-white">{shopName}</span> ya tiene 7 días de prueba gratis en
          Mendoshop.
        </p>
      </div>

      <p className="rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400">
        Link público:{' '}
        <span className="break-all font-medium text-brand">/tienda/{shopSlug}</span>
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/dashboard" className="btn-primary px-6 py-3">
          Ir al panel de mi tienda
        </Link>
        <a
          href={vitrinaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary-outline px-6 py-3 text-center"
        >
          Ver mi vitrina
        </a>
      </div>

      <p className="text-xs text-zinc-500">
        Desde el panel podés cargar productos, cambiar colores y compartir tu link en redes.
      </p>
    </div>
  )
}
