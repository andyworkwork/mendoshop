import type { SupabaseClient } from '@supabase/supabase-js'
import type { ShopPlanGrant } from '@/types/plan-grant'

function mapGrant(raw: Record<string, unknown>): ShopPlanGrant {
  return {
    id: String(raw.id),
    shop_id: String(raw.shop_id),
    days_added: Number(raw.days_added),
    reason: String(raw.reason),
    created_at: String(raw.created_at),
    seen_at: (raw.seen_at as string | null) ?? null,
  }
}

export async function fetchUnseenPlanGrants(
  supabase: SupabaseClient,
  shopId: string,
): Promise<ShopPlanGrant[]> {
  const { data, error } = await supabase
    .from('shop_plan_grants')
    .select('id, shop_id, days_added, reason, created_at, seen_at')
    .eq('shop_id', shopId)
    .is('seen_at', null)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []).map((r) => mapGrant(r as Record<string, unknown>))
}

export async function markPlanGrantsSeen(
  supabase: SupabaseClient,
  grantIds: string[],
): Promise<void> {
  if (grantIds.length === 0) return
  await supabase
    .from('shop_plan_grants')
    .update({ seen_at: new Date().toISOString() })
    .in('id', grantIds)
}
