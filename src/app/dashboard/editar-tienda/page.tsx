import { StoreEditor } from '@/components/store-editor'
import { requireDashboardShop } from '@/lib/dashboard'
import { fetchCategoriesWithNested } from '@/lib/fetch-catalog'
import { createClient } from '@/lib/supabase/server'

export default async function EditarTiendaPage() {
  const shop = await requireDashboardShop()
  const supabase = await createClient()
  const categories = await fetchCategoriesWithNested(supabase, shop.id, { includeInactive: true })

  return <StoreEditor shop={shop} categories={categories} />
}
