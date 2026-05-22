'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProductDetails(
  shopId: string,
  productId: string,
  details: string | null,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const text = details?.trim() || null

  const { data: row, error: fetchErr } = await supabase
    .from('products')
    .select('id, shop_id')
    .eq('id', productId)
    .eq('shop_id', shopId)
    .maybeSingle()

  if (fetchErr) return { error: fetchErr.message }
  if (!row) return { error: 'Producto no encontrado.' }

  const { error } = await supabase
    .from('products')
    .update({ product_details: text })
    .eq('id', productId)
    .eq('shop_id', shopId)

  if (error) return { error: error.message }

  const { data: shop } = await supabase.from('shops').select('slug').eq('id', shopId).maybeSingle()
  if (shop?.slug) revalidatePath(`/tienda/${shop.slug}`)

  revalidatePath('/dashboard/catalog')
  return { ok: true }
}
