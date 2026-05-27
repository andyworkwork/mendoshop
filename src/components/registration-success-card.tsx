import Link from 'next/link'
import { RegistrationCard, RegistrationHeader } from '@/components/registration-friendly-ui'
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
    <RegistrationCard>
      <RegistrationHeader title="¡Tu tienda está lista!" subtitle="Cuenta creada con éxito" />
      <div className="registration-card-body space-y-5 text-center">
        <p className="text-sm text-zinc-300">
          <span className="font-semibold text-white">{shopName}</span> ya tiene 7 días de prueba gratis en
          Mendoshop.
        </p>

        <p className="rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400">
          Tu link público:{' '}
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
    </RegistrationCard>
  )
}
