import { createServiceClient } from '@/lib/supabase/service'

export type ShopViewStats = {
  views7d: number
  views30d: number
  totalViews: number
}

export type ProductViewStat = {
  id: string
  name: string
  detail_view_count: number
}

export async function fetchShopViewStats(shopId: string): Promise<ShopViewStats> {
  const service = createServiceClient()
  const now = new Date()
  const d7 = new Date(now)
  d7.setDate(d7.getDate() - 6)
  const d30 = new Date(now)
  d30.setDate(d30.getDate() - 29)

  const from30 = d30.toISOString().slice(0, 10)

  const [dailyRes, shopRes] = await Promise.all([
    service
      .from('shop_view_daily')
      .select('view_date, views')
      .eq('shop_id', shopId)
      .gte('view_date', from30),
    service.from('shops').select('view_count').eq('id', shopId).maybeSingle(),
  ])

  const rows = dailyRes.data ?? []
  const cutoff7 = d7.toISOString().slice(0, 10)

  let views7d = 0
  let views30d = 0
  for (const row of rows) {
    const v = Number(row.views) || 0
    views30d += v
    if (String(row.view_date) >= cutoff7) views7d += v
  }

  return {
    views7d,
    views30d,
    totalViews: Number(shopRes.data?.view_count ?? 0),
  }
}

export async function fetchTopProductsByDetailViews(
  shopId: string,
  limit = 5,
): Promise<ProductViewStat[]> {
  const service = createServiceClient()
  const { data } = await service
    .from('products')
    .select('id, name, detail_view_count')
    .eq('shop_id', shopId)
    .order('detail_view_count', { ascending: false })
    .limit(limit)

  return (data ?? []).filter((p) => (p.detail_view_count ?? 0) > 0) as ProductViewStat[]
}
