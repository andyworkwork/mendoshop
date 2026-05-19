import { CatalogEditor } from '@/components/catalog-editor'
import { requireDashboardShop } from '@/lib/dashboard'
import { createClient } from '@/lib/supabase/server'
import { fetchCategoriesWithNested } from '@/lib/fetch-catalog'

export default async function DashboardCatalogPage() {
  const shop = await requireDashboardShop()
  const supabase = await createClient()
  const categories = await fetchCategoriesWithNested(supabase, shop.id, { includeInactive: true })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Catálogo</h1>
      <CatalogEditor shop={shop} initial={categories} />
    </div>
  )
}
