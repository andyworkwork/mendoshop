import { createServiceClient } from '@/lib/supabase/service'
import { consumeRateLimit, clientIpFromHeaders } from '@/lib/rate-limit'

/** Máx. 3 vistas contadas por IP y tienda cada hora. */
const VIEW_RATE = { maxHits: 3, windowSeconds: 3600 } as const

export async function recordShopViewIfAllowed(shopId: string, headers: Headers): Promise<void> {
  const ip = clientIpFromHeaders(headers)
  const bucket = `views:${shopId}:${ip}`
  const allowed = await consumeRateLimit(bucket, VIEW_RATE.maxHits, VIEW_RATE.windowSeconds)
  if (!allowed) return

  const service = createServiceClient()
  const { error } = await service.rpc('increment_shop_views', { p_shop_id: shopId })
  if (error) console.error('increment_shop_views', error.message)

  const { error: dailyErr } = await service.rpc('record_shop_view_daily', { p_shop_id: shopId })
  if (dailyErr) console.error('record_shop_view_daily', dailyErr.message)
}
