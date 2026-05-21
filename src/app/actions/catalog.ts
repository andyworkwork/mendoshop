'use server'

import { clampFocusPercent } from '@/lib/image-focus'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProductImageFocus(
  shopId: string,
  productId: string,
  focusX: number,
  focusY: number,
) {
  const supabase = await createClient()
  const { data: shop } = await supabase.from('shops').select('slug').eq('id', shopId).single()
  const { error } = await supabase
    .from('products')
    .update({
      image_focus_x: clampFocusPercent(focusX),
      image_focus_y: clampFocusPercent(focusY),
    })
    .eq('id', productId)
    .eq('shop_id', shopId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/editar-tienda')
  if (shop?.slug) revalidatePath(`/tienda/${shop.slug}`)
  return { ok: true }
}
