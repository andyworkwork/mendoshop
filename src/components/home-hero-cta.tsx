import Link from 'next/link'
import { getSessionNavState } from '@/lib/session-nav'

export async function HomeHeroCta() {
  const { loggedIn, hasShop } = await getSessionNavState()

  if (loggedIn && hasShop) {
    return (
      <div className="mt-8 flex w-full max-w-xl flex-wrap items-center justify-center gap-4">
        <Link href="/dashboard" className="btn-primary min-w-[200px] px-6 py-3 text-base">
          Ir a mi tienda
        </Link>
        <Link href="#tiendas" className="btn-secondary-outline min-w-[200px]">
          Ver tiendas
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8 flex w-full max-w-xl flex-wrap items-center justify-center gap-4">
      <Link href="/registro" className="btn-primary min-w-[200px] px-6 py-3 text-base">
        Crear mi tienda gratis
      </Link>
      <Link href="/precios" className="btn-secondary-outline min-w-[200px]">
        Ver precios
      </Link>
      <Link href="#tiendas" className="btn-secondary-outline min-w-[200px]">
        Ver tiendas
      </Link>
    </div>
  )
}
