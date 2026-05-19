import { redirect } from 'next/navigation'
import { isPlatformAdmin } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'
import { fetchUserShops } from '@/lib/shops'
import type { ShopRow } from '@/types/shop'

export async function requireDashboardShop(): Promise<ShopRow> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const shops = await fetchUserShops(supabase)
  if (shops.length === 0) {
    if (await isPlatformAdmin()) redirect('/admin')
    redirect('/registro')
  }

  return shops[0]!
}
