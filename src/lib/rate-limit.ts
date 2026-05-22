import { createServiceClient } from '@/lib/supabase/service'

export async function consumeRateLimit(
  bucket: string,
  maxHits: number,
  windowSeconds: number,
): Promise<boolean> {
  const service = createServiceClient()
  const { data, error } = await service.rpc('consume_rate_limit', {
    p_bucket: bucket.slice(0, 200),
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error('consume_rate_limit', error.message)
    return false
  }
  return data === true
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first.slice(0, 64)
  }
  const real = headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, 64)
  return 'unknown'
}
