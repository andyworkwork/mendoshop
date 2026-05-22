import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { fetchShopBySlug } from '@/lib/shops'
import { fetchCategoriesWithNested } from '@/lib/fetch-catalog'
import { isShopSubscriptionActive, planHasViewCount } from '@/lib/plans'
import { recordShopViewIfAllowed } from '@/lib/shop-views'
import { Storefront } from '@/components/storefront'

type Props = { params: Promise<{ slug: string }> }

/** Caché hasta que el dueño guarda cambios (revalidatePath en panel). */
export const revalidate = false

export default async function ShopPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const shop = await fetchShopBySlug(supabase, slug)

  if (!shop || !shop.active || !isShopSubscriptionActive(shop.plan_until)) {
    notFound()
  }

  if (planHasViewCount(shop.plan)) {
    await recordShopViewIfAllowed(shop.id, await headers())
  }

  const categories = await fetchCategoriesWithNested(supabase, shop.id)
  return <Storefront shop={shop} categories={categories} />
}
