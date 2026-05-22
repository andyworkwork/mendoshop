import Link from 'next/link'
import { DashboardProStats } from '@/components/dashboard-pro-stats'
import { requireDashboardShop } from '@/lib/dashboard'
import { shopPublicUrl } from '@/lib/publicUrl'
import { planHasViewCount, planLabel } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { fetchCategoriesWithNested, countProducts } from '@/lib/fetch-catalog'

export default async function DashboardHomePage() {
  const shop = await requireDashboardShop()
  const supabase = await createClient()
  const categories = await fetchCategoriesWithNested(supabase, shop.id, { includeInactive: true })
  const products = countProducts(categories)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de {shop.name}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="card">
          <p className="text-sm text-zinc-500">Plan</p>
          <p className="text-lg font-semibold">{planLabel(shop.plan)}</p>
        </article>
        <article className="card">
          <p className="text-sm text-zinc-500">Productos</p>
          <p className="text-lg font-semibold">{products}</p>
        </article>
        <article className="card">
          <p className="text-sm text-zinc-500">Visitas (total)</p>
          {planHasViewCount(shop.plan) ? (
            <p className="text-lg font-semibold">{shop.view_count}</p>
          ) : (
            <p className="text-sm text-zinc-400">
              Plan Pro{' '}
              <Link href="/precios" className="text-brand-accent underline">
                Ver planes
              </Link>
            </p>
          )}
        </article>
      </div>

      <DashboardProStats shop={shop} />

      <div className="card space-y-3">
        <h2 className="font-semibold">Accesos rápidos</h2>
        <p className="text-sm text-zinc-400 break-all">{shopPublicUrl(shop.slug)}</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/mis-redes" className="btn-primary text-sm">
            Mis redes y link
          </Link>
          <Link href="/dashboard/editar-tienda" className="rounded-xl border border-zinc-600 px-4 py-2 text-sm">
            Editar tienda
          </Link>
          <Link href="/dashboard/catalog" className="rounded-xl border border-zinc-600 px-4 py-2 text-sm">
            Catálogo
          </Link>
          <Link href="/dashboard/account" className="rounded-xl border border-zinc-600 px-4 py-2 text-sm">
            Cuenta
          </Link>
        </div>
      </div>
    </div>
  )
}
