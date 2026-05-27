import Link from 'next/link'
import { DashboardFirstStepsCta } from '@/components/dashboard-first-steps-cta'
import { DashboardProStats } from '@/components/dashboard-pro-stats'
import { requireDashboardShop } from '@/lib/dashboard'
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
      <DashboardFirstStepsCta shopId={shop.id} productCount={products} />
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
    </div>
  )
}
