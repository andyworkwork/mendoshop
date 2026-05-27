import { Suspense } from 'react'
import { StoreEditor } from '@/components/store-editor'
import { requireDashboardShop } from '@/lib/dashboard'
import { isTemplateOnboardingDoneFromCookie } from '@/lib/first-steps'
import { countProducts, fetchCategoriesWithNested } from '@/lib/fetch-catalog'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function EditarTiendaPage() {
  const shop = await requireDashboardShop()
  const supabase = await createClient()
  const cookieStore = await cookies()
  const templateOnboardingDone = isTemplateOnboardingDoneFromCookie(cookieStore, shop.id)
  const categories = await fetchCategoriesWithNested(supabase, shop.id, { includeInactive: true })
  const productCount = countProducts(categories)

  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Cargando editor…</p>}>
      <StoreEditor
        shop={shop}
        categories={categories}
        productCount={productCount}
        templateOnboardingDone={templateOnboardingDone}
      />
    </Suspense>
  )
}
