import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { fetchShopBySlug } from '@/lib/shops'
import { parseSharedCartItems } from '@/lib/shared-cart-items'
import { SharedCartView } from '@/components/shared-cart-view'
import { appBaseUrl } from '@/lib/publicUrl'
import { shopMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const shop = await fetchShopBySlug(supabase, slug)
  if (!shop) return { title: 'Carrito' }
  return { ...shopMetadata(shop), title: `Carrito — ${shop.name}` }
}

export default async function SharedCartPage({ params }: Props) {
  const { slug, id } = await params
  const supabase = await createClient()
  const shop = await fetchShopBySlug(supabase, slug)
  if (!shop) notFound()

  const service = createServiceClient()
  const { data: cart, error } = await service
    .from('shared_carts')
    .select('id, shop_id, items')
    .eq('id', id)
    .maybeSingle()

  if (error || !cart || cart.shop_id !== shop.id) notFound()

  const parsed = parseSharedCartItems(cart.items)
  if (!parsed.ok) notFound()

  const cartUrl = `${appBaseUrl()}/tienda/${slug}/c/${id}`

  return (
    <div className="min-h-screen shop-bg-gradient py-8">
      <SharedCartView shop={shop} items={parsed.items} cartUrl={cartUrl} />
    </div>
  )
}
