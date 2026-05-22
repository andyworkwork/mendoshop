import Link from 'next/link'
import { fetchShopViewStats, fetchTopProductsByDetailViews } from '@/lib/shop-analytics'
import { planHasViewCount } from '@/lib/plans'
import type { ShopRow } from '@/types/shop'

export async function DashboardProStats({ shop }: { shop: ShopRow }) {
  if (!planHasViewCount(shop.plan)) {
    return (
      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Estadísticas</h2>
        <p className="text-sm text-zinc-400">
          Visitas y productos más vistos están en el plan Pro.{' '}
          <Link href="/precios" className="text-brand-accent underline">
            Ver planes
          </Link>
        </p>
      </section>
    )
  }

  const [stats, topProducts] = await Promise.all([
    fetchShopViewStats(shop.id),
    fetchTopProductsByDetailViews(shop.id, 5),
  ])

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Estadísticas (Pro)</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 px-3 py-2">
          <p className="text-xs text-zinc-500">Visitas (7 días)</p>
          <p className="text-xl font-semibold text-white">{stats.views7d}</p>
        </article>
        <article className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 px-3 py-2">
          <p className="text-xs text-zinc-500">Visitas (30 días)</p>
          <p className="text-xl font-semibold text-white">{stats.views30d}</p>
        </article>
        <article className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 px-3 py-2">
          <p className="text-xs text-zinc-500">Total histórico</p>
          <p className="text-xl font-semibold text-white">{stats.totalViews}</p>
        </article>
      </div>
      <div>
        <h3 className="text-sm font-medium text-zinc-300">Productos más consultados</h3>
        <p className="text-xs text-zinc-500 mb-2">
          Cada vez que un cliente abre el detalle de un producto (clic en la foto).
        </p>
        {topProducts.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no hay consultas registradas.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {topProducts.map((p, i) => (
              <li key={p.id} className="flex justify-between gap-2 text-zinc-300">
                <span>
                  {i + 1}. {p.name}
                </span>
                <span className="text-zinc-500 shrink-0">{p.detail_view_count} vistas</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
