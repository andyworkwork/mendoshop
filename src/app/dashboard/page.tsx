import Link from 'next/link'
import { requireDashboardShop } from '@/lib/dashboard'
import { shopPublicUrl } from '@/lib/publicUrl'
import { planLabel, isShopSubscriptionActive } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { fetchCategoriesWithNested, countProducts } from '@/lib/fetch-catalog'

export default async function DashboardHomePage() {
  const shop = await requireDashboardShop()
  const supabase = await createClient()
  const categories = await fetchCategoriesWithNested(supabase, shop.id, { includeInactive: true })
  const products = countProducts(categories)
  const active = isShopSubscriptionActive(shop.plan_until)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de {shop.name}</h1>
      {!active && (
        <p className="rounded-xl border border-amber-600/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          Tu período de prueba terminó. La tienda puede dejar de mostrarse al público.{' '}
          <Link href="/dashboard/account" className="underline hover:text-amber-100">
            Ir a Cuenta
          </Link>{' '}
          para renovar o escribirnos por WhatsApp.
        </p>
      )}
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
          <p className="text-sm text-zinc-500">Visitas</p>
          <p className="text-lg font-semibold">{shop.view_count}</p>
        </article>
      </div>
      <div className="card space-y-2">
        <p className="text-sm text-zinc-400">Tu link público</p>
        <a href={shopPublicUrl(shop.slug)} className="text-brand-accent break-all hover:underline">
          {shopPublicUrl(shop.slug)}
        </a>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/dashboard/catalog" className="btn-primary text-sm">
            Editar catálogo
          </Link>
          <Link href="/dashboard/qr" className="rounded-xl border border-zinc-600 px-4 py-2 text-sm">
            Ver QR
          </Link>
        </div>
      </div>
    </div>
  )
}
