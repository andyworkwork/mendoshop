import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { parseSharedCartItems } from '@/lib/shared-cart-items'

export type SharedCartItem = {
  product_id: string
  name: string
  unit_price: number
  quantity: number
  category_id?: string
  category_name?: string
  category_sort_order?: number
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items?: unknown; shop_id?: string }
    if (!body.shop_id || typeof body.shop_id !== 'string') {
      return NextResponse.json({ error: 'shop_id requerido' }, { status: 400 })
    }

    const parsed = parseSharedCartItems(body.items)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: shop } = await supabase
      .from('shops')
      .select('id, active, plan_until')
      .eq('id', body.shop_id)
      .maybeSingle()

    if (!shop?.active) {
      return NextResponse.json({ error: 'Tienda no disponible' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('shared_carts')
      .insert({ shop_id: body.shop_id, items: parsed.items })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ id: data.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'No se pudo guardar el carrito' }, { status: 500 })
  }
}
