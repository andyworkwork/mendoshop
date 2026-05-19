import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchShopBySlug } from '@/lib/shops'
import { shopMetadata } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const shop = await fetchShopBySlug(supabase, slug)
  if (!shop) return { title: 'Tienda no encontrada' }
  return shopMetadata(shop)
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
