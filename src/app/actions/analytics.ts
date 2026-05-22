'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { consumeRateLimit } from '@/lib/rate-limit'

export async function recordProductDetailView(
  shopId: string,
  productId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!shopId || !productId) return { error: 'Datos inválidos.' }

  const allowed = await consumeRateLimit(`product-view:${productId}`, 30, 60)
  if (!allowed) return { ok: true }

  const service = createServiceClient()
  const { data: row } = await service
    .from('products')
    .select('id, detail_view_count')
    .eq('id', productId)
    .eq('shop_id', shopId)
    .eq('active', true)
    .maybeSingle()

  if (!row) return { error: 'Producto no encontrado.' }

  const next = (row.detail_view_count ?? 0) + 1
  const { error } = await service
    .from('products')
    .update({ detail_view_count: next })
    .eq('id', productId)
    .eq('shop_id', shopId)

  if (error) return { error: error.message }
  return { ok: true }
}
