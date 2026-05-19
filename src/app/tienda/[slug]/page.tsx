import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchShopBySlug } from '@/lib/shops'
import { fetchCategoriesWithNested } from '@/lib/fetch-catalog'
import { isShopSubscriptionActive } from '@/lib/plans'
import { Storefront } from '@/components/storefront'

type Props = { params: Promise<{ slug: string }> }

export default async function ShopPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const shop = await fetchShopBySlug(supabase, slug)

  if (!shop || !shop.active || !isShopSubscriptionActive(shop.plan_until)) {
    notFound()
  }

  await supabase.rpc('increment_shop_views', { p_shop_id: shop.id })

  const categories = await fetchCategoriesWithNested(supabase, shop.id)
  return <Storefront shop={shop} categories={categories} />
}
