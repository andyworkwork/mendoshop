import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { parseSharedCartItems } from '@/lib/shared-cart-items'
import {
  SHARED_CART_MAX_BODY_BYTES,
  SHARED_CART_RATE_LIMIT,
} from '@/lib/shared-cart-limits'
import { consumeRateLimit, clientIpFromHeaders } from '@/lib/rate-limit'

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
    const ip = clientIpFromHeaders(req.headers)
    const allowed = await consumeRateLimit(
      `carts:${ip}`,
      SHARED_CART_RATE_LIMIT.maxHits,
      SHARED_CART_RATE_LIMIT.windowSeconds,
    )
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá un momento.' }, { status: 429 })
    }

    const raw = await req.text()
    if (raw.length > SHARED_CART_MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Pedido demasiado grande' }, { status: 413 })
    }

    let body: { items?: unknown; shop_id?: string }
    try {
      body = JSON.parse(raw) as { items?: unknown; shop_id?: string }
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

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
      .select('id, access_token')
      .single()

    if (error) throw error
    return NextResponse.json({ id: data.id, token: data.access_token })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'No se pudo guardar el carrito' }, { status: 500 })
  }
}
