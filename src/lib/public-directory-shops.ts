import type { SupabaseClient } from '@supabase/supabase-js'
import { mapShopRow } from '@/lib/shops'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { ShopRow } from '@/types/shop'

function sortDirectoryShops(shops: ShopRow[], limit: number): ShopRow[] {
  const pro = shops.filter((s) => s.plan === 'pro')
  const rest = shops.filter((s) => s.plan !== 'pro')
  return [...pro, ...rest].slice(0, limit)
}

async function queryPublicDirectoryShops(
  supabase: SupabaseClient,
  limit: number,
): Promise<ShopRow[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('active', true)
    .or(`plan_until.is.null,plan_until.gt."${now}"`)
    .order('featured', { ascending: false })
    .order('view_count', { ascending: false })
    .limit(Math.max(limit * 3, limit))

  if (error) {
    console.error('queryPublicDirectoryShops', error.message)
    return []
  }

  return sortDirectoryShops(
    (data ?? []).map((r) => mapShopRow(r as Record<string, unknown>)),
    limit,
  )
}

/** Tiendas visibles en el directorio público (RLS shops_public_read; visitantes sin login). */
export async function fetchPublicDirectoryShops(limit = 24): Promise<ShopRow[]> {
  const supabase = await createClient()
  const publicRows = await queryPublicDirectoryShops(supabase, limit)
  if (publicRows.length > 0) return publicRows

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceKey) return publicRows

  return queryPublicDirectoryShops(createServiceClient(), limit)
}
